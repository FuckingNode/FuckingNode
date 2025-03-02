import type { FullFkNodeYaml } from "./config_files.ts";

/**
 * Understood version of a project's protection settings.
 *
 * @export
 * @interface UnderstoodProjectProtection
 */
export interface UnderstoodProjectProtection {
    doClean: boolean;
    doUpdate: boolean;
    doPrettify: boolean;
    doLint: boolean;
    doDestroy: boolean;
}

export type CargoDependency = string | { version: string; [key: string]: unknown };

/**
 * Use this when you just need the name or version of a package, to avoid Node-Deno type issues.
 *
 * @export
 * @interface GenericJsPkgFile
 */
export interface GenericJsPkgFile {
    name?: string;
    version?: string;
}

/**
 * NodeJS and BunJS `package.json` props, only the ones we need.
 *
 * @export
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
 * @export
 * @interface DenoPkgFile
 */
export interface DenoPkgFile extends GenericJsPkgFile {
    imports?: Record<string, string>;
    workspaces?: string[];
}

/**
 * Rust `Cargo.toml` props, only the ones we need.
 *
 * @export
 * @interface CargoPkgFile
 */
export interface CargoPkgFile {
    package: {
        name: string;
        version: string;
        /** If unclear, the Rust "edition" is the Rust version to be used. */
        edition?: string;
    };
    dependencies?: Record<string, CargoDependency>;
    "dev-dependencies"?: Record<string, CargoDependency>;
    "build-dependencies"?: Record<string, CargoDependency>;
    workspace?: { members?: string[] };
}

/**
 * Go `go.mod` props, only the ones we need.
 *
 * @export
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
         * Parsed path to lockfile.
         *
         * @type {string}
         */
        path: string;
        /**
         * Bare name of the lockfile (`package-lock.json`, `deno.lock`, `go.sum`...)
         *
         * @type {LOCKFILE_GLOBAL}
         */
        name: LOCKFILE_GLOBAL;
    };
    /**
     * Where this project is running it, named after the so called JS runtimes.
     *
     * @type {("node" | "deno" | "bun" | "golang" | "rust")}
     */
    runtime: "node" | "deno" | "bun" | "golang" | "rust";
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
            | ["audit", "--ignore-registry-errors"]
            | ["audit"]
            | ["audit", "--recursive", "--all"]
            | "__UNSUPPORTED";
        /**
         * Package publish commands.
         */
        publish: ["publish"] | ["publish", "--non-interactive"] | ["publish", "--check=all"] | "__UNSUPPORTED";
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
            | ["audit", "--ignore-registry-errors"]
            | ["audit"]
            | ["audit", "--recursive", "--all"]
            | "__UNSUPPORTED";
        publish: ["publish"] | ["publish", "--non-interactive"];
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
        audit: "__UNSUPPORTED";
        publish: ["publish"];
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
        publish: "__UNSUPPORTED";
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
    rel: "univ:dep" | "univ:devD" | "go:ind" | "js:peer" | "rst:buildD" | `r:tar::${string}`;
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
 * @export
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
        cargo: {
            /** Rust edition. "__NTP" (Not This Platform) on other runtimes. */
            edition: string | undefined | "__NTP";
        };
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
     * Internal info.
     *
     * @type {{
     *         fknode: string;
     *         "fknode-iol": string;
     *         "fknode-cpf": string;
     *     }}
     */
    internal: {
        /** App version. */
        fknode: string;
        /** InterOp Layer version. */
        fknodeIol: string;
        /** FnCPF version. */
        fknodeCpf: string;
    };
}
