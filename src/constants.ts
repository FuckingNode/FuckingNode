import type { tURL } from "./types/misc.ts";
import type { SemVer } from "@std/semver/types";
import { format, parse } from "@std/semver";
import type { CF_FKNODE_SCHEDULE, CF_FKNODE_SETTINGS, FullFkNodeYaml } from "./types/config_files.ts";
import * as DenoJson from "../deno.json" with { type: "json" };
import { GetDateNow } from "./functions/date.ts";
import type { FnCPF } from "./types/platform.ts";
import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";

/**
 * Current app version as a SemVer object. **Change it from `deno.json`.**
 *
 * @type {SemVer}
 */
const _SV_VER: SemVer = parse(DenoJson.default.version);

/**
 * Current version of the app. Uses the SemVer format.
 *
 * @type {string}
 */
export const VERSIONING: { APP: string; CPF: string; IOL: string } = {
    /** App itself */
    APP: format(_SV_VER),
    /** Common Package File */
    CPF: "1.0.0",
    /** InterOp Layer */
    IOL: "1.0.0",
};

/**
 * Internal field for FnCPF files.
 *
 * @type {FnCPF["internal"]}
 */
export const FnCPFInternal: FnCPF["internal"] = {
    fknode: VERSIONING.APP,
    fknodeCpf: VERSIONING.CPF,
    fknodeIol: VERSIONING.IOL,
};

/**
 * Best CLI app ever (it's name, so you don't, for example, miss-capitalize it).
 *
 * @type {{CASED: string, CLI: string, STYLED: string, SCOPE: string}}
 */
export const APP_NAME: { CASED: string; CLI: string; STYLED: string; SCOPE: string } = {
    CASED: "FuckingNode",
    CLI: "fuckingnode",
    STYLED: "F\*ckingNode",
    SCOPE: "@zakahacecosas/fuckingnode",
};

/** Full, cased name of the app in NAME vVERSION format. */
export const FULL_NAME: string = `${APP_NAME.CASED} v${VERSIONING.APP}`;

/** URLs have trailing slash/ */
export const APP_URLs = {
    REPO: "https://github.com/FuckingNode/FuckingNode/",
    WEBSITE: "https://fuckingnode.github.io/",
};

/**
 * Different variants of the f-word for in-app usage. Not fully "explicit" as an asterisk is used, like in f*ck.
 *
 * @interface HE_LIKES_JS
 */
interface HE_LIKES_JS {
    /**
     * Base word. 4 letters.
     *
     * @type {string}
     */
    FK: string;
    /**
     * Base word but with -ing.
     *
     * @type {string}
     */
    FKN: string;
    /**
     * Noun. What we call a project that's made with NodeJS. Base word but mentioning his mother (-er).
     *
     * @type {string}
     */
    MF: string;
    /**
     * Plural for `mf`.
     *
     * @type {string}
     */
    MFS: string;
    /**
     * Adjective. What we describe a project that's made with NodeJS as.
     *
     * @type {string}
     */
    MFN: string;
    /**
     * _"Something went **mother** + `fkn` + **ly**"_
     *
     * @type {string}
     */
    MFLY: string;
}

/**
 * Different variants of the f-word for in-app usage. Not fully "explicit" as an asterisk is used, like in f*ck.
 *
 * @type {HE_LIKES_JS}
 */
export const I_LIKE_JS: HE_LIKES_JS = {
    FK: "f*ck",
    FKN: "f*cking",
    MF: "m*therf*cker",
    MFS: "m*therf*ckers",
    MFN: "m*therf*cking",
    MFLY: "m*therf*ckingly",
};

/**
 * GitHub REST API URL from where releases are obtained.
 *
 * @type {tURL}
 */
export const RELEASE_URL: tURL = `https://api.github.com/repos/ZakaHaceCosas/${APP_NAME.CASED}/releases/latest`;

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
};

/**
 * Scheduled tasks config file.
 *
 * @type {CF_FKNODE_SCHEDULE}
 */
export const DEFAULT_SCHEDULE_FILE: CF_FKNODE_SCHEDULE = {
    updater: {
        latestVer: VERSIONING.APP,
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
};

/** Checks if a given command is __USE_DEFAULT */
export function isDef(str: UnknownString): str is "usedefault" {
    return StringUtils.normalize(str ?? "", { strict: true, preserveCase: false, stripCliColors: true }) === "usedefault";
}

/** Checks if a given command is __DISABLE */
export function isDis(str: UnknownString): str is "disable" {
    return StringUtils.normalize(str ?? "", { strict: true, preserveCase: false, stripCliColors: true }) === "disable";
}

// deno-lint-ignore no-explicit-any
type shutUpAny = any;

/** Info on the user's platform. */
export const LOCAL_PLATFORM: {
    /** What system platform we're on. `"chad"` = POSIX, `"windows"` = WINDOWS. */
    SYSTEM: "windows" | "chad";
    /** Local user's username. */
    USER: string | undefined;
    /** APPDATA or whatever it is equivalent to on Linux & macOS. */
    APPDATA: string;
} = {
    SYSTEM: (Deno.build.os === "windows" ||
            (globalThis as shutUpAny).Deno?.build.os === "windows" ||
            (globalThis as shutUpAny).navigator?.platform?.startsWith("Win") ||
            (globalThis as shutUpAny).process?.platform?.startsWith("win"))
        ? "windows"
        : "chad",
    USER: (Deno.env.get("USERNAME") || Deno.env.get("USER")),
    APPDATA: (
        Deno.env.get("APPDATA") ||
        Deno.env.get("XDG_CONFIG_HOME") ||
        `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
    ),
};
