import type { VALID_URL } from "./types/misc.ts";
import type { CF_FKNODE_SCHEDULE, CF_FKNODE_SETTINGS, FullFkNodeYaml } from "./types/config_files.ts";
import * as DenoJson from "../deno.json" with { type: "json" };
import { GetDateNow } from "./functions/date.ts";
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
    lintCmd: false,
    prettyCmd: false,
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
    updateCmdOverride: false,
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
    launchFile: false,
    launchWithUpdate: false,
    projectEnvOverride: false,
    buildCmd: false,
    buildForRelease: false,
};
