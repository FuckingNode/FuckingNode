import type { FullFkNodeYaml } from "./config_files.ts";

/**
 * Understood version of a project's protection settings.
 *
 * @interface UnderstoodProjectProtection
 */
export interface UnderstoodProjectProtection {
    doClean: boolean;
    doUpdate: boolean;
    doPrettify: boolean;
    doLint: boolean;
    doDestroy: boolean;
}

/** A Cargo dependency. */
export type CargoDependency = string | { version: string; optional?: boolean; features?: string[] };

/**
 * Use this when you just need the name or version of a package, to avoid Node-Deno type issues.
 *
 * @interface GenericJsPkgFile
 */
export interface GenericJsPkgFile {
    name?: string | undefined;
    version?: string | undefined;
}

/**
 * NodeJS and Bun `package.json` props, only the ones we need.
 *
 * @interface NodePkgFile
 */
export interface NodePkgFile extends GenericJsPkgFile {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    workspaces?: string[] | {
        packages: string[];
        nohoist?: string[];
    };
    private?: boolean;
    license?: string;
    author?: string | { name: string };
    description?: string;
    repository?: string;
    bugs?: string;
    type?: string;
    contributors?: unknown[];
}

/**
 * Deno `deno.json` props, only the ones we need.
 *
 * @interface DenoPkgFile
 */
export interface DenoPkgFile extends GenericJsPkgFile {
    imports?: Record<string, string>;
    workspaces?: string[];
    exports?: Record<string, string>;
    fmt?: Record<string, string | number | boolean | string[]>;
    lint?: unknown;
    lock?: unknown;
}

/**
 * Rust `Cargo.toml` props, only the ones we need.
 *
 * @interface CargoPkgFile
 */
export interface CargoPkgFile {
    "package"?: {
        name?: string | { workspace: true } | undefined;
        version?: string | { workspace: true } | undefined;
        /** If unclear, the Rust "edition" is the Rust version to be used. */
        edition?: string | { workspace: true };
    };
    "dependencies"?: Record<string, CargoDependency>;
    "dev-dependencies"?: Record<string, CargoDependency>;
    "build-dependencies"?: Record<string, CargoDependency>;
    "workspace"?: {
        package?: {
            name: string;
            version: string;
            /** If unclear, the Rust "edition" is the Rust version to be used. */
            edition?: string;
        };
        members?: string[];
    };
    "license"?: string;
    "authors"?: unknown[];
    "description"?: string;
    "repository"?: string;
    "edition"?: string | { workspace: true };
}

/**
 * Go `go.mod` props, only the ones we need.
 *
 * @interface GolangPkgFile
 */
export interface GolangPkgFile {
    /** If unclear, this is the path to the module. Sort of an equivalent to `name`. */
    module: string;
    /** If unclear, this is the version of Golang to be used. */
    go: string;
    /** Equivalent to dependencies. For each module, key is the name and the source (github.com, pkg.go.dev...) at the same time. */
    require?: {
        [moduleName: string]: { version: string; src?: "pkg.go.dev" | "github"; indirect?: boolean };
    };
}

