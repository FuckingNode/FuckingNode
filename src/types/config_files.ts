import { validate } from "@zakahacecosas/string-utils";
import type { CleanerIntensity } from "./config_params.ts";
import type { NonEmptyArray } from "./misc.ts";
import type { MANAGER_GLOBAL } from "./platform.ts";

/**
 * Supported code editors.
 */
export type SUPPORTED_EDITORS = "vscode" | "sublime" | "emacs" | "notepad++" | "atom" | "vscodium";

/**
 * User config
 *
 * @interface CF_FKNODE_SETTINGS
 */
export interface CF_FKNODE_SETTINGS {
    /**
     * How often should the CLI check for updates.
     *
     * @type {number}
     */
    "update-freq": number;
    /**
     * Default cleaner intensity, for running `clean` with no args.
     *
     * @type {CleanerIntensity}
     */
    "default-intensity": CleanerIntensity;
    /**
     * User's favorite code editor.
     *
     * @type {SUPPORTED_EDITORS}
     */
    "fav-editor": SUPPORTED_EDITORS;
    /**
     * Default package manager / runtime to use for features like `kickstart`.
     *
     * @type {MANAGER_GLOBAL}
     */
    "default-manager": MANAGER_GLOBAL;
    /**
     * If true notifications are shown only if a task takes more than 30 seconds. Else, they're always shown.
     *
     * @type {boolean}
     */
    "notification-threshold": boolean;
    /**
     * If true, notifications are shown for certain tasks upon completion.
     *
     * @type {boolean}
     */
    "notifications": boolean;
    /**
     * Duration, in milliseconds, of notifications' threshold.
     *
     * @type {number}
     */
    "notification-threshold-value": number;
    /**
     * Whether to always short-circuit cleanup on errors.
     *
     * @type {boolean}
     */
    "always-short-circuit-cleanup": boolean;
    /**
     * If set, kickstart will always use this directory as the root for cloned projects.
     *
     * @type {(string | null)}
     */
    "kickstart-root": string | null;
    /**
     * If set, adding a project will automatically handle workspaces (if any) like this.
     *
     * @type {("standalone" | "unified" | null)}
     */
    "workspace-policy": "standalone" | "unified" | null;
}

/**
 * A config file for scheduled tasks.
 *
 * @interface CF_FKNODE_SCHEDULE
 */
export interface CF_FKNODE_SCHEDULE {
    /**
     * Updates.
     *
     * @type {{
     *         latestVer: string;
     *         lastCheck: string;
     *     }}
     */
    updater: {
        latestVer: string;
        lastCheck: string;
    };
}

/** A single `CmdSet` instruction. */
export type CmdInstruction = `\$${string}` | `~${string}` | `=${string}` | `<${string}` | null;
export type ParsedCmdInstruction = { type: "<" | "~" | "$" | "="; cmd: NonEmptyArray<string> };
export type CrossPlatformParsedCmdInstruction = {
    msft: ParsedCmdInstruction | null;
    posix: ParsedCmdInstruction | null;
};
// deno-lint-ignore explicit-module-boundary-types no-explicit-any
export function IsCPCmdInstruction(a: any): a is CrossPlatformParsedCmdInstruction {
    if (!a.msft && !a.posix) return false;
    return ((a.msft && a.msft.type && typeof a.msft.type === "string" && validate(a.msft.type))
        || (a.posix && a.posix.type && typeof a.posix.type === "string" && validate(a.posix.type)));
}
export type CmdSet = (CmdInstruction | { posix: CmdInstruction; msft: CmdInstruction })[];

/** An `fknode.yaml` file for configuring individual projects */
export type FkNodeYaml = Partial<FullFkNodeYaml>;

