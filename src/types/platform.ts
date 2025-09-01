import type { FullFkNodeYaml } from "./config_files.ts";
import type { VALID_COLORS } from "./misc.ts";

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
    name?: string;
    version?: string;
}

/**
 * NodeJS and BunJS `package.json` props, only the ones we need.
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
}

/**
 * DenoJS `deno.json` props, only the ones we need.
 *
 * @interface DenoPkgFile
 */
export interface DenoPkgFile extends GenericJsPkgFile {
    imports?: Record<string, string>;
    workspaces?: string[];
}

/**
 * Rust `Cargo.toml` props, only the ones we need.
 *
 * @interface CargoPkgFile
 */
export interface CargoPkgFile {
    "package"?: {
        name: string | { workspace: true };
        version: string | { workspace: true };
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
        [moduleName: string]: { version: string; indirect?: boolean };
    };
}

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
     * Main file (`package.json`, `deno.json`, `Cargo.toml`...)
     */
    main: {
        /**
         * Path to the main file
         *
         * @type {string}
         */
        path: string;
        /**
         * Name of the main file.
         *
         * @type {("package.json" | "deno.json" | "deno.jsonc" | "Cargo.toml" | "go.mod")}
         */
        name: "package.json" | "deno.json" | "deno.jsonc" | "Cargo.toml" | "go.mod";
        /**
         * Contents of the main file (**standard format**).
         *
         * @type {(NodePkgFile | DenoPkgFile | CargoPkgFile | GolangPkgFile)}
         */
        stdContent: NodePkgFile | DenoPkgFile | CargoPkgFile | GolangPkgFile;
        /**
         * Contents of the main file (**FnCPF format**).
         *
         * @type {FnCPF}
         */
        cpfContent: FnCPF;
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
     * A brand color that's associated with this runtime. {@linkcode ColorString} compatible.
     *
     * @type {VALID_COLORS}
     */
    runtimeColor: VALID_COLORS;
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
         * Exec command(s). `string[]` because it can be, e.g., `pnpm dlx`. Includes base.
         */
        exec: ["deno", "run"] | ["bunx"] | ["npx"] | ["pnpm", "dlx"] | ["yarn", "dlx"] | ["go", "run"] | ["cargo", "run"];
        /**
         * Run commands. `string[]` as it's always made of two parts. Includes base. Can be "__UNSUPPORTED" because of non-JS runtimes.
         */
        run: ["deno", "task"] | ["npm", "run"] | ["bun", "run"] | ["pnpm", "run"] | ["yarn", "run"] | "__UNSUPPORTED";
        /**
         * Update commands.
         */
        update: ["update"] | ["update", "--save-text-lockfile"] | ["outdated", "--update"] | ["upgrade"] | ["get", "-u", "all"];
        /**
         * Clean commands.
         */
        clean: string[][] | "__UNSUPPORTED";
        /**
         * Audit commands.
         */
        audit:
            | ["audit"]
            | ["audit", "--ignore-registry-errors", "--json"]
            | ["audit", "--json"]
            | ["audit", "--recursive", "--all", "--json"]
            | "__UNSUPPORTED";
        /**
         * Package publish commands.
         */
        publish: ["publish"] | ["publish", "--non-interactive"] | ["publish", "--check=all"] | "__UNSUPPORTED";
        /**
         * Project startup commands.
         */
        start: "run" | "start";
    };
    /**
     * File paths to valid workspaces.
     *
     * @type {(string[])}
     */
    workspaces: string[];
}

interface NodeEnvironment extends GenericProjectEnvironment {
    runtime: "node";
    manager: "npm" | "pnpm" | "yarn";
    main: GenericProjectEnvironment["main"] & { name: "package.json" };
    commands: {
        base: "npm" | "pnpm" | "yarn";
        exec: ["npx"] | ["pnpm", "dlx"] | ["yarn", "dlx"];
        run: ["npm", "run"] | ["pnpm", "run"] | ["yarn", "run"];
        update: ["update"] | ["upgrade"];
        clean:
            | [["dedupe"], ["prune"]]
            | [["clean"]]
            | [["autoclean", "--force"]]
            | "__UNSUPPORTED";
        audit:
            | ["audit", "--ignore-registry-errors", "--json"]
            | ["audit", "--json"]
            | ["audit", "--recursive", "--all", "--json"]
            | "__UNSUPPORTED";
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
    main: GenericProjectEnvironment["main"] & { name: "package.json" };
    commands: {
        base: "bun";
        exec: ["bunx"];
        run: ["bun", "run"];
        update: ["update", "--save-text-lockfile"];
        clean: "__UNSUPPORTED";
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
    main: GenericProjectEnvironment["main"] & { name: "deno.json" | "deno.jsonc" };
    commands: {
        base: "deno";
        exec: ["deno", "run"];
        run: ["deno", "task"];
        update: ["outdated", "--update"];
        clean: "__UNSUPPORTED";
        audit: "__UNSUPPORTED";
        publish: ["publish", "--check=all"];
        start: "run";
    };
    /**
     * Path to `node_modules`.
     *
     * @type {string}
     */
    hall_of_trash: string;
}

interface CargoEnvironment extends GenericProjectEnvironment {
    runtime: "rust";
    manager: "cargo";
    main: GenericProjectEnvironment["main"] & { name: "Cargo.toml" };
    commands: {
        base: "cargo";
        exec: ["cargo", "run"];
        run: "__UNSUPPORTED";
        update: ["update"];
        clean: [["clean"]];
        audit: "__UNSUPPORTED";
        publish: ["publish"];
        start: "run";
    };
}

interface GolangEnvironment extends GenericProjectEnvironment {
    runtime: "golang";
    manager: "go";
    main: GenericProjectEnvironment["main"] & { name: "go.mod" };
    commands: {
        base: "go";
        exec: ["go", "run"];
        run: "__UNSUPPORTED";
        update: ["get", "-u", "all"];
        clean: [["clean"], ["mod", "tidy"]];
        audit: "__UNSUPPORTED";
        publish: "__UNSUPPORTED";
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
     *
     * @type {("npm" | "jsr" | "pkg.go.dev" | "crates.io")}
     */
    src: "npm" | "jsr" | "pkg.go.dev" | "crates.io";
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
    name: string;
    /**
     * Package version. Must follow the SemVer format.
     *
     * @type {string}
     */
    version: string;
    /**
     * Runtime/Manager.
     *
     * @type {("npm" | "pnpm" | "yarn" | "deno" | "bun" | "cargo" | "golang")}
     */
    rm: "npm" | "pnpm" | "yarn" | "deno" | "bun" | "cargo" | "golang";
    /**
     * Per platform props.
     *
     * @type {{
     *         cargo: {
     *             edition: string;
     *         };
     *     }}
     */
    perPlatProps: {
        /** Rust edition. "__NTP" (Not This Platform) on other runtimes. */
        cargo_edt: string | undefined | "__NTP";
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
