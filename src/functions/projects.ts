import { parse as parseYaml } from "@std/yaml";
import { parse as parseToml } from "@std/toml";
import { parse as parseJsonc } from "@std/jsonc";
import { expandGlobSync } from "@std/fs";
import { APP_URLs, DEFAULT_FKNODE_YAML } from "../constants.ts";
import type { CargoPkgFile, NodePkgFile, ProjectEnvironment, UnderstoodProjectProtection } from "../types/platform.ts";
import { CheckForPath, JoinPaths, ParsePath, ParsePathList } from "./filesystem.ts";
import { Interrogate, LogStuff } from "./io.ts";
import { DEBUG_LOG, FknError } from "../functions/error.ts";
import { type FkNodeYaml, type FullFkNodeYaml, ValidateFkNodeYaml } from "../types/config_files.ts";
import { GetAppPath } from "./config.ts";
import { GetDateNow } from "./date.ts";
import type { PROJECT_ERROR_CODES } from "../types/errors.ts";
import { FkNodeInterop } from "../commands/interop/interop.ts";
import { GetLatestTag } from "../functions/git.ts";
import { internalGolangRequireLikeStringParser } from "../commands/interop/parse-module.ts";
import { normalize, normalizeArray, type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { ResolveLockfiles } from "../commands/toolkit/cleaner.ts";
import { isGlob } from "@std/path/is-glob";
import { joinGlobs, normalizeGlob } from "@std/path";
import { globSync } from "node:fs";
import { FWORDS } from "../constants/fwords.ts";
import { APP_NAME } from "../constants/name.ts";
import { ColorString } from "./color.ts";

/**
 * Gets all the users projects and returns their absolute root paths as a `string[]`.
 *
 * @param {false | "limit" | "exclude"} ignored If "limit", only ignored projects are returned. If "exclude", only projects that aren't ignored are returned.
 * @returns {string[]} The list of projects.
 */
export function GetAllProjects(ignored?: false | "limit" | "exclude"): string[] {
    const content = Deno.readTextFileSync(GetAppPath("MOTHERFKRS"));
    DEBUG_LOG("GetAllProjects CALLED", ignored ? "WITH IGNORANCE PARAM" : "WITH NO IGNORANCE");
    const list = ParsePathList(content);

    if (!ignored) return list;

    const ignoredReturn: string[] = [];
    const aliveReturn: string[] = [];

    for (const entry of list) {
        try {
            const protection = GetProjectSettings(entry).divineProtection;
            if (!protection) {
                if (ignored === "exclude") aliveReturn.push(entry);
                continue;
            }
            if (ignored === "limit") ignoredReturn.push(entry);
        } catch {
            // ignore
        }
    }

    if (ignored === "limit") return ignoredReturn;
    if (ignored === "exclude") return aliveReturn;

    return list;
}

/**
 * Adds a new project.
 *
 * @async
 * @param {UnknownString} entry Path to the project.
 * @returns {Promise<void>}
 */
export async function AddProject(
    entry: UnknownString,
    glob: boolean = false,
): Promise<void> {
    if (validate(entry) && isGlob(entry)) {
        await Promise.all(
            globSync(entry)
                .filter((f) => Deno.statSync(f).isDirectory)
                .map((p) => AddProject(p, true)),
        );
        return;
    }

    const workingEntry = validate(entry) ? ParsePath(entry) : Deno.cwd();

    if (!(CheckForPath(workingEntry))) throw new FknError("Fs__Unreal", `Path "${workingEntry}" doesn't exist.`);

    function addTheEntry(name: string, rt: "node" | "deno" | "bun" | "golang" | "rust"): void {
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), `${workingEntry}\n`, {
            append: true,
        });
        LogStuff(
            `Congrats! ${name} was added to your list. One mf less to care about!${
                validateAgainst(rt, ["node", "deno", "bun"])
                    ? ""
                    : `\nNote this project uses the ${rt} runtime. Keep in mind it's not fully supported.`
            }`,
            "tick-clear",
        );
    }

    try {
        const env = await GetProjectEnvironment(workingEntry);

        const validation = await ValidateProject(workingEntry, false);

        if (validation !== true) {
            if (validation === "IsDuplicate") LogStuff(`${env.names.full} is already added! No need to re-add it.`, "bruh");
            else if (validation === "NoName") {
                LogStuff(
                    `Error adding ${env.names.full}: no name!\nSee how the project's name is missing? We can't work with that, we need a name to identify the project.\nPlease set "name" in your package file to something valid.`,
                    "error",
                );
            } else if (validation === "NoVersion") {
                LogStuff(
                    `Error adding ${env.names.full}: no version!\nWhile not too frequently used, we internally require your project to have a version field.\nPlease set "version" in your package file to something valid.`,
                    "error",
                );
            } else if (validation === "NoPkgFile") {
                LogStuff(
                    `Error adding ${env.names.full}: no package file!\nIs this even the path to a JavaScript project? No package.json, no deno.json; not even go.mod or Cargo.toml found.`,
                    "error",
                );
            } else if (validation === "NotFound") {
                LogStuff(
                    `The specified path was not found. Check for typos or if the project was moved.`,
                    "error",
                );
            }
            return;
        }

        if (env.workspaces.length === 0) {
            addTheEntry(env.names.full, env.runtime);
            return;
        }

        const workspaceString: string[] = await Promise.all(env.workspaces.map(async (ws) => await NameProject(ws, "all")));

        const addWorkspaces = Interrogate(
            `Hey! This looks like a ${FWORDS.FKN} monorepo. We've found these workspaces:\n\n${
                workspaceString.join("\n")
            }.\n\nShould we add them to your list as well?\nWe recommend this to keep all your code clean - ${
                ColorString("HOWEVER", "bold")
            } if your linter and prettifier are already setup from the root to handle all workspace members, it's actually better to skip this.`,
        );

        if (!addWorkspaces) {
            addTheEntry(env.names.full, env.runtime);
            return;
        }

        const allEntries = [workingEntry, ...env.workspaces].join("\n") + "\n";
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), allEntries, { append: true });

        LogStuff(
            `Added all of your projects. Many mfs less to care about!`,
            "tick-clear",
        );
        return;
    } catch (e) {
        if (e instanceof FknError && glob) {
            LogStuff(`Couldn't add ${workingEntry}. Maybe it's not a project. Skipping it...`, undefined, ["italic", "half-opaque"]);
            return;
        }
        if (!(e instanceof FknError) || e.code !== "Env__PkgFileUnparsable") throw e;

        const ws = GetWorkspaces(workingEntry);
        if (ws.length === 0) throw e;

        // TODO(@ZakaHaceCosas) (V5) - known issue: workspaces tend to lack lockfiles
        // possible fix would be to skip that check and pass to them a default env override of the parent's env
        // would probably force us to tell workspaces from parents apart in projects list
        // hence this TODO is for V5, this solution (best imho) requires a huge breaking change (projects list)
        const workspaces = (await Promise.all(
            ws.map(async (w) => {
                return { w, isValid: await ValidateProject(w, false) === true };
            }),
        ))
            .filter(({ isValid }) => isValid)
            .map(({ w }) => w);

        // invalidating valid projects
        if (workspaces.length === 0) {
            LogStuff(
                "There are some workspaces here, but they're all already added.",
                "bruh",
            );
            return;
        }

        const addWorkspaces = Interrogate(
            `Hey! This looks like a ${FWORDS.FKN} rootless monorepo. We've found these workspaces:\n\n${
                workspaces.join("\n")
            }.\n\nShould we add them to your list so they're all cleaned?`,
        );

        if (!addWorkspaces) return;

        const allEntries = [workingEntry, ...workspaces].join("\n") + "\n";
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), allEntries, { append: true });

        LogStuff(
            `Added all of your projects. Many mfs less to care about!`,
            "tick-clear",
        );
    }
}

