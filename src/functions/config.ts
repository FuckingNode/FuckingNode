import * as DenoJson from "../../deno.json" with { type: "json" };
import { GetDateNow } from "../functions/date.ts";
import { DEFAULT_SETTINGS } from "../constants.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { FknError } from "./error.ts";
import { BulkRemove, CheckForPath, JoinPaths } from "./filesystem.ts";
import { parse as parseYaml } from "@std/yaml";
import { Interrogate, LogStuff, StringifyYaml } from "./io.ts";
import { type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { format } from "@std/fmt/bytes";
import { LOCAL_PLATFORM } from "../platform.ts";
import { ColorString } from "./color.ts";

/**
 * Returns file paths for all config files the app uses.
 *
 * @async
 * @param {("BASE" | "MOTHERFKRS" | "SCHEDULE" | "SETTINGS" | "ERRORS" | "NODES")} path What path you want.
 * @returns {string} The path as a string.
 */
export function GetAppPath(
    path: "BASE" | "MOTHERFKRS" | "SCHEDULE" | "SETTINGS" | "ERRORS" | "NODES",
): string {
    if (!validate(LOCAL_PLATFORM.APPDATA)) {
        throw new FknError(
            "Os__NoAppdataNoHome",
            `We searched for ${
                LOCAL_PLATFORM.SYSTEM === "msft" ? "APPDATA" : "XDG_CONFIG_HOME and HOME"
            } in your environment variables, but nothing was found.\nThis breaks the entire CLI, please report this on GitHub.`,
        );
    }

    const BASE_DIR = JoinPaths(LOCAL_PLATFORM.APPDATA, "fuckingnode");

    if (path === "MOTHERFKRS") return JoinPaths(BASE_DIR, "fuckingnode-motherfuckers.txt");
    if (path === "SCHEDULE") return JoinPaths(BASE_DIR, "fuckingnode-schedule.yaml");
    if (path === "SETTINGS") return JoinPaths(BASE_DIR, "fuckingnode-settings.yaml");
    if (path === "ERRORS") return JoinPaths(BASE_DIR, "fuckingnode-errors.log");
    if (path === "NODES") return JoinPaths(BASE_DIR, "fuckingnode-nodes/");
    else return BASE_DIR;
}

/**
 * Check if config files are present, create them otherwise ("Fresh Setup").
 */
export async function FreshSetup(repairSetts?: boolean): Promise<void> {
    const basePath = GetAppPath("BASE");
    const projectPath = GetAppPath("MOTHERFKRS");
    const errorLogsPath = GetAppPath("ERRORS");
    const settingsPath = GetAppPath("SETTINGS");
    const schedulePath = GetAppPath("SCHEDULE");

    const tasks: Promise<void>[] = [];

    if (!CheckForPath(basePath)) {
        tasks.push(Deno.mkdir(basePath, { recursive: true }));
    }

    if (!CheckForPath(projectPath)) {
        tasks.push(Deno.writeTextFile(projectPath, "", { create: true }));
    }

    if (!CheckForPath(errorLogsPath)) {
        tasks.push(Deno.writeTextFile(errorLogsPath, "", { create: true }));
    }

    if (!CheckForPath(settingsPath) || repairSetts) {
        tasks.push(Deno.writeTextFile(settingsPath, StringifyYaml(DEFAULT_SETTINGS), { create: true }));
    }

    if (!CheckForPath(schedulePath)) {
        tasks.push(Deno.writeTextFile(
            schedulePath,
            StringifyYaml({
                updater: {
                    latestVer: DenoJson.default.version,
                    lastCheck: GetDateNow(),
                },
                flusher: {
                    lastFlush: GetDateNow(),
                },
            }),
            { create: true },
        ));
    }

    await Promise.all(tasks);

    return;
}

/**
 * Returns current user settings.
 *
 * @returns {CF_FKNODE_SETTINGS}
 */
export function GetUserSettings(): CF_FKNODE_SETTINGS {
    const stuff: CF_FKNODE_SETTINGS = parseYaml(Deno.readTextFileSync(GetAppPath("SETTINGS"))) as CF_FKNODE_SETTINGS;
    return {
        ...DEFAULT_SETTINGS,
        ...stuff,
    };
}

/**
 * Changes a given user setting to a given value.
 *
 * @param {setting} setting Setting to change.
 * @param {UnknownString} value Value to set it to.
 */
export function ChangeSetting(
    setting: keyof CF_FKNODE_SETTINGS,
    value: UnknownString,
): void {
    const settingsPath = GetAppPath("SETTINGS");
    const currentSettings = GetUserSettings();

    let newSettings: CF_FKNODE_SETTINGS | undefined;

    if (setting === "default-intensity") {
        if (!validateAgainst(value, ["normal", "hard", "hard-only", "maxim", "maxim-only"])) {
            return LogStuff(`${value} is not valid. Enter either 'normal', 'hard', 'hard-only', or 'maxim'.`);
        }
        newSettings = { ...currentSettings, "default-intensity": value };
    } else if (setting === "default-manager") {
        if (!validateAgainst(value, ["npm", "pnpm", "yarn", "deno", "bun", "cargo", "go"])) {
            return LogStuff(`${value} is not valid. Enter either "npm", "pnpm", "yarn", "deno", "bun", "cargo", or "go".`);
        }
        newSettings = { ...currentSettings, "default-manager": value };
    } else if (setting === "update-freq") {
        const freq = Math.ceil(Number(value));
        if (!Number.isFinite(freq) || freq <= 0) return LogStuff(`${value} is not valid. Enter a valid number greater than 0.`);
        newSettings = { ...currentSettings, "update-freq": freq };
    } else if (setting === "notification-threshold-value") {
        const freq = Math.ceil(Number(value));
        if (!Number.isFinite(freq) || freq <= 1000) return LogStuff(`${value} is not valid. Enter a valid number greater than 1000.`);
        newSettings = { ...currentSettings, "notification-threshold-value": freq };
    } else if (setting === "fav-editor") {
        if (!validateAgainst(value, ["vscode", "sublime", "emacs", "atom", "notepad++", "vscodium"])) {
            return LogStuff(`${value} is not valid. Enter one of: vscode, sublime, emacs, atom, notepad++, vscodium.`);
        }
        newSettings = { ...currentSettings, "fav-editor": value };
    } else if (setting === "flush-freq") {
        const flush = Math.ceil(Number(value));
        if (!Number.isFinite(flush) || flush <= 0) return LogStuff(`${value} is not valid. Enter a valid number greater than 0.`);
        newSettings = { ...currentSettings, "flush-freq": flush };
    } else if (setting === "notifications") {
        if (!validateAgainst(value, ["true", "false"])) return LogStuff(`${value} is not valid. Enter either 'true' or 'false'.`);
        newSettings = { ...currentSettings, notifications: value === "true" };
    } else if (setting === "notification-threshold") {
        if (!validateAgainst(value, ["true", "false"])) return LogStuff(`${value} is not valid. Enter either 'true' or 'false'.`);
        newSettings = { ...currentSettings, "notification-threshold": value === "true" };
    } else {
        if (!validateAgainst(value, ["npm", "pnpm", "yarn", "bun", "deno", "cargo", "go"])) {
            return LogStuff(`${value} is not valid. Enter a valid package manager (npm, pnpm, yarn, bun, deno, cargo, go).`);
        }
        if (
            ["cargo", "go"].includes(value)
            && !Interrogate(
                `Are you sure? ${value} is a non-JS runtime and FuckingNode is mainly a JS-related CLI; you'll be using JS projects more often.`,
            )
        ) return;
        newSettings = { ...currentSettings, "default-manager": value };
    }

    if (newSettings) {
        Deno.writeTextFileSync(settingsPath, StringifyYaml(newSettings));
        LogStuff(`Settings successfully updated! ${setting} is now ${value}`, "tick-clear");
    }

    return;
}

/**
 * Formats user settings and logs them.
 */
export function DisplaySettings(): void {
    const settings = GetUserSettings();

    const formattedSettings = [
        `Check for updates             | Every ${ColorString(settings["update-freq"], "bright-green")} days. ${
            ColorString("update-freq", "half-opaque", "italic")
        }`,
        `Default cleaner intensity     | ${ColorString(settings["default-intensity"], "bright-green")}. ${
            ColorString("default-intensity", "half-opaque", "italic")
        }`,
        `Default package manager       | ${ColorString(settings["default-manager"], "bright-green")}. ${
            ColorString("default-manager", "half-opaque", "italic")
        }`,
        `Favorite code editor          | ${ColorString(settings["fav-editor"], "bright-green")}. ${
            ColorString("fav-editor", "half-opaque", "italic")
        }`,
        `Auto-flush log file           | Every ${ColorString(settings["flush-freq"], "bright-green")} days. ${
            ColorString("flush-freq", "half-opaque", "italic")
        }`,
        `Send system notifications     | ${ColorString(settings["notifications"] ? "Enabled" : "Disabled", "bright-green")}. ${
            ColorString("notifications", "half-opaque", "italic")
        }`,
        `Threshold notifications?      | ${ColorString(settings["notification-threshold"] ? "Enabled" : "Disabled", "bright-green")}. ${
            ColorString("notification-threshold", "half-opaque", "italic")
        }`,
        `Notification threshold        | ${ColorString(settings["notification-threshold-value"], "bright-green")} milliseconds. ${
            ColorString("notification-threshold", "half-opaque", "italic")
        }`,
    ].join("\n");

    LogStuff(`${ColorString("Your current settings are:", "bright-yellow")}\n---\n${formattedSettings}`, "bulb");
}

/**
 * Flushes configuration files.
 *
 * @async
 * @param {UnknownString} target What to flush.
 * @param {boolean} force If true no confirmation prompt will be shown.
 * @param {boolean} [silent=false] If true no success message will be shown.
 */
export async function FlushConfigFiles(target: UnknownString, force: boolean, silent: boolean = false): Promise<void> {
    if (!validateAgainst(target, ["projects", "schedules", "errors", "all"])) {
        LogStuff(
            "Specify what to flush. Either 'projects', 'schedules', 'errors', or 'all'.",
            "warn",
        );
        return;
    }

    let file: string[];

    if (target === "projects") file = [GetAppPath("MOTHERFKRS")];
    else if (target === "schedules") file = [GetAppPath("SCHEDULE")];
    else if (target === "errors") file = [GetAppPath("ERRORS")];
    else {
        file = [
            GetAppPath("MOTHERFKRS"),
            GetAppPath("SCHEDULE"),
            GetAppPath("ERRORS"),
        ];
    }

    const fileSize = (await Promise.all(file.map((item) => Deno.stat(item)))).reduce((acc, num) => acc + num.size, 0);

    if (
        !force
        && !Interrogate(
            `Are you sure you want to clean your ${target} file? You'll recover ${format(fileSize)}.`,
        )
    ) return;

    await BulkRemove(file);
    if (!silent) LogStuff("That worked out!", "tick-clear");
    return;
}