/** Full specification of the `fknode.yaml` file, for configuring individual projects */
export interface FullFkNodeYaml {
    /**
     * Divine protection, basically to ignore stuff. Must be an array of options, or `"*"`.
     *
     * @type {(("updater" | "cleaner" | "linter" | "prettifier" | "destroyer")[] | "*")}
     */
    divineProtection: ("updater" | "cleaner" | "linter" | "prettifier" | "destroyer")[] | "*";
    /**
     * If true, the cleaner will short-circuit whenever an error happens on any task. Defaults to false.
     *
     * @type {boolean}
     */
    cleanerShortCircuit: boolean;
    /**
     * If `--lint` is passed to `clean`, this script will be used to lint the project. It must be a runtime script (defined in `package.json` -> `scripts`), and must be a single word (no need for "npm run" prefix). `false` overrides these rules (it's the default).
     *
     * @type {(string | false)}
     */
    lintScript: string | false;
    /**
     * If `--pretty` is passed to `clean`, this script will be used to prettify the project. It must be a runtime script (defined in `package.json` -> `scripts`), and must be a single word (no need for "npm run" prefix). `false` overrides these rules (it's the default).
     *
     * @type {(string | false)}
     */
    prettyScript: string | false;
    /**
     * If provided, file paths in `targets` will be removed when `clean` is called with any of the `intensities`. If not provided defaults to `maxim` intensity and `node_modules` path. Specifying `targets` _without_ `node_modules` does not override it, meaning it'll always be cleaned.
     *
     * @type {null | {
     *         intensities: (CleanerIntensity | "*")[],
     *         targets: string[]
     *     }}
     */
    destroy: null | {
        /**
         * Intensities the destroyer should run at.
         *
         * @type {CleanerIntensity[] | "*"}
         */
        intensities: CleanerIntensity[] | "*";
        /**
         * Targets to be destroyed. Must be paths either relative to the **root** of the project or absolute.
         *
         * @type {string[]}
         */
        targets: string[];
    };
    /**
     * If true, if an action that changes the code is performed (update, prettify, or destroy) and the Git workspace is clean (no uncommitted stuff), a commit will be made.
     *
     * @type {boolean}
     */
    commitActions: boolean;
    /**
     * If provided, if a commit is made (`commitActions`) this will be the commit message. If not provided a default message is used.
     *
     * @type {(string | false)}
     */
    commitMessage: string | false;
    /**
     * If provided, uses the provided runtime script command for the updating stage, overriding the default command. Like `lintScript` or `prettyScript`, it must be a runtime script.
     *
     * @type {(string | false)}
     */
    updaterOverride: string | false;
    /**
     * Flagless features.
     *
     * @type {{
     *         flaglessUpdate: boolean;
     *         flaglessDestroy: boolean;
     *         flaglessLint: boolean;
     *         flaglessPretty: boolean;
     *         flaglessCommit: boolean;
     *     }}
     */
    flagless: {
        flaglessUpdate: boolean;
        flaglessDestroy: boolean;
        flaglessLint: boolean;
        flaglessPretty: boolean;
        flaglessCommit: boolean;
    };
    /**
     * A task (run) to be executed upon running the release command.
     *
     * @type {CmdSet | false}
     */
    releaseCmd: CmdSet | false;
    /**
     * If true, releases will always use `dry-run`.
     *
     * @type {boolean}
     */
    releaseAlwaysDry: boolean;
    /**
     * A CmdSet to be executed upon running the commit command.
     *
     * @type {CmdSet | false}
     */
    commitCmd: CmdSet | false;
    /**
     * A CmdSet to be executed upon running the launch command.
     *
     * @type {CmdSet | false}
     */
    launchCmd: CmdSet | false;
    /**
     * If specified, this will override FkNode's project environment inference.
     *
     * @type {MANAGER_GLOBAL | false}
     */
    projectEnvOverride: MANAGER_GLOBAL | false;
    /**
     * Command(s) to be executed when running the `build` command.
     *
     * @type {CmdSet | false}
     */
    buildCmd: CmdSet | false;
    /**
     * If true, `buildCmd` is invoked before releasing.
     *
     * @type {boolean}
     */
    buildForRelease: boolean;
    /**
     * Defaults for when kickstarting this project.
     *
     * @type {{
     *         workspaces: "force-liberty" | "libre" | "unified" | "standalone";
     *         install: "force-liberty" | "libre" | "no" | `use ${string}`;
     *     }}
     */
    kickstarter: {
        /** Default handling for workspaces.
         *
         * - `null` - Lets the user decide. Default FuckingNode behavior.
         * - `"force-liberty"` - Lets and forces the user to decide, even if they have a default setting.
         * - `"unified"` - Equivalent to hitting 'No' in the default prompt. Adds the root project and nothing else.
         * - `"standalone"` - Equivalent to hitting 'Yes' in the default prompt. Adds the workspaces individually.
         */
        workspaces: null | "force-liberty" | "unified" | "standalone";
        /** Default handling for dependencies.
         *
         * - `null` - Lets the user "decide". Default FuckingNode behavior. Cannot enforce it.
         * - `"no"` - Doesn't try to install anything. Useful for non-code repositories.
         * - `"use (cmd)"` - Prompts the user to use a specific install command. The user can accept or reject it (in which case the kickstart will halt).
         */
        install: null | "no" | `use ${string}`;
    };
    /** An optional CmdSet to run after a kickstart. Users will be shown the content and always be prompted whether to allow it to run or not. */
    kickstartCmd: null | CmdSet;
}

