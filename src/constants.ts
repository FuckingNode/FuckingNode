import type { VALID_URL } from "./types/misc.ts";
import type { CF_FKNODE_SCHEDULE, CF_FKNODE_SETTINGS, FullFkNodeYaml } from "./types/config_files.ts";
import * as DenoJson from "../deno.json" with { type: "json" };
import { GetDateNow } from "./functions/date.ts";
import { normalize, type UnknownString } from "@zakahacecosas/string-utils";
import { ManagerExists } from "./functions/cli.ts";
import { APP_NAME } from "./constants/name.ts";

/** Full, cased name of the app in NAME vVERSION format. */
export const FULL_NAME: string = `${APP_NAME.CASED} v${DenoJson.default.version}`;

/** URLs have trailing slash (`url.com/`) */
export const APP_URLs: { REPO: VALID_URL; WEBSITE: VALID_URL } = {
    REPO: "https://github.com/FuckingNode/FuckingNode/",
    WEBSITE: "https://fuckingnode.github.io/",
};

/**
 * GitHub REST API URL from where releases are obtained.
 *
 * @type {VALID_URL}
 */
export const RELEASE_URL: VALID_URL = `https://api.github.com/repos/ZakaHaceCosas/${APP_NAME.CASED}/releases/latest`;

/**
 * Default app settings.
 *
 * @type {CF_FKNODE_SETTINGS}
 */
export const DEFAULT_SETTINGS: CF_FKNODE_SETTINGS = {
    updateFreq: 5,
    flushFreq: 14,
    defaultIntensity: "normal",
    favEditor: "vscode",
    defaultManager: ManagerExists("pnpm") ? "pnpm" : "npm",
};

/**
 * Scheduled tasks config file.
 *
 * @type {CF_FKNODE_SCHEDULE}
 */
export const DEFAULT_SCHEDULE_FILE: CF_FKNODE_SCHEDULE = {
    updater: {
        latestVer: DenoJson.default.version,
        lastCheck: GetDateNow(),
    },
    flusher: {
        lastFlush: GetDateNow(),
    },
};

/**
 * Default project settings.
 *
 * @type {FullFkNodeYaml}
 */
export const DEFAULT_FKNODE_YAML: FullFkNodeYaml = {
    divineProtection: "disabled",
    lintCmd: "__USE_DEFAULT",
    prettyCmd: "__USE_DEFAULT",
    destroy: {
        intensities: ["maxim"],
        targets: [
            "dist/",
            "out/",
        ],
    },
    commitActions: false,
    commitMessage: "__USE_DEFAULT",
    commitCmd: "__DISABLE",
    updateCmdOverride: "__USE_DEFAULT",
    flagless: {
        flaglessUpdate: false,
        flaglessLint: false,
        flaglessPretty: false,
        flaglessDestroy: false,
        flaglessCommit: false,
    },
    releaseAlwaysDry: false,
    releaseCmd: "__DISABLE",
    launchCmd: "__DISABLE",
    launchFile: "__DISABLE",
    launchWithUpdate: false,
    projectEnvOverride: "__USE_DEFAULT",
    buildCmd: "__DISABLE",
    buildForRelease: false,
};

/** Checks if a given command is __USE_DEFAULT */
export function isDef(str: UnknownString): str is "usedefault" {
    return normalize(str ?? "", { strict: true, preserveCase: false, removeCliColors: true }) === "usedefault";
}

/** Checks if a given command is __DISABLE */
export function isDis(str: UnknownString): str is "disable" {
    return normalize(str ?? "", { strict: true, preserveCase: false, removeCliColors: true }) === "disable";
}