// in order to implement modules, gotta make this global, instead of hardcoding types for supported platforms
// anywhere where false or unsupported is a thing, make sure to make proper type guards
interface GenericProjectEnvironment {
    /**
     * Path to the **root** of the project.
     *
     * @type {string}
     */
    root: string;
    /**
     * Project's settings.
     *
     * @type {FullFkNodeYaml}
     */
    settings: FullFkNodeYaml;
    /**
     * Path to the main file (`package.json`, `deno.json`, `Cargo.toml`...)
     */
    mainPath: string;
    /**
     * Contents of the main file (**FnCPF format**).
     *
     * @type {FnCPF}
     */
    mainCPF: FnCPF;
    /**
     * Name of the main file.
     *
     * @type {("package.json" | "deno.json" | "deno.jsonc" | "Cargo.toml" | "go.mod")}
     */
    mainName: "package.json" | "deno.json" | "deno.jsonc" | "Cargo.toml" | "go.mod";
    /**
     * Contents of the main file (**standard format**).
     *
     * @type {(NodePkgFile | DenoPkgFile | CargoPkgFile | GolangPkgFile)}
     */
    mainSTD: NodePkgFile | DenoPkgFile | CargoPkgFile | GolangPkgFile;
    /** Names this project can be represented with. */
    names: {
        /** Path to the project, with colors and stuff. */
        path: string;
        /** Project's name as in `name` in `package.json` (or equiv). */
        name: string;
        /** Project's name as in `name` in `package.json` (or equiv) + package version as in `version`. */
        nameVer: string;
        /** `nameVer` + `path`. */
        full: string;
    };
    /**
     * Project's lockfile
     */
    lockfile: {
        /**
         * Parsed path to lockfile. `null` if it doesn't exist (that may happen).
         *
         * @type {string | null}
         */
        path: string | null;
        /**
         * Bare name of the lockfile (`package-lock.json`, `deno.lock`, `go.sum`...).
         *
         * @type {LOCKFILE_GLOBAL}
         */
        name: LOCKFILE_GLOBAL;
    };
    /**
     * On what is this project running. Named after the so called JS runtimes.
     *
     * @type {("node" | "deno" | "bun" | "golang" | "rust")}
     */
    runtime: "node" | "deno" | "bun" | "golang" | "rust";
    /**
     * A brand color that's associated with this runtime.
     *
     * @type {"cyan" | "pink" | "bright-green" | "orange" | "bright-blue"}
     */
    runtimeColor: "cyan" | "pink" | "bright-green" | "orange" | "bright-blue";
    /**
     * Package manager. For Deno and Bun it just says "deno" and "bun" instead of JSR or NPM (afaik Bun uses NPM) to avoid confusion.
     *
     * @type {MANAGER_GLOBAL}
     */
    manager: MANAGER_GLOBAL;
    /**
     * CLI commands for this project.
     */
    commands: {
        /**
         * Base command.
         */
        base: MANAGER_GLOBAL;
        /**
         * DLX execution commands. `string[]` because they can be like `pnpm dlx`, includes base. False for non-JS runtimes.
         */
        dlx: ["deno", "run"] | ["bunx"] | ["npx"] | ["pnpm", "dlx"] | ["yarn", "dlx"] | false;
        /**
         * File exec commands. `string[]`, includes base.
         */
        file: ["deno", "run"] | ["bun"] | ["node"] | ["go", "run"] | ["cargo", "run"];
        /**
         * Script run commands. `string[]`, includes base. False for non-JS runtimes.
         */
        script: ["deno", "task"] | ["npm", "run"] | ["bun", "run"] | ["pnpm", "run"] | ["yarn", "run"] | false;
        /**
         * Update commands.
         */
        update: ["update"] | ["update", "--save-text-lockfile"] | ["outdated", "--update"] | ["upgrade"] | ["get", "-u", "all"];
        /**
         * Clean commands.
         */
        clean: string[][] | false;
        /**
         * Audit commands.
         */
        audit:
            | ["audit"]
            | ["audit", "--ignore-registry-errors", "--json"]
            | ["audit", "--json"]
            | ["audit", "--socket"]
            | ["audit", "--recursive", "--all", "--json"]
            | false;
        /**
         * Package publish commands.
         */
        publish: ["publish"] | ["publish", "--non-interactive"] | ["publish", "--check=all"] | false;
        /**
         * Project startup commands.
         */
        start: "run" | "start";
    };
}

interface NodeEnvironment extends GenericProjectEnvironment {
    runtime: "node";
    manager: "npm" | "pnpm" | "yarn";
    mainName: "package.json";
    mainSTD: NodePkgFile;
    commands: {
        base: "npm" | "pnpm" | "yarn";
        dlx: ["npx"] | ["pnpm", "dlx"] | ["yarn", "dlx"];
        file: ["node"];
        script: ["npm", "run"] | ["pnpm", "run"] | ["yarn", "run"];
        update: ["update"] | ["upgrade"];
        clean:
            | [["dedupe"], ["prune"]]
            | [["clean"]]
            | [["autoclean", "--force"]];
        audit:
            | ["audit", "--ignore-registry-errors", "--json"]
            | ["audit", "--json"]
            | ["audit", "--recursive", "--all", "--json"];
        publish: ["publish"] | ["publish", "--non-interactive"];
        start: "start";
    };
    /**
     * Path to `node_modules`.
     *
     * @type {string}
     */
    hall_of_trash: string;
}

interface BunEnvironment extends GenericProjectEnvironment {
    runtime: "bun";
    manager: "bun";
    mainName: "package.json";
    mainSTD: NodePkgFile;
    commands: {
        base: "bun";
        dlx: ["bunx"];
        file: ["bun"];
        script: ["bun", "run"];
        update: ["update", "--save-text-lockfile"];
        clean: false;
        audit: ["audit", "--json"];
        publish: ["publish"];
        start: "start";
    };
    /**
     * Path to `node_modules`.
     *
     * @type {string}
     */
    hall_of_trash: string;
}

interface DenoEnvironment extends GenericProjectEnvironment {
    runtime: "deno";
    manager: "deno";
    mainName: "deno.json" | "deno.jsonc";
    mainSTD: DenoPkgFile;
    commands: {
        base: "deno";
        dlx: ["deno", "run"];
        file: ["deno", "run"];
        script: ["deno", "task"];
        update: ["outdated", "--update"];
        clean: false;
        audit: ["audit", "--socket"];
        publish: ["publish", "--check=all"];
        start: "run";
    };
}

interface CargoEnvironment extends GenericProjectEnvironment {
    runtime: "rust";
    manager: "cargo";
    mainName: "Cargo.toml";
    mainSTD: CargoPkgFile;
    commands: {
        base: "cargo";
        dlx: false;
        file: ["cargo", "run"];
        script: false;
        update: ["update"];
        clean: [["clean"]];
        audit: false;
        publish: ["publish"];
        start: "run";
    };
    /**
     * Path to `target`.
     *
     * @type {string}
     */
    hall_of_trash: string;
}

