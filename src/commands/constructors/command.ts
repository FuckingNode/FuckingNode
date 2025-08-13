import type { UnknownString } from "@zakahacecosas/string-utils";

/**
 * The Cleaner.
 * @author ZakaHaceCosas
 *
 * @interface TheCleanerConstructedParams
 */
export interface TheCleanerConstructedParams {
    /**
     * `--flags` to be used.
     *
     * @type {{
     *         update: boolean;
     *         lint: boolean;
     *         prettify: boolean;
     *         commit: boolean;
     *         destroy: boolean;
     *     }}
     */
    flags: {
        update: boolean;
        lint: boolean;
        prettify: boolean;
        commit: boolean;
        destroy: boolean;
    };
    /**
     * Configuration parameters.
     *
     * @type {{
     *         intensity: string;
     *         project: string | 0;
     *     }}
     */
    parameters: {
        intensity: string;
        project: string | 0;
    };
}

/**
 * The Helper.
 * @author ZakaHaceCosas
 *
 * @interface TheHelperConstructedParams
 */
export interface TheHelperConstructedParams {
    /**
     * What to help with.
     *
     * @type {?(string | undefined)}
     */
    query?: string | undefined;
}

/**
 * The Migrator.
 *
 * @interface TheMigratorConstructedParams
 */
export interface TheMigratorConstructedParams {
    /**
     * Project to be migrated.
     *
     * @type {UnknownString}
     */
    projectPath: UnknownString;
    /**
     * The manager to migrate to.
     *
     * @type {UnknownString}
     */
    wantedManager: UnknownString;
}

/**
 * The Settings.
 *
 * @interface TheSettingsConstructedParams
 */
export interface TheSettingsConstructedParams {
    /**
     * Arguments.
     *
     * @type {string[]}
     */
    args: string[];
}

/**
 * The Updater.
 *
 * @interface TheUpdaterConstructedParams
 */
export interface TheUpdaterConstructedParams {
    /**
     * If true, when you're up to date nothing's shown.
     *
     * @type {boolean}
     */
    silent: boolean;
}

/**
 * The Kickstarter.
 *
 * @interface TheKickstarterConstructedParams
 */
export interface TheKickstarterConstructedParams {
    /**
     * URL of the Git repository.
     *
     * @type {UnknownString}
     */
    gitUrl: UnknownString;
    /**
     * Where to clone.
     *
     * @type {?UnknownString}
     */
    path?: UnknownString;
    /**
     * Package manager to be used, if you want to override upstream repo's manager.
     *
     * @type {?UnknownString}
     */
    manager?: UnknownString;
}

/**
 * The Releaser.
 * @author ZakaHaceCosas
 *
 * @interface TheReleaserConstructedParams
 */
export interface TheReleaserConstructedParams {
    /**
     * Project to be released.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
    /**
     * SemVer version to be released.
     *
     * @type {UnknownString}
     */
    version: UnknownString;
    /**
     * If true, changes are pushed to remote `origin`.
     *
     * @type {boolean}
     */
    push: boolean;
    /**
     * If true, a "dry-run" is made (no release command executed).
     *
     * @type {boolean}
     */
    dry: boolean;
}

/**
 * The Builder.
 * @author ZakaHaceCosas
 *
 * @interface TheBuilderConstructedParams
 */
export interface TheBuilderConstructedParams {
    /**
     * Project to be built.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
}

/**
 * The Exporter
 * @author ZakaHaceCosas
 *
 * @interface TheExporterConstructedParams
 */
export interface TheExporterConstructedParams {
    /**
     * Project to generate FnCPF for.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
    /**
     * Whether to use JSON or not. If not, YAML is used.
     *
     * @type {boolean}
     */
    json: boolean;
    /**
     * Whether to output the file to the CLI too.
     *
     * @type {boolean}
     */
    cli: boolean;
}

/**
 * The Compater
 * @author ZakaHaceCosas
 *
 * @interface TheCompaterConstructedParams
 */
export interface TheCompaterConstructedParams {
    /**
     * Feature to fetch compat for.
     *
     * @type {?UnknownString}
     */
    target?: UnknownString;
}

/**
 * The Committer
 * @author ZakaHaceCosas
 *
 * @interface TheCommitterConstructedParams
 */
export interface TheCommitterConstructedParams {
    /**
     * Commit message.
     *
     * @type {UnknownString}
     */
    message: UnknownString;
    /**
     * Files to commit. Either an array of paths or "A" for all files or "S" for staged files.
     *
     * @type {UnknownString[] | "A" | "S"}
     */
    files: UnknownString[] | "A" | "S";
    /**
     * Whether to push changes to remote or not.
     *
     * @type {boolean}
     */
    push: boolean;
    /**
     * Branch to commit to. Optional.
     *
     * @type {?UnknownString}
     */
    branch?: UnknownString;
    /**
     * Whether to keep previously staged files for committing.
     *
     * @type {boolean}
     */
    keepStagedFiles: boolean;
    /**
     * If true, no confirmation is asked before committing.
     *
     * @type {?boolean}
     */
    y: boolean;
}

/**
 * The Surrenderer
 * @author ZakaHaceCosas
 *
 * @interface TheSurrendererConstructedParams
 */
export interface TheSurrendererConstructedParams {
    /**
     * Project to be deprecated.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
    /**
     * An optional deprecation message.
     *
     * @type {UnknownString}
     */
    message: UnknownString;
    /**
     * An optional name or URL to an alternative to this package.
     *
     * @type {UnknownString}
     */
    alternative: UnknownString;
    /**
     * An optional URL to somewhere you can learn more about this deprecation.
     *
     * @type {UnknownString}
     */
    learnMoreUrl: UnknownString;
    /**
     * Is it a GitHub repository? If true, GitHub's `> [!TAGS]` will be used for a prettier string.
     *
     * @type {?boolean}
     */
    isGitHub?: boolean;
}

/**
 * The Setuper
 * @author ZakaHaceCosas
 *
 * @interface TheSetuperConstructedParams
 */
export interface TheSetuperConstructedParams {
    /**
     * Project to setup.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
    /**
     * Configuration to use.
     *
     * @type {UnknownString}
     */
    setup: UnknownString;
}

/**
 * The Auditer
 * @author ZakaHaceCosas
 *
 * @interface TheAuditerConstructedParams
 */
export interface TheAuditerConstructedParams {
    /**
     * Project to audit.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
}

/**
 * The Launcher
 * @author ZakaHaceCosas
 *
 * @interface TheLauncherConstructedParams
 */
export interface TheLauncherConstructedParams {
    /**
     * Project to be launched.
     *
     * @type {UnknownString}
     */
    project: UnknownString;
}
