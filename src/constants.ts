import type { CF_FKNODE_SCHEDULE, CF_FKNODE_SETTINGS, FullFkNodeYaml } from "./types/config_files.ts";
import * as DenoJson from "../deno.json" with { type: "json" };
import { GetDateNow } from "./functions/date.ts";
import { ManagerExists } from "./functions/cli.ts";

/** Full, cased name of the app in NAME vVERSION format. */
export const FULL_NAME: string = `FuckingNode v${DenoJson.default.version}`;

/** Website URL with trailing dash. */
export const WEBSITE: string = "https://fuckingnode.github.io/";

/**
 * GitHub REST API URL from where releases are obtained.
 *
 * @type {string}
 */
export const RELEASE_URL: string = `https://api.github.com/repos/FuckingNode/FuckingNode/releases/latest`;

/**
 * Default app settings.
 *
 * @type {CF_FKNODE_SETTINGS}
 */
export const DEFAULT_SETTINGS: CF_FKNODE_SETTINGS = {
    "update-freq": 5,
    "flush-freq": 14,
    "default-intensity": "normal",
    "fav-editor": "vscode",
    "default-manager": ManagerExists("bun") ? "bun" : ManagerExists("pnpm") ? "pnpm" : "npm",
    "notifications": true,
    "notification-threshold": false,
    "notification-threshold-value": 10000,
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
    divineProtection: "*",
    lintScript: false,
    prettyScript: false,
    destroy: {
        intensities: ["maxim"],
        targets: [
            "dist/",
            "out/",
        ],
    },
    commitActions: false,
    commitMessage: false,
    commitCmd: false,
    updaterOverride: false,
    flagless: {
        flaglessUpdate: false,
        flaglessLint: false,
        flaglessPretty: false,
        flaglessDestroy: false,
        flaglessCommit: false,
    },
    releaseAlwaysDry: false,
    releaseCmd: false,
    launchCmd: false,
    projectEnvOverride: false,
    buildCmd: false,
    buildForRelease: false,
};
