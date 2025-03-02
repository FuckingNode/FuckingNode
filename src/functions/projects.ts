import { parse as parseYaml } from "@std/yaml";
import { parse as parseToml } from "@std/toml";
import { parse as parseJsonc } from "@std/jsonc";
import { expandGlob } from "@std/fs";
import { APP_NAME, APP_URLs, DEFAULT_FKNODE_YAML, I_LIKE_JS } from "../constants.ts";
import type { CargoPkgFile, NodePkgFile, ProjectEnvironment, UnderstoodProjectProtection } from "../types/platform.ts";
import { CheckForPath, JoinPaths, ParsePath, ParsePathList } from "./filesystem.ts";
import { ColorString, LogStuff } from "./io.ts";
import { DEBUG_LOG, FknError } from "../functions/error.ts";
import { type FkNodeYaml, type FullFkNodeYaml, ValidateFkNodeYaml } from "../types/config_files.ts";
import { GetAppPath } from "./config.ts";
import { GetDateNow } from "./date.ts";
import type { PROJECT_ERROR_CODES } from "../types/errors.ts";
import { FkNodeInterop } from "../commands/interop/interop.ts";
import type { tValidColors } from "../types/misc.ts";
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
    DEBUG_LOG("RAW LIST", content);
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
 * @async
 * @param {UnknownString} entry Path to the project.
 * @returns {Promise<void>}
 */
export async function AddProject(
    entry: UnknownString,
): Promise<void> {
    if (!StringUtils.validate(entry)) {
        throw new FknError(
            "Generic__InteractionInvalidCauseNoPathProvided",
            "You didn't provide a path.",
        );
    }

    const workingEntry = ParsePath(entry);

    if (!CheckForPath(workingEntry)) throw new FknError("Generic__NonExistingPath", `Path "${workingEntry}" doesn't exist.`);

    const env = await GetProjectEnvironment(workingEntry);
    const projectName = await NameProject(workingEntry, "all");

    async function addTheEntry() {
        await Deno.writeTextFile(GetAppPath("MOTHERFKRS"), `${workingEntry}\n`, {
            append: true,
        });
        await LogStuff(
            `Congrats! ${projectName} was added to your list. One mf less to care about!`,
            "tick-clear",
        );
    }

    const validation = await ValidateProject(workingEntry, false);

    if (validation !== true) {
        switch (validation) {
            case "IsDuplicate":
                await LogStuff(
                    `bruh, ${projectName} is already added! No need to re-add it.`,
                    "bruh",
                );
                break;
            case "NoLockfile":
                await LogStuff(
                    `Error adding ${projectName}: no lockfile present!\nProject's that don't have a lockfile can't be added to the list, and if you add them manually by editing the text file we'll remove them on next launch.\nWe NEED a lockfile to work with your project!`,
                    "error",
                );
                break;
            case "NoName":
                await LogStuff(
                    `Error adding ${projectName}: no name!\nSee how the project's name is missing? We can't work with that, we need a name to identify the project.\nPlease set "name" in your package file to something valid.`,
                    "error",
                );
                break;
            case "NoVersion":
                await LogStuff(
                    `Error adding ${projectName}: no version!\nWhile not too frequently used, we internally require your project to have a version field.\nPlease set "version" in your package file to something valid.`,
                    "error",
                );
                break;
            case "NoPkgFile":
                await LogStuff(
                    `Error adding ${projectName}: no package file!\nIs this even the path to a JavaScript project? No package.json, no deno.json; not even go.mod or Cargo.toml found.`,
                    "error",
                );
                break;
            case "NotFound":
                await LogStuff(
                    `The specified path was not found. Check for typos or if the project was moved.`,
                    "error",
                );
                break;
        }
        return;
    }

    if (env.runtime === "deno") {
        await LogStuff(
            // says 'good choice' because it's the same runtime as F*ckingNode. its not a real opinion lmao
            // idk whats better, deno or bun. i have both installed, i could try. one day, maybe.
            `This project uses the Deno runtime (good choice btw). Keep in mind it's not *fully* supported *yet*.`,
            "bruh",
            "italic",
        );
    }
    if (env.runtime === "bun") {
        await LogStuff(
            `This project uses the Bun runtime. Keep in mind it's not *fully* supported *yet*.`,
            "what",
            "italic",
        );
    }

    const workspaces = env.workspaces;

    if (!workspaces || workspaces.length === 0) {
        await addTheEntry();
        return;
    }

    const workspaceString: string[] = [];

    for (const ws of workspaces) {
        workspaceString.push(await NameProject(ws, "all"));
    }

    const addWorkspaces = await LogStuff(
        `Hey! This looks like a ${I_LIKE_JS.FKN} monorepo. We've found these workspaces:\n\n${
            workspaceString.join("\n")
        }.\n\nShould we add them to your list as well, so they're all cleaned?`,
        "bulb",
        undefined,
        true,
    );

    if (!addWorkspaces) {
        await addTheEntry();
        return;
    }

    const allEntries = [workingEntry, ...workspaces].join("\n") + "\n";
    await Deno.writeTextFile(GetAppPath("MOTHERFKRS"), allEntries, { append: true });

    await LogStuff(
        `Added all of your projects. Many mfs less to care about!`,
        "tick-clear",
    );
    return;
}