/**
 * Removes a project.
 *
 * @async
 * @param {UnknownString} entry Path to the project.
 */
export async function RemoveProject(
    entry: UnknownString,
    showOutput: boolean = true,
): Promise<void> {
    const workingEntry = await SpotProject(entry);
    try {
        const list = GetAllProjects();
        if (!list.includes(workingEntry)) {
            LogStuff(
                `Bruh, that project doesn't exist yet.\nAnother typo? We took: ${workingEntry}`,
                "error",
            );
            return;
        }
        const index = list.indexOf(workingEntry);

        if (index !== -1) list.splice(index, 1);
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), list.join("\n"));

        if (!showOutput) return;
        if (list.length > 0) {
            LogStuff(
                `There goes another "revolutionary cutting edge project" gone. Life's ever changing, right?`,
                "tick-clear",
            );
        } else {
            LogStuff(
                `Removed your last project, your list is now empty.`,
                "moon-face",
            );
        }
        return;
    } catch (e) {
        if (e instanceof FknError && e.code === "External__Proj__NotFound") {
            LogStuff(
                `That project doesn't exist.\nAnother typo? We took: ${entry} (=> ${workingEntry})`,
                "error",
            );
            Deno.exit(1);
        } else {
            throw e;
        }
    }
}

/**
 * Given a path to a project, returns it's name.
 *
 * **Minimize its usage, prefer showing a raw path or using `.names` from an already fetched `ProjectEnv`.**
 *
 * @param {UnknownString} path Path to the **root** of the project.
 * @param {?"name" | "name-colorless" | "path" | "name-ver" | "all"} wanted What to return. `name` returns the name, `path` the file path, `name-ver` a `name@version` string, and `all` returns everything together.
 * @returns {Promise<string>} The name of the project. If an error happens, it will return the path you provided (that's how we used to name projects anyway).
 * @deprecated Not really deprecated but I want VSCode to remind me that this is a bottleneck.
 */