/**
 * Validates if whatever you pass to this is a valid FkNodeYaml file.
 *
 * @param {*} obj Whatever
 * @returns {obj is FkNodeYaml}
 */
export function ValidateFkNodeYaml(
    // deno-lint-ignore explicit-module-boundary-types no-explicit-any
    obj: any,
): obj is FkNodeYaml {
    if (!obj || typeof obj !== "object") return false;

    if (
        obj.divineProtection !== undefined
        && obj.divineProtection !== "*"
        && !(
            Array.isArray(obj.divineProtection)
            && obj.divineProtection.every(
                (item: string) => {
                    return ["updater", "cleaner", "linter", "prettifier", "destroyer"].includes(item);
                },
            )
        )
    ) {
        return false;
    }

    if (
        obj.lintScript !== undefined && typeof obj.lintScript !== "string"
    ) {
        return false;
    }

    if (
        obj.prettyScript !== undefined && typeof obj.prettyScript !== "string"
    ) {
        return false;
    }

    if (obj.destroy !== undefined) {
        if (
            typeof obj.destroy !== "object"
            || !Array.isArray(obj.destroy.targets)
            || !obj.destroy.targets.every(
                // deno-lint-ignore no-explicit-any
                (target: any) => typeof target === "string",
            )
            || !(
                obj.destroy.intensities === "*"
                || (Array.isArray(obj.destroy.intensities)
                    && obj.destroy.intensities.every(
                        // deno-lint-ignore no-explicit-any
                        (intensity: any) => {
                            return ["normal", "hard", "hard-only", "maxim", "maxim-only", "*"].includes(intensity);
                        },
                    ))
            )
        ) {
            return false;
        }
    }

    if (obj.commitActions !== undefined && typeof obj.commitActions !== "boolean") return false;

    if (
        obj.commitMessage !== undefined
        && typeof obj.commitMessage !== "string"
    ) {
        return false;
    }

    if (
        obj.updaterOverride !== undefined
        && typeof obj.updaterOverride !== "string"
    ) {
        return false;
    }

    if (obj.flagless !== undefined) {
        if (typeof obj.flagless !== "object" || obj.flagless === null) return false;

        const validKeys = ["flaglessUpdate", "flaglessDestroy", "flaglessLint", "flaglessPretty", "flaglessCommit"];
        for (const [key, value] of Object.entries(obj.flagless)) if (!validKeys.includes(key) || typeof value !== "boolean") return false;
    }

    if (obj.commitCmd !== undefined && !Array.isArray(obj.commitCmd)) return false;

    if (obj.releaseCmd !== undefined && !Array.isArray(obj.releaseCmd)) return false;

    if (obj.buildCmd !== undefined && !Array.isArray(obj.buildCmd)) return false;

    if (obj.launchCmd !== undefined && !Array.isArray(obj.launchCmd)) return false;

    if (obj.releaseAlwaysDry !== undefined && typeof obj.releaseAlwaysDry !== "boolean") return false;

    return true;
}