/**
 * Removes a project.
 *
 * @async
 * @param {UnknownString} entry Path to the project.
 * @returns {Promise<void>}
 */
export async function RemoveProject(
    entry: UnknownString,
    showOutput: boolean = true,
): Promise<void> {
    const workingEntry = await SpotProject(entry).catch(async (e) => {
        if (e instanceof FknError && e.code === "Project__NonFoundProject") {
            await LogStuff(
                `Bruh, that mf doesn't exist yet.\nAnother typo? We took: ${entry} (=> ${entry ? ParsePath(entry) : "undefined?"})`,
                "error",
            );
            return null;
        } else {
            throw e;
        }
    });

    if (!workingEntry) return;

    const list = GetAllProjects(false);
    const index = list.indexOf(workingEntry);
    const name = await NameProject(workingEntry, "name");

    if (!list.includes(workingEntry)) {
        await LogStuff(
            `Bruh, that mf doesn't exist yet.\nAnother typo? We took: ${workingEntry}`,
            "error",
        );
        return;
    }

    if (index !== -1) list.splice(index, 1); // remove only 1st coincidence, to avoid issues
    await Deno.writeTextFile(GetAppPath("MOTHERFKRS"), list.join("\n") + "\n");

    if (list.length > 0 && showOutput === true) {
        await LogStuff(
            `I guess ${name} was another "revolutionary cutting edge project" that's now gone, right?`,
            "tick-clear",
        );
        return;
    } else {
        if (!showOutput) return;
        await LogStuff(
            `Removed ${name}. That was your last project, the list is now empty.`,
            "moon-face",
        );
        return;
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
export async function NameProject(
    path: UnknownString,
    wanted?: "name" | "name-colorless" | "path" | "name-ver" | "all",
): Promise<string> {
    const workingPath = ParsePath(path);
    const formattedPath = ColorString(workingPath, "italic", "half-opaque");

    try {
        if (!CheckForPath(workingPath)) throw new Error("(this won't be shown and formatted path will be returned instead)");
        const env = await GetProjectEnvironment(workingPath);

        let runtimeColor: tValidColors;
        switch (env.runtime) {
            case "bun":
                runtimeColor = "pink";
                break;
            case "node":
                runtimeColor = "bright-green";
                break;
            case "deno":
                runtimeColor = "bright-blue";
                break;
            case "rust":
                runtimeColor = "orange";
                break;
            case "golang":
                runtimeColor = "cyan";
                break;
        }

        const pkgFile = env.main.cpfContent;

        if (!pkgFile.name) return formattedPath;

        const formattedName = ColorString(pkgFile.name, "bold");

        const formattedVersion = pkgFile.version ? `@${ColorString(pkgFile.version, "purple")}` : "";

        const formattedNameVer = `${ColorString(formattedName, runtimeColor)}${formattedVersion}`;

        const fullNamedProject = `${formattedNameVer} ${formattedPath}`;

        switch (wanted) {
            case "all":
                return fullNamedProject;
            case "name":
                return formattedName;
            case "name-colorless":
                return pkgFile.name;
            case "path":
                return formattedPath;
            case "name-ver":
            default:
                return formattedNameVer;
        }
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
export async function ValidateProject(entry: string, existing: boolean): Promise<true | PROJECT_ERROR_CODES> {
    const workingEntry = ParsePath(entry);
    if (!CheckForPath(workingEntry)) return "NotFound";
    // GetProjectEnvironment() already does some validations by itself, so we can just use it here
    const env = await GetProjectEnvironment(workingEntry);

    const list = GetAllProjects();
    const isDuplicate = list.filter(
        (item) => StringUtils.normalize(item) === StringUtils.normalize(workingEntry),
    ).length > (existing ? 1 : 0);

    if (isDuplicate) return "IsDuplicate";

    if (!CheckForPath(env.main.path)) return "NoPkgFile";
    if (!CheckForPath(env.lockfile.path)) {
        // if runtime is bun and bun.lockb exists, no return
        // so the project is considered valid
        if (env.runtime !== "bun") return "NoLockfile";
        if (!CheckForPath(JoinPaths(env.root, "bun.lockb"))) return "NoLockfile";
    }

    if (!env.main.cpfContent.name) return "NoName";
    if (!env.main.cpfContent.version) return "NoVersion";

    return true;
}

/**
 * Checks for workspaces within a Node, Bun, or Deno project, supporting package.json, pnpm-workspace.yaml, .yarnrc.yml, and bunfig.toml.
 *
 * @async
 * @param {string} path Path to the root of the project. Expects an already parsed path.
 * @returns {Promise<string[]>}
 */
export async function GetWorkspaces(path: string): Promise<string[]> {
    try {
        const workspacePaths: string[] = [];

        // Check package.json for Node, npm, and yarn (and Bun workspaces).
        const packageJsonPath = JoinPaths(path, "package.json");
        if (CheckForPath(packageJsonPath)) {
            const pkgJson: NodePkgFile = JSON.parse(await Deno.readTextFile(packageJsonPath));
            if (pkgJson.workspaces) {
                const pkgWorkspaces = Array.isArray(pkgJson.workspaces) ? pkgJson.workspaces : pkgJson.workspaces?.packages || [];
                workspacePaths.push(...pkgWorkspaces);
            }
        }

        // Check pnpm-workspace.yaml for pnpm workspaces
        const pnpmWorkspacePath = JoinPaths(path, "pnpm-workspace.yaml");
        if (CheckForPath(pnpmWorkspacePath)) {
            const pnpmConfig = parseYaml(await Deno.readTextFile(pnpmWorkspacePath)) as { packages: string[] };
            if (pnpmConfig.packages && Array.isArray(pnpmConfig.packages)) workspacePaths.push(...pnpmConfig.packages);
        }

        // Check .yarnrc.yml for Yarn workspaces
        const yarnRcPath = JoinPaths(path, ".yarnrc.yml");
        if (CheckForPath(yarnRcPath)) {
            const yarnConfig = parseYaml(await Deno.readTextFile(yarnRcPath)) as { workspaces?: string[] };
            if (yarnConfig.workspaces && Array.isArray(yarnConfig.workspaces)) workspacePaths.push(...yarnConfig.workspaces);
        }

        // Check bunfig.toml for Bun workspaces
        const bunfigTomlPath = JoinPaths(path, "bunfig.toml");
        if (CheckForPath(bunfigTomlPath)) {
            const bunConfig = parseToml(await Deno.readTextFile(bunfigTomlPath)) as { workspace?: string[] };
            if (bunConfig.workspace && Array.isArray(bunConfig.workspace)) workspacePaths.push(...bunConfig.workspace);
        }

        // Check for Deno configuration (deno.json or deno.jsonc)
        const denoJsonPath = JoinPaths(path, "deno.json");
        const denoJsoncPath = JoinPaths(path, "deno.jsonc");
        if (CheckForPath(denoJsonPath) || CheckForPath(denoJsoncPath)) {
            const denoConfig = CheckForPath(denoJsoncPath) ? parseJsonc(await Deno.readTextFile(denoJsoncPath)) : JSON.parse(
                await Deno.readTextFile(
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
            const cargoToml = parseToml(await Deno.readTextFile(cargoTomlPath)) as unknown as CargoPkgFile;
            if (cargoToml.workspace && Array.isArray(cargoToml.workspace.members)) {
                workspacePaths.push(...cargoToml.workspace.members);
            }
        }

        // Check for Golang configuration (go.work)
        const goWorkPath = JoinPaths(path, "go.work");
        if (CheckForPath(goWorkPath)) {
            const goWork = internalGolangRequireLikeStringParser((await Deno.readTextFile(goWorkPath)).split("\n"), "use");
            if (goWork.length > 0) workspacePaths.push(...goWork.filter((s) => !["(", ")"].includes(StringUtils.normalize(s))));
        }

        if (workspacePaths.length === 0) return [];

        const absoluteWorkspaces: string[] = [];

        for (const workspacePath of workspacePaths) {
            const fullPath = JoinPaths(path, workspacePath);
            if (!CheckForPath(fullPath)) continue;
            for await (const dir of expandGlob(fullPath)) {
                if (dir.isDirectory) {
                    absoluteWorkspaces.push(dir.path);
                }
            }
        }

        return absoluteWorkspaces;
    } catch (e) {
        await LogStuff(`Error looking for workspaces: ${e}`, "error");
        return [];
    }
}

/**
 * Returns a project's environment (package manager, runtime, settings, paths to lockfile and `node_modules`, etc...).
 *
 * @export
 * @async
 * @param {UnknownString} path Path to the project's root.
 * @returns {Promise<ProjectEnvironment>}
 */
export async function GetProjectEnvironment(path: UnknownString): Promise<ProjectEnvironment> {
    const root = await SpotProject(path);

    if (!CheckForPath(root)) throw new FknError("Internal__Projects__CantDetermineEnv", `Path ${root} doesn't exist.`);

    const hall_of_trash = JoinPaths(root, "node_modules");
    const workspaces = await GetWorkspaces(root);

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
            await Promise.all(
                Object.entries(paths.deno).map(([key, path]) => [key, CheckForPath(path)]),
            ),
        ),
        bun: Object.fromEntries(
            await Promise.all(
                Object.entries(paths.bun).map(([key, path]) => [key, CheckForPath(path)]),
            ),
        ),
        node: Object.fromEntries(
            await Promise.all(
                Object.entries(paths.node).map(([key, path]) => [key, CheckForPath(path)]),
            ),
        ),
        golang: Object.fromEntries(
            await Promise.all(
                Object.entries(paths.golang).map(([key, path]) => [key, CheckForPath(path)]),
            ),
        ),
        rust: Object.fromEntries(
            await Promise.all(
                Object.entries(paths.rust).map(([key, path]) => [key, CheckForPath(path)]),
            ),
        ),
    };

    const isGolang = pathChecks.golang.pkg || pathChecks.golang.lock;
    const isRust = pathChecks.rust.pkg || pathChecks.rust.lock;
    const isDeno = pathChecks.deno.lock ||
        pathChecks.deno.json ||
        pathChecks.deno.jsonc;
    const isBun = pathChecks.bun.lock ||
        pathChecks.bun.lockb ||
        pathChecks.bun.toml;
    const isNode = pathChecks.node.lockNpm ||
        pathChecks.node.lockPnpm ||
        pathChecks.node.lockYarn ||
        pathChecks.node.json;

    if (
        !pathChecks.node.json && !pathChecks.deno.json && !pathChecks.bun.toml && !pathChecks.golang.pkg && !pathChecks.rust.pkg
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
        ? pathChecks.deno.jsonc ? paths.deno.jsonc : pathChecks.deno.json ? paths.deno.json : paths.node.json
        : paths.node.json;

    const mainString: string = await Deno.readTextFile(mainPath);
    const settings: FullFkNodeYaml = await GetProjectSettings(root);

    const { PackageFileParsers } = FkNodeInterop;

    if (isGolang) {
        return {
            root,
            settings,
            main: {
                path: mainPath,
                name: "go.mod",
                stdContent: PackageFileParsers.Golang.STD(mainString),
                cpfContent: PackageFileParsers.Golang.CPF(mainString, await Git.GetLatestTag(root), workspaces),
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
            },
            workspaces,
        };
    }
    if (isRust) {
        return {
            root,
            settings,
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
            },
            workspaces,
        };
    }
    if (isBun) {
        return {
            root,
            settings,
            main: {
                path: mainPath,
                name: "package.json",
                stdContent: PackageFileParsers.NodeBun.STD(mainString),
                cpfContent: PackageFileParsers.NodeBun.CPF(mainString, "bun", workspaces),
            },
            lockfile: {
                name: pathChecks.bun.lockb ? "bun.lockb" : "bun.lock",
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
            },
            workspaces,
        };
    }
    if (isDeno) {
        return {
            root,
            settings,
            main: {
                path: mainPath,
                name: pathChecks.deno.jsonc ? "deno.jsonc" : "deno.json",
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
            },
            workspaces,
        };
    }
    if (pathChecks.node.lockYarn) {
        return {
            root,
            settings,
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
                audit: ["audit", "--recursive", "--all"],
                publish: ["publish", "--non-interactive"],
            },
            workspaces,
        };
    }
    if (pathChecks.node.lockPnpm) {
        return {
            root,
            settings,
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
                audit: ["audit", "--ignore-registry-errors"],
                publish: ["publish"],
            },
            workspaces,
        };
    }
    if (pathChecks.node.lockNpm) {
        return {
            root,
            settings,
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
                audit: ["audit"],
                publish: ["publish"],
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
 * @async
 * @param {string} lockfilePath
 * @returns {Promise<unknown>} Whatever the file returns :)
 */
export async function ParseLockfile(lockfilePath: string): Promise<unknown> {
    const file = await Deno.readTextFile(ParsePath(lockfilePath));
    if (lockfilePath.includes(".yaml") || lockfilePath.includes(".lock")) {
        return parseYaml(file);
    } else {
        return JSON.parse(file);
    }
}

/**
 * Tries to spot the given project name inside of the project list, returning its root path. If not found, returns the parsed path. It also works when you pass a path, parsing it to handle `--self` and relative paths.
 *
 * @export
 * @async
 * @param {UnknownString} name Project's name, path, or `--self`.
 * @returns {Promise<string>}
 */
export async function SpotProject(name: UnknownString): Promise<string> {
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
            await NameProject(project, "name-colorless"),
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
 * @async
 * @returns {Promise<0 | 1>} 0 if success, 1 if no projects to remove.
 */
export async function CleanupProjects(): Promise<0 | 1> {
    const listOfRemovals: { project: string; issue: PROJECT_ERROR_CODES }[] = [];

    const allProjects = GetAllProjects();

    for (const project of allProjects) {
        const validation = await ValidateProject(project, true);

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

    for (const target of result) await RemoveProject(target.project, false);

    return 0;
}
