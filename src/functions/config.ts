import { APP_NAME, DEFAULT_SCHEDULE_FILE, DEFAULT_SETTINGS, FWORDS, LOCAL_PLATFORM } from "../constants.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { FknError } from "./error.ts";
import { BulkRemoveFiles, CheckForPath, JoinPaths, ParsePathList } from "./filesystem.ts";
import { parse as parseYaml } from "@std/yaml";
import { ColorString, Interrogate, LogStuff, StringifyYaml } from "./io.ts";
import { type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { format } from "@std/fmt/bytes";

/**
 * Returns file paths for all config files the app uses.
 *
 * @export
 * @param {("BASE" | "MOTHERFKRS" | "LOGS" | "SCHEDULE" | "SETTINGS" | "ERRORS" | "REM")} path What path you want.
 * @returns {string} The path as a string.
 */
export function GetAppPath(
    path: "BASE" | "MOTHERFKRS" | "LOGS" | "SCHEDULE" | "SETTINGS" | "ERRORS" | "REM",
): string {
    const appDataPath: string = LOCAL_PLATFORM.APPDATA;

    if (!validate(appDataPath) || !CheckForPath(appDataPath)) {
        throw new FknError(
            "Internal__NoEnvForConfigPath",
            `We searched for ${
                LOCAL_PLATFORM.SYSTEM === "windows" ? "APPDATA" : "XDG_CONFIG_HOME and HOME"
            } in your environment variables, but nothing was found.\nThis breaks the entire CLI, please report this on GitHub.`,
        );
    }

    const funny = FWORDS.MFS.toLowerCase().replace("*", "o").replace("*", "u");

    function formatDir(name: string) {
        return JoinPaths(BASE_DIR, `${APP_NAME.CLI}-${name}`);
    }

    const BASE_DIR = JoinPaths(appDataPath, APP_NAME.CLI);
    const PROJECTS = formatDir(`${funny}.txt`);
    const LOGS = formatDir("logs.log");
    const SCHEDULE = formatDir("schedule.yaml");
    const SETTINGS = formatDir("settings.yaml");
    const ERRORS = formatDir("errors.log");
    const REM = formatDir("rem.txt");

    if (path === "BASE") return BASE_DIR;
    if (path === "MOTHERFKRS") return PROJECTS;
    if (path === "LOGS") return LOGS;
    if (path === "SCHEDULE") return SCHEDULE;
    if (path === "SETTINGS") return SETTINGS;
    if (path === "ERRORS") return ERRORS;
    if (path === "REM") return REM;
    throw new Error(`Invalid config path ${path} requested.`);
}

/**
 * Check if config files are present, create them otherwise ("Fresh Setup").
 *
 * @export
 * @returns {void}
 */
export function FreshSetup(repairSetts?: boolean): void {
    const basePath = GetAppPath("BASE");
    if (!CheckForPath(basePath)) {
        Deno.mkdirSync(basePath, { recursive: true });
    }

    const projectPath = GetAppPath("MOTHERFKRS");
    if (!CheckForPath(projectPath)) {
        Deno.writeTextFileSync(projectPath, "", {
            create: true,
        });
    }

    const logsPath = GetAppPath("LOGS");
    if (!CheckForPath(logsPath)) {
        Deno.writeTextFileSync(logsPath, "", {
            create: true,
        });
    }

    const errorLogsPath = GetAppPath("ERRORS");
    if (!CheckForPath(errorLogsPath)) {
        Deno.writeTextFileSync(errorLogsPath, "", {
            create: true,
        });
    }

    const settingsPath = GetAppPath("SETTINGS");
    if ((!CheckForPath(settingsPath) || repairSetts === true)) {
        Deno.writeTextFileSync(settingsPath, StringifyYaml(DEFAULT_SETTINGS), {
            create: true,
        });
    }

    const schedulePath = GetAppPath("SCHEDULE");
    if (!CheckForPath(schedulePath)) {
        Deno.writeTextFileSync(schedulePath, StringifyYaml(DEFAULT_SCHEDULE_FILE), {
            create: true,
        });
    }

    const remPath = GetAppPath("REM");
    if (!CheckForPath(remPath)) {
        Deno.writeTextFileSync(remPath, "", {
            create: true,
        });
    }

    const toBeRemoved = ParsePathList(Deno.readTextFileSync(remPath));

    if (toBeRemoved.length === 0) return;

    BulkRemoveFiles(toBeRemoved);

    return;
}

/**
 * Returns current user settings.
 *
 * @export
 * @returns {FKNODE_SETTINGS}
 */
export function GetUserSettings(): CF_FKNODE_SETTINGS {
    const path = GetAppPath("SETTINGS");
    const stuff: CF_FKNODE_SETTINGS = parseYaml(Deno.readTextFileSync(path)) as CF_FKNODE_SETTINGS;
    if (!stuff.flushFreq || !stuff.defaultManager || !stuff.defaultIntensity || !stuff.favEditor || !stuff.updateFreq) {
        const newStuff: CF_FKNODE_SETTINGS = {
            flushFreq: stuff.flushFreq ?? DEFAULT_SETTINGS.flushFreq,
            updateFreq: stuff.updateFreq ?? DEFAULT_SETTINGS.updateFreq,
            favEditor: stuff.favEditor ?? DEFAULT_SETTINGS.favEditor,
            defaultIntensity: stuff.defaultIntensity ?? DEFAULT_SETTINGS.defaultIntensity,
            defaultManager: stuff.defaultManager ?? DEFAULT_SETTINGS.defaultManager,
        };
        Deno.writeTextFileSync(path, StringifyYaml(newStuff));
        return newStuff;
    }
    return stuff;
}

type setting = keyof CF_FKNODE_SETTINGS;

export const VALID_SETTINGS: setting[] = ["defaultIntensity", "updateFreq", "favEditor", "flushFreq"];

/**
 * Changes a given user setting to a given value.
 *
 * @export
 * @param {setting} setting Setting to change.
 * @param {UnknownString} value Value to set it to.
 * @returns {void}
 */
export function ChangeSetting(
    setting: setting,
    value: UnknownString,
): void {
    const settingsPath = GetAppPath("SETTINGS");
    const currentSettings = GetUserSettings();

    if (setting === "defaultIntensity") {
        if (!validateAgainst(value, ["normal", "hard", "hard-only", "maxim", "maxim-only"])) {
            LogStuff(`${value} is not valid. Enter either 'normal', 'hard', 'hard-only', or 'maxim'.`);
            return;
        }
        const newSettings: CF_FKNODE_SETTINGS = {
            ...currentSettings,
            defaultIntensity: value,
        };
        Deno.writeTextFileSync(
            settingsPath,
            StringifyYaml(newSettings),
        );
    } else if (setting === "updateFreq") {
        const newValue = Math.ceil(Number(value));
        if (typeof newValue !== "number" || isNaN(newValue) || newValue <= 0) {
            LogStuff(`${value} is not valid. Enter a valid number greater than 0.`);
            return;
        }
        const newSettings: CF_FKNODE_SETTINGS = {
            ...currentSettings,
            updateFreq: Math.ceil(newValue),
        };
        Deno.writeTextFileSync(
            settingsPath,
            StringifyYaml(newSettings),
        );
    } else if (setting === "favEditor") {
        if (!validateAgainst(value, ["vscode", "sublime", "emacs", "atom", "notepad++", "vscodium"])) {
            LogStuff(
                `${value} is not valid. Enter either:\n'vscode', 'sublime', 'emacs', 'atom', 'notepad++', or 'vscodium'.`,
            );
            return;
        }
        const newSettings: CF_FKNODE_SETTINGS = {
            ...currentSettings,
            favEditor: value,
        };
        Deno.writeTextFileSync(
            settingsPath,
            StringifyYaml(newSettings),
        );
    } else if (setting === "flushFreq") {
        const newValue = Math.ceil(Number(value));
        if (typeof newValue !== "number" || isNaN(newValue) || newValue <= 0) {
            LogStuff(`${value} is not valid. Enter a valid number greater than 0.`);
            return;
        }
        const newSettings: CF_FKNODE_SETTINGS = {
            ...currentSettings,
            flushFreq: newValue,
        };
        Deno.writeTextFileSync(
            settingsPath,
            StringifyYaml(newSettings),
        );
    } else {
        if (!validateAgainst(value, ["npm", "pnpm", "yarn", "bun", "deno", "cargo", "go"])) {
            LogStuff(`${value} is not valid. Enter a valid package manager (npm, pnpm, yarn, bun, deno, cargo, go).`);
            return;
        }
        if (["cargo", "go"].includes(value)) {
            if (
                !Interrogate(
                    `Are you sure? ${value} is a non-JS runtime and ${APP_NAME.CASED} is mainly a JS-related CLI; you'll be using JS projects more often.`,
                )
            ) return;
        }
        const newSettings: CF_FKNODE_SETTINGS = {
            ...currentSettings,
            defaultManager: value,
        };
        Deno.writeTextFileSync(
            settingsPath,
            StringifyYaml(newSettings),
        );
    }

    LogStuff(`Settings successfully updated! ${setting} is now ${value}`, "tick-clear");

    return;
}

/**
 * Formats user settings and logs them.
 *
 * @returns {void}
 */
export function DisplaySettings(): void {
    const settings = GetUserSettings();

    const formattedSettings = [
        `Update frequency: Each ${ColorString(settings.updateFreq, "bright-green")} days. ${ColorString("updateFreq", "half-opaque", "italic")}`,
        `Default cleaner intensity: ${ColorString(settings.defaultIntensity, "bright-green")}. ${
            ColorString("defaultIntensity", "half-opaque", "italic")
        }`,
        `Favorite editor: ${ColorString(settings.favEditor, "bright-green")}. ${ColorString("favEditor", "half-opaque", "italic")}`,
        `Auto-flush log file frequency: Each ${ColorString(settings.flushFreq, "bright-green")} days. ${
            ColorString("flushFreq", "half-opaque", "italic")
        }`,
    ].join("\n");

    LogStuff(`${ColorString("Your current settings are:", "bright-yellow")}\n---\n${formattedSettings}`, "bulb");
}

/**
 * Flushes configuration files.
 *
 * @export
 * @param {UnknownString} target What to flush.
 * @param {boolean} force If true no confirmation prompt will be shown.
 * @param {boolean} [silent=false] If true no success message will be shown.
 * @returns {void}
 */
export function FlushConfigFiles(target: UnknownString, force: boolean, silent: boolean = false): void {
    if (!validateAgainst(target, ["logs", "projects", "schedules", "errors", "all"])) {
        LogStuff(
            "Specify what to flush. Either 'logs', 'projects', 'schedules', 'errors', or 'all'.",
            "warn",
        );
        return;
    }

    let file: string[];

    if (target === "logs") file = [GetAppPath("LOGS")];
    else if (target === "projects") file = [GetAppPath("MOTHERFKRS")];
    else if (target === "schedules") file = [GetAppPath("SCHEDULE")];
    else if (target === "errors") file = [GetAppPath("ERRORS")];
    else {
        file = [
            GetAppPath("LOGS"),
            GetAppPath("MOTHERFKRS"),
            GetAppPath("SCHEDULE"),
            GetAppPath("ERRORS"),
        ];
    }

    const fileSize = typeof file === "string"
        ? Deno.statSync(file).size
        : (file.map((item) => Deno.statSync(item).size)).reduce((acc, num) => acc + num, 0);

    if (
        !force &&
        !Interrogate(
            `Are you sure you want to clean your ${target} file? You'll recover ${format(fileSize)}.`,
        )
    ) return;

    BulkRemoveFiles(file);
    if (!silent) LogStuff("That worked out!", "tick-clear");
    return;
}
