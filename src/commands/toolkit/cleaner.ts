import { FULL_NAME, I_LIKE_JS, isDef, LOCAL_PLATFORM } from "../../constants.ts";
import { Commander, CommandExists } from "../../functions/cli.ts";
import { GetAppPath, GetUserSettings } from "../../functions/config.ts";
import { BulkRemoveFiles, CheckForPath, JoinPaths, ParsePath } from "../../functions/filesystem.ts";
import { ColorString, LogStuff } from "../../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject, UnderstandProjectProtection } from "../../functions/projects.ts";
import type { CleanerIntensity } from "../../types/config_params.ts";
import type { LOCKFILE_GLOBAL, MANAGER_GLOBAL, ProjectEnvironment } from "../../types/platform.ts";
import { FknError } from "../../functions/error.ts";
import { Git } from "../../functions/git.ts";
import type { tRESULT } from "../clean.ts";
import { StringUtils } from "@zakahacecosas/string-utils";
import { FkNodeInterop } from "../interop/interop.ts";

/**
 * All project cleaning features.
 */
const ProjectCleaningFeatures = {
    Update: async (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        await LogStuff(
            `Updating dependencies for ${projectName}.`,
            "working",
        );
        try {
            const output = await FkNodeInterop.Features.Update({
                env,
                verbose,
            });
            if (output === true) await LogStuff(`Updated dependencies for ${projectName}!`, "tick");
            return;
        } catch (e) {
            await LogStuff(`Failed to update deps for ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Clean: async (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        const { commands } = env;
        if (commands.clean === "__UNSUPPORTED") {
            await LogStuff(
                `Cannot clean ${projectName}: cleanup is unsupported for ${env.manager}.`,
                "warn",
                "bright-yellow",
            );
            return;
        }
        await LogStuff(
            `Cleaning ${projectName}.`,
            "working",
        );
        for (const args of commands.clean) {
            await LogStuff(`${commands.base} ${args.join(" ")}`, "wip");
            await Commander(commands.base, args, verbose);
        }
        await LogStuff(`Cleaned ${projectName}!`, "tick");

        return;
    },
    Lint: async (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        await LogStuff(
            `Linting ${projectName}.`,
            "working",
        );
        try {
            const output = await FkNodeInterop.Features.Lint({
                env,
                verbose,
            });
            if (output === true) await LogStuff(`Linted ${projectName}!`, "tick");
            return;
        } catch (e) {
            await LogStuff(`Failed to lint ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Pretty: async (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        await LogStuff(
            `Prettifying ${projectName}.`,
            "working",
        );
        try {
            const output = await FkNodeInterop.Features.Pretty({
                env,
                verbose,
            });
            if (output === true) await LogStuff(`Prettified ${projectName}!`, "tick");
            return;
        } catch (e) {
            await LogStuff(`Failed to pretty ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Destroy: async (
        projectName: string,
        env: ProjectEnvironment,
        intensity: CleanerIntensity,
        verbose: boolean,
    ) => {
        try {
            if (!env.settings.destroy) return;
            if (
                !env.settings.destroy.intensities.includes(intensity) &&
                !env.settings.destroy.intensities.includes("*")
            ) return;
            if (env.settings.destroy.targets.length === 0) return;
            for (const target of env.settings.destroy.targets) {
                if (target === "node_modules" && intensity === "maxim") continue; // avoid removing this thingy twice
                const path = ParsePath(JoinPaths(env.root, target));
                try {
                    await Deno.remove(path, {
                        recursive: true,
                    });
                    await LogStuff(`Destroyed ${path} successfully`, "tick");
                    continue;
                } catch (e) {
                    if (String(e).includes("os error 2")) {
                        await LogStuff(
                            `Didn't destroy ${ColorString(path, "bold")}: it does not exist!`,
                            "warn",
                            "bright-yellow",
                            undefined,
                            verbose,
                        );
                        continue;
                    }
                    await LogStuff(`Error destroying ${path}: ${e}`, "error", "red", undefined, verbose);
                    continue;
                }
            }
            await LogStuff(`Destroyed stuff at ${projectName}!`, "tick");
            return;
        } catch (e) {
            await LogStuff(`Failed to destroy stuff at ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Commit: async (
        env: ProjectEnvironment,
        shouldUpdate: boolean,
        shouldLint: boolean,
        shouldPrettify: boolean,
    ) => {
        if (!shouldUpdate && !shouldLint && !shouldPrettify) {
            await LogStuff("No actions to be committed.", "bruh");
            return;
        }
        if (env.settings.commitActions === false) {
            await LogStuff("No committing allowed.", "bruh");
            return;
        }
        if (!(await Git.CanCommit(env.root))) {
            await LogStuff("Tree isn't clean, can't commit", "bruh");
            return;
        }
        const getCommitMessage = () => {
            if (
                StringUtils.validate(env.settings.commitMessage) && !(isDef(env.settings.commitMessage))
            ) {
                return env.settings.commitMessage;
            }

            const tasks: string[] = [];

            if (shouldUpdate) tasks.push("updating");
            if (shouldLint) tasks.push("linting");
            if (shouldPrettify) tasks.push("prettifying");

            const taskString = tasks.join(" and ");
            return `Code ${taskString} tasks (Auto-generated by ${FULL_NAME})`;
        };

        await Git.Commit(ParsePath(env.root), getCommitMessage(), "all", []).then(
            async (success) => {
                if (success === 1) {
                    await LogStuff(`Committed your changes to ${await NameProject(env.root, "name")}!`, "tick");
                }
            },
        );
        return;
    },
};

/**
 * Cleans a project.
 *
 * @export
 * @async
 * @param {string} projectInQuestion
 * @param {boolean} shouldUpdate
 * @param {boolean} shouldLint
 * @param {boolean} shouldPrettify
 * @param {boolean} shouldDestroy
 * @param {boolean} shouldCommit
 * @param {("normal" | "hard" | "maxim")} intensity
 * @param {boolean} verboseLogging
 * @returns {Promise<boolean>}
 */
export async function PerformCleanup(
    projectInQuestion: string,
    shouldUpdate: boolean,
    shouldLint: boolean,
    shouldPrettify: boolean,
    shouldDestroy: boolean,
    shouldCommit: boolean,
    intensity: "normal" | "hard" | "maxim",
    verboseLogging: boolean,
): Promise<boolean> {
    const motherfuckerInQuestion = ParsePath(projectInQuestion);
    const projectName = ColorString(await NameProject(motherfuckerInQuestion, "name"), "bold");
    const workingEnv = await GetProjectEnvironment(motherfuckerInQuestion);

    const { doClean, doDestroy, doLint, doPrettify, doUpdate } = UnderstandProjectProtection(workingEnv.settings, {
        update: shouldUpdate,
        prettify: shouldPrettify,
        destroy: shouldDestroy,
        lint: shouldLint,
    });

    /* "what should we do with the drunken sailor..." */
    const whatShouldWeDo: Record<
        "update" | "lint" | "pretty" | "destroy" | "commit",
        boolean
    > = {
        update: doUpdate || (workingEnv.settings.flagless?.flaglessUpdate === true),
        lint: doPrettify || (workingEnv.settings.flagless?.flaglessLint === true),
        pretty: doLint || (workingEnv.settings.flagless?.flaglessPretty === true),
        destroy: doDestroy || (workingEnv.settings.flagless?.flaglessDestroy === true),
        commit: shouldCommit || (workingEnv.settings.flagless?.flaglessCommit === true),
    };

    if (doClean) {
        await ProjectCleaningFeatures.Clean(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["update"]) {
        await ProjectCleaningFeatures.Update(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["lint"]) {
        await ProjectCleaningFeatures.Lint(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["pretty"]) {
        await ProjectCleaningFeatures.Pretty(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["destroy"]) {
        await ProjectCleaningFeatures.Destroy(
            projectName,
            workingEnv,
            intensity,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["commit"]) {
        await ProjectCleaningFeatures.Commit(
            workingEnv,
            whatShouldWeDo["update"],
            whatShouldWeDo["lint"],
            whatShouldWeDo["pretty"],
        );
    }

    return true;
}

// cache cleaning is global, so doing these for every project like we used to do
// is a waste of resources
/**
 * Performs a hard cleanup, AKA cleans global caches.
 *
 * @export
 * @async
 * @param {boolean} verboseLogging
 * @returns {Promise<void>}
 */
export async function PerformHardCleanup(
    verboseLogging: boolean,
): Promise<void> {
    await LogStuff(
        `Time for hard-pruning! ${ColorString("Wait patiently, please (caches will take a while to clean).", "italic")}`,
        "working",
    );

    const tmp = await Deno.makeTempDir({
        prefix: "FKNODE-HARD-CLEAN-TMP",
    }); // we make a temporal dir where we'll do "placebo" inits, as bun requires you to be in a bun project for it to clean stuff
    // for deno idk if its necessary but i'll do it anyway

    Deno.chdir(tmp); // assuming this is called from the main cleaner, which at the end returns to the DIR it should.

    const npmHardPruneArgs: string[] = ["cache", "clean", "--force"];
    const pnpmHardPruneArgs: string[] = ["store", "prune"];
    const yarnHardPruneArgs: string[] = ["cache", "clean"];
    // bun and deno don't support yet project-wide cleanup
    // but they do support system-wide cleanup thanks to this
    // now F*kingNode is F*ckingJavascriptRuntimes :]
    const bunHardPruneArgs: string[] = ["pm", "cache", "rm"];
    // const denoHardPruneArgs: string[] = ["clean"];
    // cross platform!!
    const golangHardPruneArgs: string[] = ["clean", "-modcache"];

    if (CommandExists("npm")) {
        await LogStuff(
            "NPM",
            "package",
            "red",
        );
        await Commander("npm", npmHardPruneArgs, verboseLogging);
        await LogStuff("Done", "tick");
    }
    if (CommandExists("pnpm")) {
        await LogStuff(
            "PNPM",
            "package",
            "bright-yellow",
        );
        await Commander("pnpm", pnpmHardPruneArgs, true);
        await LogStuff("Done", "tick");
    }
    if (CommandExists("yarn")) {
        await LogStuff(
            "YARN",
            "package",
            "purple",
        );
        await Commander("yarn", yarnHardPruneArgs, true);
        await LogStuff("Done", "tick");
    }

    if (CommandExists("bun")) {
        await LogStuff(
            "BUN",
            "package",
            "pink",
        );
        await Commander("bun", ["init", "-y"], verboseLogging); // placebo
        await Commander("bun", bunHardPruneArgs, verboseLogging);
        await LogStuff("Done", "tick");
    }

    if (CommandExists("go")) {
        await LogStuff(
            "GOLANG",
            "package",
            "cyan",
        );
        await Commander("go", golangHardPruneArgs, verboseLogging);
        await LogStuff("Done", "tick");
    }
    /* if (CommandExists("deno")) {
        await Commander("deno", ["init"], false); // placebo 2
        await Commander("deno", denoHardPruneArgs, true);
    } */

    // deno requires this glue fix
    // because apparently i cannot clear the cache of deno
    // using a program thats written in deno
    // and it throws an error and exits the CLI
    // epic.
    if (CommandExists("deno")) {
        try {
            const denoDir: string | undefined = Deno.env.get("DENO_DIR");
            if (!denoDir) throw "lmao";
            await LogStuff(
                "DENO",
                "package",
                "bright-blue",
            );
            await Deno.remove(denoDir);
            await LogStuff("Done", "tick");
            // the CLI calls this kind of behaviors "maxim" cleanup
            // yet we're doing from the "hard" preset and not the
            // "maxim" one
            // epic.
        } catch {
            // nothing happened.
        }
    }

    // rust requires a gluefix too
    if (CommandExists("cargo")) {
        try {
            const paths: string[] = [];
            if (LOCAL_PLATFORM.SYSTEM === "windows") {
                const envPath = Deno.env.get("USERPROFILE");
                if (!envPath) throw "lmao";
                paths.push(
                    JoinPaths(envPath, ".cargo/registry"),
                    JoinPaths(envPath, ".cargo/git"),
                    JoinPaths(envPath, ".cargo/bin"),
                );
            } else {
                paths.push(
                    ParsePath("~/.cargo/registry"),
                    ParsePath("~/.cargo/git"),
                    ParsePath("~/.cargo/bin"),
                );
            }
            await LogStuff(
                "CARGO",
                "package",
                "orange",
            );
            await BulkRemoveFiles(paths);
            await LogStuff("Done", "tick");
        } catch {
            // nothing happened.
        }
    }

    // free the user's space
    await Deno.writeTextFile(
        GetAppPath("REM"),
        `${tmp}\n`,
        {
            append: true,
        },
    );

    return;
}

/**
 * Performs a maxim cleanup, AKA removes node_modules.
 *
 * @export
 * @async
 * @param {string[]} projects Projects to be cleaned.
 * @returns {Promise<void>}
 */
export async function PerformMaximCleanup(projects: string[]): Promise<void> {
    await LogStuff(
        `Time for maxim-pruning! ${ColorString("Wait patiently, please (node_modules takes a while to remove).", "italic")}`,
        "working",
    );

    for (const project of projects) {
        const workingProject = await SpotProject(project);
        const name = await NameProject(workingProject, "name");
        const env = await GetProjectEnvironment(workingProject);

        if (env.runtime === "rust" || env.runtime === "golang") continue;

        await LogStuff(
            `Maxim pruning for ${name}`,
            "trash",
        );
        if (!CheckForPath(env.hall_of_trash)) {
            await LogStuff(
                `Maxim pruning didn't find the node_modules DIR at ${name}. Skipping this ${I_LIKE_JS.MF}...`,
                "bruh",
            );
            return;
        }
        // hall_of_trash path should be absolute
        await Deno.remove(env.hall_of_trash, {
            recursive: true,
        });
        await LogStuff(
            `Maxim pruned ${name}.`,
            "tick",
        );
    }
}