export async function NameProject(
    path: UnknownString,
    wanted?: "name" | "name-colorless" | "path" | "name-ver" | "all",
): Promise<string> {
    const workingPath = ParsePath(path);
    const formattedPath = ColorString(workingPath, "italic", "half-opaque");

    try {
        const env = await GetProjectEnvironment(workingPath);

        const pkgFile = env.main.cpf;

        const formattedName = ColorString(pkgFile.name, "bold", env.runtimeColor);

        const formattedVersion = `@${ColorString(pkgFile.version, "purple")}`;

        const formattedNameVer = `${formattedName}${formattedVersion}`;

        const fullNamedProject = `${formattedNameVer} ${formattedPath}`;

        if (wanted === "all") return fullNamedProject;
        else if (wanted === "name") return formattedName;
        else if (wanted === "path") return formattedPath;
        else if (wanted === "name-colorless") return pkgFile.name;
        else return formattedNameVer;
    } catch {
        // (needed to prevent crashes from invalid projects or not found paths)
        return formattedPath;
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(
    // deno-lint-ignore explicit-module-boundary-types no-explicit-any
    item: any,
    // deno-lint-ignore no-explicit-any
): item is Record<string, any> {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Deep merge two objects. Not my code, from https://stackoverflow.com/a/34749873.
 */
export function deepMerge(
    // deno-lint-ignore explicit-module-boundary-types no-explicit-any
    target: any,
    // deno-lint-ignore no-explicit-any
    ...sources: any[]
    // deno-lint-ignore no-explicit-any
): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * Gets a project's fknode.yaml, parses it and returns it.
 *
 * @param {string} path Path to the project. Expects an already parsed path.
 * @returns {FullFkNodeYaml} A `FullFkNodeYaml` object.
 */
function GetProjectSettings(path: string): FullFkNodeYaml {
    const pathToDivineFile = JoinPaths(path, "fknode.yaml");

    if (!CheckForPath(pathToDivineFile)) {
        DEBUG_LOG("FKN YAML / RESORTING TO DEFAULTS (no fknode.yaml)");
        return DEFAULT_FKNODE_YAML;
    }

    const content = Deno.readTextFileSync(pathToDivineFile);
    const divineContent = parseYaml(content);

    if (!ValidateFkNodeYaml(divineContent)) {
        DEBUG_LOG("FKN YAML / RESORTING TO DEFAULTS (invalid fknode.yaml)");
        if (!content.includes("UPON INTERACTING")) {
            Deno.writeTextFileSync(
                pathToDivineFile,
                `\n# [NOTE (${GetDateNow()}): Invalid config file! (Auto-added by ${APP_NAME.CASED}). DEFAULT SETTINGS WILL BE USED UPON INTERACTING WITH THIS ${FWORDS.MF.toUpperCase()} UNTIL YOU FIX THIS FILE! Refer to ${APP_URLs.WEBSITE} to learn about how fknode.yaml works.]\n`,
                {
                    append: true,
                },
            );
        }
        return DEFAULT_FKNODE_YAML;
    }

    const mergedSettings: FullFkNodeYaml = deepMerge(
        structuredClone(DEFAULT_FKNODE_YAML),
        divineContent,
    );
    DEBUG_LOG("FKN YAML / WILL RETURN", path, mergedSettings);

    return mergedSettings;
}

/**
 * Tells you about the protection of a project. Returns an object where `true` means allowed and `false` means protected.
 */
export function UnderstandProjectProtection(settings: FkNodeYaml, options: {
    update: boolean;
    prettify: boolean;
    lint: boolean;
    destroy: boolean;
}): UnderstoodProjectProtection {
    if (!settings.divineProtection) {
        return {
            doClean: true,
            doUpdate: options.update,
            doPrettify: options.prettify,
            doLint: options.lint,
            doDestroy: options.destroy,
        };
    }
    if (settings.divineProtection === "*") {
        return {
            doClean: false,
            doUpdate: false,
            doPrettify: false,
            doLint: false,
            doDestroy: false,
        };
    }

    const protection = normalizeArray(settings.divineProtection);

    return {
        doClean: protection.includes("cleaner") ? false : true,
        doUpdate: protection.includes("updater") ? false : options.update,
        doPrettify: protection.includes("prettifier") ? false : options.prettify,
        doLint: protection.includes("linter") ? false : options.lint,
        doDestroy: protection.includes("destroyer") ? false : options.destroy,
    };
}

/**
 * Given a path to a project, returns `true` if the project is valid, or a message indicating if it's not a valid Node/Deno/Bun project.
 *
 * @async
 * @param {string} entry Path to the project.
 * @param {boolean} existing True if you're validating an existing project, false if it's a new one to be added.
 * @returns {Promise<true | PROJECT_ERROR_CODES>} True if it's valid, a `PROJECT_ERROR_CODES` otherwise.
 */
export async function ValidateProject(entry: string, existing: boolean): Promise<true | PROJECT_ERROR_CODES> {
    if (!CheckForPath(entry)) return "NotFound";
    // await GetProjectEnvironment() already does some validations by itself, so we can just use it here
    try {
        const env = await GetProjectEnvironment(entry);

        if (!env.main.cpf.name) return "NoName";
        if (!env.main.cpf.version) return "NoVersion";
    } catch (error) {
        if (error instanceof FknError && error.code === "Env__SchrodingerLockfile") return "TooManyLockfiles";
        else return "CantGetProjectEnv";
    }

    const cleanEntry = normalize(entry);

    const isDuplicate = (GetAllProjects()).filter(
        (item) => normalize(item) === cleanEntry,
    ).length > (existing ? 1 : 0);

    if (isDuplicate) return "IsDuplicate";

    return true;
}

/**
 * Checks for workspaces within a Node, Bun, or Deno project, supporting package.json, pnpm-workspace.yaml, .yarnrc.yml, and bunfig.toml.
 *
 * @param {string} path Path to the root of the project. Expects an already parsed path.
 * @returns {string[]}
 */
export function GetWorkspaces(path: string): string[] {
    try {
        const workspacePaths: string[] = [];

        const parse = (s: string[]): string[] =>
            s
                .filter((s: UnknownString) => validate(s))
                .map((s: string) => joinGlobs([path, s]));

        // Check package.json for Node, npm, and yarn (and Bun workspaces).
        const packageJsonPath = JoinPaths(path, "package.json");
        if (CheckForPath(packageJsonPath)) {
            const pkgJson: NodePkgFile = JSON.parse(Deno.readTextFileSync(packageJsonPath));
            if (pkgJson.workspaces) {
                const pkgWorkspaces = Array.isArray(pkgJson.workspaces) ? pkgJson.workspaces : pkgJson.workspaces.packages || [];
                workspacePaths.push(...pkgWorkspaces);
            }
        }

        // Check pnpm-workspace.yaml for pnpm workspaces
        const pnpmWorkspacePath = JoinPaths(path, "pnpm-workspace.yaml");
        if (CheckForPath(pnpmWorkspacePath)) {
            const pnpmConfig = parseYaml(Deno.readTextFileSync(pnpmWorkspacePath)) as { packages: string[] };
            if (pnpmConfig.packages && Array.isArray(pnpmConfig.packages)) workspacePaths.push(...pnpmConfig.packages);
        }

        // Check .yarnrc.yml for Yarn workspaces
        const yarnRcPath = JoinPaths(path, ".yarnrc.yml");
        if (CheckForPath(yarnRcPath)) {
            const yarnConfig = parseYaml(Deno.readTextFileSync(yarnRcPath)) as { workspaces?: string[] };
            if (yarnConfig.workspaces && Array.isArray(yarnConfig.workspaces)) workspacePaths.push(...yarnConfig.workspaces);
        }

        // Check bunfig.toml for Bun workspaces
        const bunfigTomlPath = JoinPaths(path, "bunfig.toml");
        if (CheckForPath(bunfigTomlPath)) {
            const bunConfig = parseToml(Deno.readTextFileSync(bunfigTomlPath)) as { workspace?: string[] };
            if (bunConfig.workspace && Array.isArray(bunConfig.workspace)) workspacePaths.push(...bunConfig.workspace);
        }

        // Check for Deno configuration (deno.json or deno.jsonc)
        const denoJsonPath = JoinPaths(path, "deno.json");
        const denoJsoncPath = JoinPaths(path, "deno.jsonc");
        if (CheckForPath(denoJsonPath) || CheckForPath(denoJsoncPath)) {
            const denoConfig = CheckForPath(denoJsoncPath) ? parseJsonc(Deno.readTextFileSync(denoJsoncPath)) : JSON.parse(
                Deno.readTextFileSync(
                    denoJsonPath,
                ),
            );
            if (denoConfig.workspace && Array.isArray(denoConfig.workspace)) {
                for (const member of denoConfig.workspace) workspacePaths.push(member);
            }
        }

        // Check for Cargo configuration (Cargo.toml)
        const cargoTomlPath = JoinPaths(path, "Cargo.toml");
        if (CheckForPath(cargoTomlPath)) {
            const cargoToml = parseToml(Deno.readTextFileSync(cargoTomlPath)) as unknown as CargoPkgFile;
            if (cargoToml.workspace && Array.isArray(cargoToml.workspace.members)) workspacePaths.push(...cargoToml.workspace.members);
        }

        // Check for Golang configuration (go.work)
        const goWorkPath = JoinPaths(path, "go.work");
        if (CheckForPath(goWorkPath)) {
            const goWork = internalGolangRequireLikeStringParser((Deno.readTextFileSync(goWorkPath)).split("\n"), "use");
            if (goWork.length > 0) workspacePaths.push(...(goWork.filter((s) => !["(", ")"].includes(normalize(s)))));
        }

        if (workspacePaths.length === 0) return [];

        const absoluteWorkspaces: string[] = [];

        for (const workspacePath of parse(workspacePaths)) {
            const fullPath = normalizeGlob(workspacePath).replaceAll("\\", "/");
            DEBUG_LOG("POSSIBLY GLOB STRING:", fullPath, "IS", isGlob(fullPath) ? "CONSIDERED" : "NOT CONSIDERED");
            if (!isGlob(fullPath)) {
                if (CheckForPath(ParsePath(fullPath))) {
                    DEBUG_LOG("NON-GLOB EXISTS", fullPath);
                    absoluteWorkspaces.push(ParsePath(fullPath));
                }
                continue;
            }
            for (const dir of expandGlobSync(fullPath)) {
                DEBUG_LOG("GLOBED", dir);
                if (!CheckForPath(dir.path)) continue;
                if (dir.isDirectory) absoluteWorkspaces.push(dir.path);
            }
        }

        return absoluteWorkspaces;
    } catch (e) {
        LogStuff(`Error looking for workspaces: ${e}`, "error");
        return [];
    }
}

/**
 * Returns a project's environment (package manager, runtime, settings, paths to lockfile and `node_modules`, etc...).
 *
 * @param {UnknownString} path Path to the project's root.
 * @returns {Promise<ProjectEnvironment>}
 */
export async function GetProjectEnvironment(path: UnknownString): Promise<ProjectEnvironment> {
    DEBUG_LOG("CALLED GetProjectEnvironment WITH path", path);
    const root = await SpotProject(path);

    const hall_of_trash = JoinPaths(root, "node_modules");
    const workspaces = GetWorkspaces(root);

    const paths = {
        deno: {
            json: JoinPaths(root, "deno.json"),
            jsonc: JoinPaths(root, "deno.jsonc"),
            lock: JoinPaths(root, "deno.lock"),
        },
        bun: {
            toml: JoinPaths(root, "bunfig.toml"),
            lock: JoinPaths(root, "bun.lock"),
            lockb: JoinPaths(root, "bun.lockb"),
        },
        node: {
            json: JoinPaths(root, "package.json"),
            lockNpm: JoinPaths(root, "package-lock.json"),
            lockPnpm: JoinPaths(root, "pnpm-lock.yaml"),
            lockYarn: JoinPaths(root, "yarn.lock"),
            pnpmInfer1: JoinPaths(root, ".pnpmfile.cjs"),
            pnpmInfer2: JoinPaths(root, "pnpm-workspace.yaml"),
            yarnInfer1: JoinPaths(root, ".yarnrc.yml"),
            yarnInfer2: JoinPaths(root, ".yarnrc"),
            npmInfer: JoinPaths(root, ".npmrc"),
        },
        golang: {
            pkg: JoinPaths(root, "go.mod"),
            lock: JoinPaths(root, "go.sum"),
        },
        rust: {
            pkg: JoinPaths(root, "Cargo.toml"),
            lock: JoinPaths(root, "Cargo.lock"),
        },
    };

    /** extra method to TELL what the package manager is in NodeJS environments
     *
     * this resorts to a less conventional method, seeing if user scripts begin with "pnpm", to INFER what the environment is
     */
    function scriptHas(str: string): boolean {
        if (!CheckForPath(paths.node.json)) return false;
        const f = Deno.readTextFileSync(paths.node.json);
        const s = JSON.parse(f).scripts;
        if (!s) return false;
        return JSON.stringify(
            s,
        ).includes(str);
    }

    const pathChecks = {
        deno: Object.fromEntries(Object.entries(paths.deno).map(([key, path]) => [key, CheckForPath(path)] as const)),
        bun: Object.fromEntries(Object.entries(paths.bun).map(([key, path]) => [key, CheckForPath(path)] as const)),
        node: Object.fromEntries(Object.entries(paths.node).map(([key, path]) => [key, CheckForPath(path)] as const)),
        golang: Object.fromEntries(Object.entries(paths.golang).map(([key, path]) => [key, CheckForPath(path)] as const)),
        rust: Object.fromEntries(Object.entries(paths.rust).map(([key, path]) => [key, CheckForPath(path)] as const)),
    };

    const settings: FullFkNodeYaml = GetProjectSettings(root);

    /** prevent short-circuiting
     * like if `isGo` is true but `envOverride` is `"bun"`, go evaluates first and JS short circuits,
     * breaking this thing
     */
    const _ = settings.projectEnvOverride === false;
    const isGo = _ && pathChecks.golang["pkg"] || pathChecks.golang["lock"];
    const isRust = _ && pathChecks.rust["pkg"] || pathChecks.rust["lock"];
    const isDeno = _ && pathChecks.deno["lock"]
        || pathChecks.deno["json"]
        || pathChecks.deno["jsonc"];
    const isBun = _ && pathChecks.bun["lock"]
        || pathChecks.bun["lockb"]
        || pathChecks.bun["toml"];
    const isPnpm = _ && pathChecks.node["lockPnpm"]
        || pathChecks.node["pnpmInfer1"]
        || pathChecks.node["pnpmInfer2"]
        || scriptHas("pnpm");
    const isYarn = _ && pathChecks.node["lockYarn"]
        || pathChecks.node["yarnInfer1"]
        || pathChecks.node["yarnInfer2"]
        || scriptHas("yarn");
    const isNpm = _ && pathChecks.node["lockNpm"]
        || pathChecks.node["npmInfer"]
        || scriptHas("npm");
    const isNode = _ && isPnpm || isNpm || isYarn
        || pathChecks.node["json"];

    if (
        !pathChecks.node["json"] && !pathChecks.deno["json"] && !pathChecks.bun["toml"] && !pathChecks.golang["pkg"] && !pathChecks.rust["pkg"]
    ) {
        throw new FknError(
            "Env__NoPkgFile",
            `No main file present (package.json, deno.json, Cargo.toml...) at ${ColorString(root, "bold")}.`,
        );
    }

    const seemsToBeNothing = !isNode && !isBun && !isDeno && !isGo && !isRust && !(CheckForPath(paths.node.json));

    if (seemsToBeNothing) {
        throw new FknError(
            "Env__CannotDetermine",
            "This is not a valid JS/Golang/Rust project! Or at least it doesn't seem to be.",
        );
    }

    const lockfiles = ResolveLockfiles(root);

    if (lockfiles.length > 1) {
        throw new FknError(
            "Env__SchrodingerLockfile",
            `Multiple lockfiles found in ${
                ColorString(root, "bold")
            }. This is a bad practice and does not let us properly infer the package manager to use.`,
        );
    }

    DEBUG_LOG("Is? (G,R,D,B,Y,P,N)", isGo, isRust, isDeno, isBun, isYarn, isPnpm, isNpm, "(isNode?)", isNode);

    const mainPath = isGo
        ? paths.golang.pkg
        : isRust
        ? paths.rust.pkg
        : isDeno
        ? pathChecks.deno["jsonc"] ? paths.deno.jsonc : pathChecks.deno["json"] ? paths.deno.json : paths.node.json
        : paths.node.json;

    const mainString: string = Deno.readTextFileSync(mainPath);

    const runtimeColor = isBun ? "pink" : isNode ? "bright-green" : isDeno ? "bright-blue" : isRust ? "orange" : "cyan";

    const { PackageFileParsers } = FkNodeInterop;

    const formattedPath = ColorString(root, "italic", "half-opaque");

    if (settings.projectEnvOverride === "go" || isGo) {
        let goTag: string | undefined = undefined;

        // idiots at google couldn't think of a 'version' field in go.mod
        // and chose to rely on git :sob:
        try {
            goTag = GetLatestTag(root);
        } catch {
            // nothing
        }

        const cpf = PackageFileParsers.Golang.CPF(mainString, goTag, workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "go.mod",
                std: PackageFileParsers.Golang.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "go.sum",
                path: paths.golang.lock,
            },
            runtime: "golang",
            manager: "go",
            commands: {
                base: "go",
                dlx: false,
                file: ["go", "run"],
                update: ["get", "-u", "all"],
                clean: [["clean"], ["mod", "tidy"]],
                script: false,
                audit: false, // i thought it was vet
                publish: false, // ["test", "./..."]
                start: "run",
            },
            workspaces,
        };
    }
    if (settings.projectEnvOverride === "cargo" || isRust) {
        const cpf = PackageFileParsers.Cargo.CPF(mainString, workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "Cargo.toml",
                std: PackageFileParsers.Cargo.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "Cargo.lock",
                path: paths.rust.lock,
            },
            runtime: "rust",
            manager: "cargo",
            commands: {
                base: "cargo",
                dlx: false,
                file: ["cargo", "run"],
                update: ["update"],
                clean: [["clean"]],
                script: false,
                audit: false, // ["audit"]
                publish: ["publish"],
                start: "run",
            },
            workspaces,
        };
    }
    if (settings.projectEnvOverride === "deno" || isDeno) {
        const cpf = PackageFileParsers.Deno.CPF(mainString, workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: pathChecks.deno["jsonc"] ? "deno.jsonc" : "deno.json",
                std: PackageFileParsers.Deno.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "deno.lock",
                path: paths.deno.lock,
            },
            runtime: "deno",
            manager: "deno",
            hall_of_trash,
            commands: {
                base: "deno",
                dlx: ["deno", "run"],
                file: ["deno", "run"],
                update: ["outdated", "--update"],
                clean: false,
                script: ["deno", "task"],
                audit: false,
                publish: ["publish", "--check=all"],
                start: "run",
            },
            workspaces,
        };
    }
    if (settings.projectEnvOverride === "bun" || isBun) {
        const cpf = PackageFileParsers.NodeBun.CPF(mainString, "bun", workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                std: PackageFileParsers.NodeBun.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: pathChecks.bun["lockb"] ? "bun.lockb" : "bun.lock",
                path: paths.bun.lock,
            },
            runtime: "bun",
            manager: "bun",
            hall_of_trash,
            commands: {
                base: "bun",
                dlx: ["bunx"],
                file: ["bun"],
                update: ["update", "--save-text-lockfile"],
                // ["install", "--analyze src/**/*.ts"]
                clean: false,
                script: ["bun", "run"],
                audit: ["audit", "--json"],
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }
    if (settings.projectEnvOverride === "yarn" || isYarn) {
        const cpf = PackageFileParsers.NodeBun.CPF(mainString, "yarn", workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                std: parseJsonc(mainString) as NodePkgFile,
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "yarn.lock",
                path: paths.node.lockYarn,
            },
            runtime: "node",
            manager: "yarn",
            hall_of_trash,
            commands: {
                base: "yarn",
                dlx: ["yarn", "dlx"],
                file: ["node"],
                update: ["upgrade"],
                clean: [["autoclean", "--force"]],
                script: ["yarn", "run"],
                audit: ["audit", "--recursive", "--all", "--json"],
                publish: ["publish", "--non-interactive"],
                start: "start",
            },
            workspaces,
        };
    }
    if (settings.projectEnvOverride === "pnpm" || isPnpm) {
        const cpf = PackageFileParsers.NodeBun.CPF(mainString, "pnpm", workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                std: PackageFileParsers.NodeBun.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "pnpm-lock.yaml",
                path: paths.node.lockPnpm,
            },
            runtime: "node",
            manager: "pnpm",
            hall_of_trash,
            commands: {
                base: "pnpm",
                dlx: ["pnpm", "dlx"],
                file: ["node"],
                update: ["update"],
                clean: [["dedupe"], ["prune"]],
                script: ["pnpm", "run"],
                audit: ["audit", "--ignore-registry-errors", "--json"],
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }
    // (|| isNode) assume it's npm if it's node.js and we can't tell the package manager
    if (settings.projectEnvOverride === "npm" || isNpm || isNode) {
        const cpf = PackageFileParsers.NodeBun.CPF(mainString, "npm", workspaces);

        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                std: PackageFileParsers.NodeBun.STD(mainString),
                cpf,
            },
            names: {
                path: formattedPath,
                name: ColorString(cpf.name, "bold", runtimeColor),
                nameVer: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")}`,
                full: `${ColorString(cpf.name, "bold", runtimeColor)}@${ColorString(cpf.version, "purple")} ${formattedPath}`,
            },
            lockfile: {
                name: "package-lock.json",
                path: paths.node.lockNpm,
            },
            runtime: "node",
            manager: "npm",
            hall_of_trash,
            commands: {
                base: "npm",
                dlx: ["npx"],
                update: ["update"],
                clean: [["dedupe"], ["prune"]],
                file: ["node"],
                script: ["npm", "run"],
                audit: ["audit", "--json"],
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }

    throw new FknError(
        "Env__CannotDetermine",
        `Failed to determine the environment of '${root}'. We attempt to infer by all means possible the pkg manager of a project but sometimes fail. We kindly ask you to report this as an issue at ${APP_URLs.REPO} so we can fix it.`,
    );
}

/**
 * Tries to spot the given project name inside of the project list, returning its root path. If not found, returns the parsed path. It also works when you pass a path, parsing it to handle relative paths.
 *
 * @async
 * @param {UnknownString} name Project's name or path.
 * @returns {string}
 */
export async function SpotProject(name: UnknownString): Promise<string> {
    // the regex is because some projects might be called @someone/something
    // and the startsWith is to catch --flags
    const workingProject = (validate(name) && !name.startsWith("-"))
        ? /^@([^\/\s]+)\/([^\/\s]+)$/.test(name) ? name : ParsePath(name)
        : ParsePath(".");
    if (CheckForPath(workingProject)) return workingProject;

    const allProjects = GetAllProjects();
    if (allProjects.includes(workingProject)) return workingProject;

    const toSpot = normalize(name, { strict: false, preserveCase: true, removeCliColors: true });

    for (const project of allProjects) {
        const projectName = normalize(
            await NameProject(project, "name-colorless"),
            { strict: false, preserveCase: true, removeCliColors: true },
        );
        DEBUG_LOG("SPOT", toSpot, "AGAINST", projectName);
        if (toSpot === projectName) return project;
    }

    throw new FknError("External__Proj__NotFound", `'${workingProject}' does not exist.`);
}

/**
 * Cleans up projects that are invalid and probably we won't be able to clean.
 */
export async function CleanupProjects(): Promise<void> {
    const listOfRemovals: { project: string; issue: PROJECT_ERROR_CODES }[] = [];

    const allProjects = GetAllProjects();

    await Promise.all(
        allProjects.map(async (project) => {
            const issue = await ValidateProject(project, true);
            if (issue !== true) listOfRemovals.push({ project, issue });
        }),
    );

    if (listOfRemovals.length === 0) return;

    DEBUG_LOG("INVALIDATED", listOfRemovals);

    for (const { project } of listOfRemovals) await RemoveProject(project, false);

    Deno.writeTextFileSync(
        GetAppPath("MOTHERFKRS"),
        (GetAllProjects()).join("\n") + "\n",
    );

    return;
}
