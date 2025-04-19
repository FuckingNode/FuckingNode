import { parse as parseYaml } from "@std/yaml";
import { parse as parseToml } from "@std/toml";
import { parse as parseJsonc } from "@std/jsonc";
import { expandGlobSync } from "@std/fs";
import { APP_NAME, APP_URLs, DEFAULT_FKNODE_YAML, I_LIKE_JS } from "../constants.ts";
import type { CargoPkgFile, NodePkgFile, ProjectEnvironment, UnderstoodProjectProtection } from "../types/platform.ts";
import { CheckForPath, JoinPaths, ParsePath, ParsePathList } from "./filesystem.ts";
import { ColorString, Interrogate, LogStuff } from "./io.ts";
import { DEBUG_LOG, FknError } from "../functions/error.ts";
import { type FkNodeYaml, type FullFkNodeYaml, ValidateFkNodeYaml } from "../types/config_files.ts";
import { GetAppPath } from "./config.ts";
import { GetDateNow } from "./date.ts";
import type { PROJECT_ERROR_CODES } from "../types/errors.ts";
import { FkNodeInterop } from "../commands/interop/interop.ts";
import { Git } from "../functions/git.ts";
import { internalGolangRequireLikeStringParser } from "../commands/interop/parse-module.ts";
import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";

/**
 * Gets all the users projects and returns their absolute root paths as a `string[]`.
 *
 * @export
 * @async
 * @param {false | "limit" | "exclude"} ignored If "limit", only ignored projects are returned. If "exclude", only projects that aren't ignored are returned.
 * @returns {string[]} The list of projects.
 */
export function GetAllProjects(ignored?: false | "limit" | "exclude"): string[] {
    const content = Deno.readTextFileSync(GetAppPath("MOTHERFKRS"));
    DEBUG_LOG("GetAllProjects CALLED (it's being called too many times i think?)");
    const list = ParsePathList(content);
    const cleanList = list.filter((p) => CheckForPath(p) === true);

    if (!ignored) return cleanList;

    const ignoredReturn: string[] = [];
    const aliveReturn: string[] = [];

    for (const entry of cleanList) {
        const protection = GetProjectSettings(entry).divineProtection;
        if (!protection || protection === "disabled") {
            if (ignored === "exclude") aliveReturn.push(entry);
            continue;
        }
        if (ignored === "limit") ignoredReturn.push(entry);
    }

    if (ignored === "limit") return ignoredReturn;
    if (ignored === "exclude") return aliveReturn;

    return cleanList;
}

/**
 * Adds a new project.
 *
 * @export
 * @param {UnknownString} entry Path to the project.
 * @returns {Promise<void>}
 */