/**
 * Validates the provided intensity and handles stuff like `--`.
 *
 * @export
 * @async
 * @param {string} intensity
 * @returns {Promise<CleanerIntensity>}
 */
export async function ValidateIntensity(intensity: string): Promise<CleanerIntensity> {
    const cleanedIntensity = intensity.trim().toLowerCase();

    if (!["hard", "hard-only", "normal", "maxim", "maxim-only", "--"].includes(cleanedIntensity)) {
        throw new FknError("Cleaner__InvalidCleanerIntensity", `Provided intensity '${intensity}' is not valid.`);
    }

    const workingIntensity = cleanedIntensity as CleanerIntensity | "--";
    const defaultIntensity = GetUserSettings().defaultIntensity;

    if (workingIntensity === "--") {
        return defaultIntensity;
    }

    if (workingIntensity === "normal") {
        return "normal";
    }

    if (workingIntensity === "hard") {
        return "hard";
    }

    if (workingIntensity === "hard-only") {
        return "hard-only";
    }

    if (workingIntensity === "maxim" || workingIntensity === "maxim-only") {
        const confirmMaxim = await LogStuff(
            "Are you sure you want to use maxim cleanup? It'll entirely remove the node_modules DIR for ALL of your projects.",
            "warn",
            ["bold", "italic"],
            true,
        );
        return confirmMaxim === true ? workingIntensity : defaultIntensity;
    } else {
        return defaultIntensity;
    }
}

