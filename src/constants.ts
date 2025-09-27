import type { CF_FKNODE_SETTINGS, FullFkNodeYaml } from "./types/config_files.ts";

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
    "default-manager": "npm",
    "notifications": true,
    "notification-threshold": false,
    "notification-threshold-value": 10000,
    "always-short-circuit-cleanup": false,
};

/**
 * Default project settings.
 *
 * @type {FullFkNodeYaml}
 */
export const DEFAULT_FKNODE_YAML: FullFkNodeYaml = {
    divineProtection: [],
    cleanerShortCircuit: false,
    lintScript: false,
    prettyScript: false,
    destroy: null,
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