export function AddProject(
    entry: UnknownString,
): void {
    if (!StringUtils.validate(entry)) {
        throw new FknError(
            "Generic__InteractionInvalidCauseNoPathProvided",
            "You didn't provide a path.",
        );
    }

    const workingEntry = ParsePath(entry);

    if (!CheckForPath(workingEntry)) throw new FknError("Generic__NonExistingPath", `Path "${workingEntry}" doesn't exist.`);

    function addTheEntry(name: string) {
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), `${workingEntry}\n`, {
            append: true,
        });
        LogStuff(
            `Congrats! ${name} was added to your list. One mf less to care about!`,
            "tick-clear",
        );
    }

    try {
        const env = GetProjectEnvironment(workingEntry);
        const projectName = NameProject(workingEntry, "all");

        const validation = ValidateProject(workingEntry, false);

        if (validation !== true) {
            if (validation === "IsDuplicate") {
                LogStuff(`bruh, ${projectName} is already added! No need to re-add it.`, "bruh");
            } else if (validation === "NoLockfile") {
                LogStuff(
                    `Error adding ${projectName}: no lockfile present!\nProject's that don't have a lockfile can't be added to the list, and if you add them manually by editing the text file we'll remove them on next launch.\nWe NEED a lockfile to work with your project!`,
                    "error",
                );
            } else if (validation === "NoName") {
                LogStuff(
                    `Error adding ${projectName}: no name!\nSee how the project's name is missing? We can't work with that, we need a name to identify the project.\nPlease set "name" in your package file to something valid.`,
                    "error",
                );
            } else if (validation === "NoVersion") {
                LogStuff(
                    `Error adding ${projectName}: no version!\nWhile not too frequently used, we internally require your project to have a version field.\nPlease set "version" in your package file to something valid.`,
                    "error",
                );
            } else if (validation === "NoPkgFile") {
                LogStuff(
                    `Error adding ${projectName}: no package file!\nIs this even the path to a JavaScript project? No package.json, no deno.json; not even go.mod or Cargo.toml found.`,
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

        if (env.runtime === "deno") {
            LogStuff(
                // says 'good choice' because it's the same runtime as F*ckingNode. its not a real opinion lmao
                // idk whats better, deno or bun. i have both installed, i could try. one day, maybe.
                `This project uses the Deno runtime (good choice btw). Keep in mind it's not fully supported.`,
                "bruh",
                "italic",
            );
        }
        if (!StringUtils.validateAgainst(env.runtime, ["node", "deno"])) {
            LogStuff(
                `This project uses the ${StringUtils.toUpperCaseFirst(env.runtime)} runtime. Keep in mind it's not fully supported.`,
                "bruh",
                "italic",
            );
        }

        const workspaces = env.workspaces;

        if (!workspaces || workspaces.length === 0) {
            addTheEntry(projectName);
            return;
        }

        const workspaceString: string[] = [];

        for (const ws of workspaces) {
            workspaceString.push(NameProject(ws, "all"));
        }

        const addWorkspaces = Interrogate(
            `Hey! This looks like a ${I_LIKE_JS.FKN} monorepo. We've found these workspaces:\n\n${
                workspaceString.join("\n")
            }.\n\nShould we add them to your list as well, so they're all cleaned?`,
        );

        if (!addWorkspaces) {
            addTheEntry(projectName);
            return;
        }

        const allEntries = [workingEntry, ...workspaces].join("\n") + "\n";
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), allEntries, { append: true });

        LogStuff(
            `Added all of your projects. Many mfs less to care about!`,
            "tick-clear",
        );
        return;
    } catch (e) {
        if (!(e instanceof FknError) || e.code !== "Env__UnparsableMainFile") throw e;

        const ws = GetWorkspaces(workingEntry);
        if (ws.length === 0) throw e;

        // returning {w, res} and not res is some weird workaround i searched up
        // because JS Arrays cannot handle promises from .filter()
        const workspaceResults = ws.map((w) => {
            const res = ValidateProject(w, false);
            return { w, isValid: res === true };
        });

        const workspaces = workspaceResults
            .filter(({ isValid }) => isValid)
            .map(({ w }) => w);

        // TODO - known issue: workspaces tend to lack lockfiles
        // invalidating valid projects
        if (workspaces.length === 0) {
            LogStuff(
                "There are some workspaces here, but they're all already added.",
                "bruh",
            );
            return;
        }

        const addWorkspaces = Interrogate(
            `Hey! This looks like a ${I_LIKE_JS.FKN} rootless monorepo. We've found these workspaces:\n\n${
                workspaces.join("\n")
            }.\n\nShould we add them to your list so they're all cleaned?`,
        );

        if (!addWorkspaces) {
            return;
        }

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
 * @returns {void}
 */
export function RemoveProject(
    entry: UnknownString,
    showOutput: boolean = true,
): void {
    try {
        SpotProject(entry);

        const workingEntry = SpotProject(entry);
        if (!workingEntry) return;

        const list = GetAllProjects(false);
        const index = list.indexOf(workingEntry);
        const name = NameProject(workingEntry, "name");

        if (!list.includes(workingEntry)) {
            LogStuff(
                `Bruh, that mf doesn't exist yet.\nAnother typo? We took: ${workingEntry}`,
                "error",
            );
            return;
        }

        if (index !== -1) list.splice(index, 1); // remove only 1st coincidence, to avoid issues
        Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), list.join("\n") + "\n");

        if (list.length > 0 && showOutput === true) {
            LogStuff(
                `I guess ${name} was another "revolutionary cutting edge project" that's now gone, right?`,
                "tick-clear",
            );
            return;
        } else {
            if (!showOutput) return;
            LogStuff(
                `Removed ${name}. That was your last project, the list is now empty.`,
                "moon-face",
            );
            return;
        }
    } catch (e) {
        if (e instanceof FknError && e.code === "Project__NonFoundProject") {
            LogStuff(
                `Bruh, that mf doesn't exist yet.\nAnother typo? We took: ${entry} (=> ${entry ? ParsePath(entry) : "undefined?"})`,
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
 * @export
 * @param {UnknownString} path Path to the **root** of the project.
 * @param {?"name" | "name-colorless" | "path" | "name-ver" | "all"} wanted What to return. `name` returns the name, `path` the file path, `name-ver` a `name@version` string, and `all` returns everything together.
 * @returns {string} The name of the project. If an error happens, it will return the path you provided (that's how we used to name projects anyway).
 */
export function NameProject(
    path: UnknownString,
    wanted?: "name" | "name-colorless" | "path" | "name-ver" | "all",
): string {
    const workingPath = ParsePath(path);
    const formattedPath = ColorString(workingPath, "italic", "half-opaque");

    try {
        if (!CheckForPath(workingPath)) throw new Error("(this won't be shown and formatted path will be returned instead)");
        const env = GetProjectEnvironment(workingPath);

        const pkgFile = env.main.cpfContent;

        if (!pkgFile.name) return formattedPath;

        const formattedName = ColorString(pkgFile.name, "bold");

        const formattedVersion = pkgFile.version ? `@${ColorString(pkgFile.version, "purple")}` : "";

        const formattedNameVer = `${ColorString(formattedName, env.runtimeColor)}${formattedVersion}`;

        const fullNamedProject = `${formattedNameVer} ${formattedPath}`;

        if (wanted === "all") return fullNamedProject;
        else if (wanted === "name") return formattedName;
        else if (wanted === "name-colorless") return pkgFile.name;
        else if (wanted === "path") return formattedPath;
        else return formattedNameVer;
    } catch {
        return formattedPath; // if it's not possible to name it, just give it the raw path
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(
    // deno-lint-ignore no-explicit-any
    item: any,
    // deno-lint-ignore no-explicit-any
): item is Record<string, any> {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Deep merge two objects. Not my code, from https://stackoverflow.com/a/34749873.
 */
export function deepMerge(
    // deno-lint-ignore no-explicit-any
    target: any,
    // deno-lint-ignore no-explicit-any
    ...sources: any[]
) {
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
 * @export
 * @param {string} path Path to the project. Expects an already parsed path.
 * @returns {FullFkNodeYaml} A `FullFkNodeYaml` object.
 */
function GetProjectSettings(path: string): FullFkNodeYaml {
    const pathToDivineFile = JoinPaths(path, "fknode.yaml");
    DEBUG_LOG("READING", pathToDivineFile);

    if (!CheckForPath(pathToDivineFile)) {
        DEBUG_LOG("\nRESORTING TO DEFAULTS 1\n");
        return DEFAULT_FKNODE_YAML;
    }

    const content = Deno.readTextFileSync(pathToDivineFile);
    const divineContent = parseYaml(content);
    DEBUG_LOG("RAW DIVINE CONTENT", divineContent);

    if (!ValidateFkNodeYaml(divineContent)) {
        DEBUG_LOG("\nRESORTING TO DEFAULTS 2\n");
        if (!content.includes("UPON INTERACTING")) {
            Deno.writeTextFileSync(
                pathToDivineFile,
                `\n# [NOTE (${GetDateNow()}): Invalid file format! (Auto-added by ${APP_NAME.CASED}). DEFAULT SETTINGS WILL BE USED UPON INTERACTING WITH THIS ${I_LIKE_JS.MF.toUpperCase()} UNTIL YOU FIX THIS! Refer to ${APP_URLs.WEBSITE} to learn about how fknode.yaml works.]\n`,
                {
                    append: true,
                },
            );
        }
        return DEFAULT_FKNODE_YAML;
    }

    const mergedSettings = deepMerge(DEFAULT_FKNODE_YAML, divineContent);
    DEBUG_LOG("DEEP MERGE", mergedSettings);

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
    const protection = StringUtils.normalizeArray(
        Array.isArray(settings.divineProtection) ? settings.divineProtection : [settings.divineProtection],
    );

    if (!StringUtils.validate(protection[0]) || protection[0] === "disabled") {
        return {
            doClean: true,
            doUpdate: options.update,
            doPrettify: options.prettify,
            doLint: options.lint,
            doDestroy: options.destroy,
        };
    } else if (protection[0] === "*") {
        return {
            doClean: false,
            doUpdate: false,
            doPrettify: false,
            doLint: false,
            doDestroy: false,
        };
    } else {
        return {
            doClean: protection.includes("cleaner") ? false : true,
            doUpdate: protection.includes("updater") ? false : options.update,
            doPrettify: protection.includes("prettifier") ? false : options.prettify,
            doLint: protection.includes("linter") ? false : options.lint,
            doDestroy: protection.includes("destroyer") ? false : options.destroy,
        };
    }
}

/**
 * Given a path to a project, returns `true` if the project is valid, or a message indicating if it's not a valid Node/Deno/Bun project.
 *
 * @async
 * @param {string} entry Path to the project.
 * @param {boolean} existing True if you're validating an existing project, false if it's a new one to be added.
 * @returns {Promise<true | PROJECT_ERROR_CODES>} True if it's valid, a `PROJECT_ERROR_CODES` otherwise.
 */
export function ValidateProject(entry: string, existing: boolean): true | PROJECT_ERROR_CODES {
    const workingEntry = ParsePath(entry);
    if (!CheckForPath(workingEntry)) return "NotFound";
    // GetProjectEnvironment() already does some validations by itself, so we can just use it here
    try {
        const env = GetProjectEnvironment(workingEntry);

        if (!CheckForPath(env.main.path)) return "NoPkgFile";
        // TODO - requiring lockfiles is a bit too problematic
        // workspaces don't have them, deno projects can disable them...
        if (!CheckForPath(env.lockfile.path)) {
            // if runtime is bun and bun.lockb exists, no return
            // so the project is considered valid
            if (env.runtime !== "bun") return "NoLockfile";
            if (!CheckForPath(JoinPaths(env.root, "bun.lockb"))) return "NoLockfile";
        }
        if (!env.main.cpfContent.name) return "NoName";
        if (!env.main.cpfContent.version) return "NoVersion";
    } catch {
        return "CantGetProjectEnv";
    }

    const isDuplicate = (GetAllProjects()).filter(
        (item) => StringUtils.normalize(item) === StringUtils.normalize(workingEntry),
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

        // Check package.json for Node, npm, and yarn (and Bun workspaces).
        const packageJsonPath = JoinPaths(path, "package.json");
        if (CheckForPath(packageJsonPath)) {
            const pkgJson: NodePkgFile = JSON.parse(Deno.readTextFileSync(packageJsonPath));
            if (pkgJson.workspaces) {
                const pkgWorkspaces = Array.isArray(pkgJson.workspaces) ? pkgJson.workspaces : pkgJson.workspaces?.packages || [];
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
                for (const member of denoConfig.workspace) {
                    const memberPath = JoinPaths(path, member);
                    workspacePaths.push(memberPath);
                }
            }
        }

        // Check for Cargo configuration (Cargo.toml)
        const cargoTomlPath = JoinPaths(path, "Cargo.toml");
        if (CheckForPath(cargoTomlPath)) {
            const cargoToml = parseToml(Deno.readTextFileSync(cargoTomlPath)) as unknown as CargoPkgFile;
            if (cargoToml.workspace && Array.isArray(cargoToml.workspace.members)) {
                workspacePaths.push(...cargoToml.workspace.members);
            }
        }

        // Check for Golang configuration (go.work)
        const goWorkPath = JoinPaths(path, "go.work");
        if (CheckForPath(goWorkPath)) {
            const goWork = internalGolangRequireLikeStringParser((Deno.readTextFileSync(goWorkPath)).split("\n"), "use");
            if (goWork.length > 0) workspacePaths.push(...goWork.filter((s) => !["(", ")"].includes(StringUtils.normalize(s))));
        }

        if (workspacePaths.length === 0) return [];

        const absoluteWorkspaces: string[] = [];

        for (const workspacePath of workspacePaths) {
            // TODO - instead of this stupid fix, assert that everywhere we either pre-append the path or not
            const fullPath = workspacePath.startsWith(path) ? workspacePath : JoinPaths(path, workspacePath);
            if (!CheckForPath(fullPath)) continue;
            for (const dir of expandGlobSync(fullPath)) {
                if (dir.isDirectory) {
                    absoluteWorkspaces.push(dir.path);
                }
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
 * @export
 * @param {UnknownString} path Path to the project's root.
 * @returns {ProjectEnvironment}
 */
export function GetProjectEnvironment(path: UnknownString): ProjectEnvironment {
    const root = SpotProject(path);

    if (!CheckForPath(root)) throw new FknError("Internal__Projects__CantDetermineEnv", `Path ${root} doesn't exist.`);

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

    const pathChecks = {
        deno: Object.fromEntries(
            Object.entries(paths.deno).map(([key, path]) => [key, CheckForPath(path)]),
        ),
        bun: Object.fromEntries(
            Object.entries(paths.bun).map(([key, path]) => [key, CheckForPath(path)]),
        ),
        node: Object.fromEntries(
            Object.entries(paths.node).map(([key, path]) => [key, CheckForPath(path)]),
        ),
        golang: Object.fromEntries(
            Object.entries(paths.golang).map(([key, path]) => [key, CheckForPath(path)]),
        ),
        rust: Object.fromEntries(
            Object.entries(paths.rust).map(([key, path]) => [key, CheckForPath(path)]),
        ),
    };

    const isGolang = pathChecks.golang["pkg"] || pathChecks.golang["lock"];
    const isRust = pathChecks.rust["pkg"] || pathChecks.rust["lock"];
    const isDeno = pathChecks.deno["lock"] ||
        pathChecks.deno["json"] ||
        pathChecks.deno["jsonc"];
    const isBun = pathChecks.bun["lock"] ||
        pathChecks.bun["lockb"] ||
        pathChecks.bun["toml"];
    const isNode = pathChecks.node["lockNpm"] ||
        pathChecks.node["lockPnpm"] ||
        pathChecks.node["lockYarn"] ||
        pathChecks.node["json"];

    if (
        !pathChecks.node["json"] && !pathChecks.deno["json"] && !pathChecks.bun["toml"] && !pathChecks.golang["pkg"] && !pathChecks.rust["pkg"]
    ) {
        throw new FknError(
            "Internal__Projects__CantDetermineEnv",
            `No main file present (package.json, deno.json, Cargo.toml...) at ${ColorString(root, "bold")}.`,
        );
    }

    if (!isNode && !isBun && !isDeno && !isGolang && !isRust) {
        throw new FknError(
            "Internal__Projects__CantDetermineEnv",
            `No lockfile present (required for the project to work) at ${ColorString(root, "bold")}.`,
        );
    }

    const mainPath = isGolang
        ? paths.golang.pkg
        : isRust
        ? paths.rust.pkg
        : isDeno
        ? pathChecks.deno["jsonc"] ? paths.deno.jsonc : pathChecks.deno["json"] ? paths.deno.json : paths.node.json
        : paths.node.json;

    const mainString: string = Deno.readTextFileSync(mainPath);
    const settings: FullFkNodeYaml = GetProjectSettings(root);

    const runtimeColor = isBun ? "pink" : isNode ? "bright-green" : isDeno ? "bright-blue" : isRust ? "orange" : "cyan";

    const { PackageFileParsers } = FkNodeInterop;

    if (isGolang) {
        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "go.mod",
                stdContent: PackageFileParsers.Golang.STD(mainString),
                cpfContent: PackageFileParsers.Golang.CPF(mainString, Git.GetLatestTag(root), workspaces),
            },
            lockfile: {
                name: "go.sum",
                path: paths.golang.lock,
            },
            runtime: "golang",
            manager: "go",
            commands: {
                base: "go",
                exec: ["go", "run"],
                update: ["get", "-u", "all"],
                clean: [["clean"], ["mod", "tidy"]],
                run: "__UNSUPPORTED",
                audit: "__UNSUPPORTED", // i thought it was vet
                publish: "__UNSUPPORTED", // ["test", "./..."]
                start: "run",
            },
            workspaces,
        };
    }
    if (isRust) {
        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "Cargo.toml",
                stdContent: PackageFileParsers.Cargo.STD(mainString),
                cpfContent: PackageFileParsers.Cargo.CPF(mainString, workspaces),
            },
            lockfile: {
                name: "Cargo.lock",
                path: paths.rust.lock,
            },
            runtime: "rust",
            manager: "cargo",
            commands: {
                base: "cargo",
                exec: ["cargo", "run"],
                update: ["update"],
                clean: [["clean"]],
                run: "__UNSUPPORTED",
                audit: "__UNSUPPORTED", // ["audit"]
                publish: "__UNSUPPORTED", // ["publish"],
                start: "run",
            },
            workspaces,
        };
    }
    if (isBun) {
        return {
            root,
            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                stdContent: PackageFileParsers.NodeBun.STD(mainString),
                cpfContent: PackageFileParsers.NodeBun.CPF(mainString, "bun", workspaces),
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
                exec: ["bunx"],
                update: ["update", "--save-text-lockfile"],
                // ["install", "--analyze src/**/*.ts"]
                clean: "__UNSUPPORTED",
                run: ["bun", "run"],
                audit: "__UNSUPPORTED",
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }
    if (isDeno) {
        return {
            root,

            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: pathChecks.deno["jsonc"] ? "deno.jsonc" : "deno.json",
                stdContent: PackageFileParsers.Deno.STD(mainString),
                cpfContent: PackageFileParsers.Deno.CPF(mainString, workspaces),
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
                exec: ["deno", "run"],
                update: ["outdated", "--update"],
                clean: "__UNSUPPORTED",
                run: ["deno", "task"],
                audit: "__UNSUPPORTED",
                publish: ["publish", "--check=all"],
                start: "run",
            },
            workspaces,
        };
    }
    if (pathChecks.node["lockYarn"]) {
        return {
            root,

            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                stdContent: parseJsonc(mainString) as NodePkgFile,
                cpfContent: PackageFileParsers.NodeBun.CPF(mainString, "yarn", workspaces),
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
                exec: ["yarn", "dlx"],
                update: ["upgrade"],
                clean: [["autoclean", "--force"]],
                run: ["yarn", "run"],
                audit: ["audit", "--recursive", "--all", "--json"],
                publish: ["publish", "--non-interactive"],
                start: "start",
            },
            workspaces,
        };
    }
    if (pathChecks.node["lockPnpm"]) {
        return {
            root,

            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                stdContent: PackageFileParsers.NodeBun.STD(mainString),
                cpfContent: PackageFileParsers.NodeBun.CPF(mainString, "pnpm", workspaces),
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
                exec: ["pnpm", "dlx"],
                update: ["update"],
                clean: [["dedupe"], ["prune"]],
                run: ["pnpm", "run"],
                audit: ["audit", "--ignore-registry-errors", "--json"],
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }
    if (pathChecks.node["lockNpm"]) {
        return {
            root,

            settings,
            runtimeColor,
            main: {
                path: mainPath,
                name: "package.json",
                stdContent: PackageFileParsers.NodeBun.STD(mainString),
                cpfContent: PackageFileParsers.NodeBun.CPF(mainString, "npm", workspaces),
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
                exec: ["npx"],
                update: ["update"],
                clean: [["dedupe"], ["prune"]],
                run: ["npm", "run"],
                audit: ["audit", "--json"],
                publish: ["publish"],
                start: "start",
            },
            workspaces,
        };
    }

    throw new FknError(
        "Internal__Projects__CantDetermineEnv",
        `Unknown reason. Happened with ${ColorString(root, "bold")}.`,
    );
}

/**
 * Parses a lockfile, differentiating `.yaml` from `.json` files. Unused, (I made it to fix an issue but turns out the fix was different lmao), but keep it here just in case.
 *
 * @export
 * @param {string} lockfilePath
 * @returns {unknown} Whatever the file returns :)
 */
export function ParseLockfile(lockfilePath: string): unknown {
    const file = Deno.readTextFileSync(ParsePath(lockfilePath));
    if (lockfilePath.includes(".yaml") || (lockfilePath.includes(".lock") && !lockfilePath.includes("bun.lock"))) {
        return parseYaml(file);
    } else {
        return parseJsonc(file);
    }
}

/**
 * Tries to spot the given project name inside of the project list, returning its root path. If not found, returns the parsed path. It also works when you pass a path, parsing it to handle `--self` and relative paths.
 *
 * @export
 * @param {UnknownString} name Project's name, path, or `--self`.
 * @returns {Promise<string>}
 */
export function SpotProject(name: UnknownString): string {
    if (!StringUtils.validate(name)) {
        throw new FknError(
            "Generic__InteractionInvalidCauseNoPathProvided",
            `Either didn't provide a project name / path or the CLI failed internally somewhere`,
        );
    }

    const workingProject = ParsePath(name);
    const allProjects = GetAllProjects();
    if (allProjects.includes(workingProject)) {
        return workingProject;
    }

    const toSpot = StringUtils.normalize(name, { strict: false, preserveCase: true, stripCliColors: true });

    for (const project of allProjects) {
        const projectName = StringUtils.normalize(
            NameProject(project, "name-colorless"),
            { strict: false, preserveCase: true, stripCliColors: true },
        );
        if (toSpot === projectName) {
            return project;
        }
    }

    if (CheckForPath(workingProject)) {
        return workingProject;
    } else {
        throw new FknError("Project__NonFoundProject", `'${name.trim()}' (=> '${toSpot}') does not exist.`);
    }
}

/**
 * Cleans up projects that are invalid and probably we won't be able to clean.
 *
 * @export
 * @returns {Promise<0 | 1>} 0 if success, 1 if no projects to remove.
 */
export function CleanupProjects(): 0 | 1 {
    const listOfRemovals: { project: string; issue: PROJECT_ERROR_CODES }[] = [];

    const allProjects = GetAllProjects();

    for (const project of allProjects) {
        const validation = ValidateProject(project, true);

        if (validation !== true) {
            listOfRemovals.push({
                project,
                issue: validation,
            });
        }
    }

    // remove duplicates
    const result = Array.from(
        new Map(
            listOfRemovals.map((item) => [JSON.stringify(item), item]), // make it a string so we can actually compare it's values
        ).values(),
    );

    if (result.length === 0) return 1;

    for (const target of result) RemoveProject(target.project, false);

    return 0;
}