/**
 * Shows a basic report.
 *
 * @export
 * @async
 * @param {{ path: string; status: string }[]} results
 * @returns {Promise<void>}
 */
export async function ShowReport(results: tRESULT[]): Promise<void> {
    // shows a report
    await LogStuff("Report:", "chart");
    const report: string[] = [];
    for (const result of results) {
        const name = await NameProject(result.path, "all");
        const status = ColorString(result.status, "bold");
        const elapsedTime = ColorString(result.elapsedTime, "italic");

        const theResult = `${name} -> ${status}, taking us ${elapsedTime}`;
        report.push(theResult);
    }
    const sortedReport = StringUtils.sortAlphabetically(report).join("\n");
    await LogStuff(sortedReport, undefined);
    await LogStuff(
        `Cleaning completed at ${new Date().toLocaleString()}`,
        "tick",
        "bright-green",
    );
}

/**
 * Resolves all lockfiles of a project.
 *
 * @export
 * @async
 * @param {string} path
 * @returns {Promise<LOCKFILE_GLOBAL[]>} All lockfiles
 */
export function ResolveLockfiles(path: string): LOCKFILE_GLOBAL[] {
    const lockfiles: LOCKFILE_GLOBAL[] = [];
    const possibleLockfiles: LOCKFILE_GLOBAL[] = [
        "pnpm-lock.yaml",
        "package-lock.json",
        "yarn.lock",
        "bun.lockb",
        "bun.lock",
        "deno.lock",
        "go.sum",
        "Cargo.lock",
    ];
    for (const lockfile of possibleLockfiles) {
        if (CheckForPath(JoinPaths(path, lockfile))) lockfiles.push(lockfile);
    }
    return lockfiles;
}

/**
 * Names a lockfile using a manager name.
 *
 * @export
 * @param {MANAGER_GLOBAL} manager Manager to name
 * @returns {LOCKFILE_GLOBAL} Lockfile name
 */
export function NameLockfile(
    manager: MANAGER_GLOBAL,
): LOCKFILE_GLOBAL {
    if (manager === "npm") return "package-lock.json";
    if (manager === "pnpm") return "pnpm-lock.yaml";
    if (manager === "yarn") return "yarn.lock";
    if (manager === "bun") return "bun.lock";
    if (manager === "deno") return "deno.lock";
    if (manager === "go") return "go.sum";
    return "Cargo.lock";
}