interface GolangEnvironment extends GenericProjectEnvironment {
    runtime: "golang";
    manager: "go";
    mainName: "go.mod";
    mainSTD: GolangPkgFile;
    commands: {
        base: "go";
        dlx: false;
        file: ["go", "run"];
        script: false;
        update: ["get", "-u", "all"];
        clean: [["clean"], ["mod", "tidy"]];
        audit: false;
        publish: false;
        start: "run";
    };
}

/**
 * Info about a project's environment (runtime and package manager).
 *
 * @type ProjectEnvironment
 */
export type ProjectEnvironment =
    | NodeEnvironment
    | BunEnvironment
    | DenoEnvironment
    | CargoEnvironment
    | GolangEnvironment;

/**
 * A conservative variant of the ProjectEnv.
 *
 * Less informative, but technically agnostic.
 */
export type ConservativeProjectEnvironment = {
    root: string;
    settings: FullFkNodeYaml;
    manager: "(INTEROP)";
    commands: {
        base: false;
        dlx: false;
        file: false;
        script: false;
        update: false;
        clean: false;
        audit: false;
        publish: false;
        start: false;
    };
    names: {
        full: string;
        name: string;
    };
    mainCPF: {
        name: string;
    };
};

// lockfile types
export type LOCKFILE_NODE = "package-lock.json" | "pnpm-lock.yaml" | "yarn.lock";
export type LOCKFILE_ANTINODE = "deno.lock" | "bun.lockb" | "bun.lock";
export type LOCKFILE_NON_JS = "Cargo.lock" | "go.sum";

export type LOCKFILE_JS = LOCKFILE_NODE | LOCKFILE_ANTINODE;
export type LOCKFILE_GLOBAL = LOCKFILE_JS | LOCKFILE_NON_JS;

// pkg manager types
export type MANAGER_NODE = "pnpm" | "npm" | "yarn";
export type MANAGER_ANTINODE = "deno" | "bun";
export type MANAGER_JS = MANAGER_NODE | MANAGER_ANTINODE;
export type MANAGER_GLOBAL = MANAGER_JS | "cargo" | "go";

/**
 * FnCPF dependency.
 *
 * @interface FnCPFDependency
 */
interface FnCPFDependency {
    /**
     * Package name.
     *
     * @type {string}
     */
    name: string;
    /**
     * Package version.
     *
     * @type {string}
     */
    ver: string;
    /**
     * Package relationship.
     */
    rel: "univ:dep" | "univ:devD" | "go:ind" | "js:peer" | "rst:buildD";
    /**
     * Package source.
     */
    src: "npm" | "jsr" | "pkg.go.dev" | "crates.io" | "github";
}

/**
 * Fn Common Package File.
 * @author ZakaHaceCosas
 *
 * @interface FnCPF
 */
export interface FnCPF {
    /**
     * Package name.
     *
     * @type {string}
     */
    name: string | undefined;
    /**
     * Package version. Must follow the SemVer format.
     *
     * @type {string}
     */
    version: string;
    /**
     * Runtime/Manager.
     *
     * @type {("npm" | "pnpm" | "yarn" | "deno" | "bun" | "cargo" | "go")}
     */
    rm: "npm" | "pnpm" | "yarn" | "deno" | "bun" | "cargo" | "go";
    /**
     * Platform props.
     */
    plat: {
        /** Rust edition in Cargo and Go version in Golang. `null` for other runtimes. */
        edt: string | null;
    };
    /**
     * Dependencies.
     *
     * @type {FnCPFDependency[]}
     */
    deps: FnCPFDependency[];
    /**
     * Workspace paths.
     *
     * @type {string[]}
     */
    ws: string[];
    /**
     * Version of the CLI used to generate the file.
     * Useful as we do not complicate ourselves with backwards compatibility troubles - if you're on V3, V2 doesn't work, and so happens with generated files.
     *
     * @type {string}
     */
    fknVer: string;
}

type AnyEnv = NodeEnvironment | BunEnvironment | DenoEnvironment | CargoEnvironment | GolangEnvironment;

export function TypeGuardForNodeBun(env: AnyEnv): env is NodeEnvironment | BunEnvironment {
    return (env.runtime === "node" || env.runtime === "bun");
}

export function TypeGuardForJS(env: AnyEnv): env is NodeEnvironment | BunEnvironment | DenoEnvironment {
    return (env.runtime === "node" || env.runtime === "bun" || env.runtime === "deno");
}

export function TypeGuardForDeno(env: AnyEnv): env is DenoEnvironment {
    return (env.runtime === "deno");
}

export function TypeGuardForCargo(env: AnyEnv): env is CargoEnvironment {
    return (env.runtime === "rust");
}
