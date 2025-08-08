import { FULL_NAME, FWORDS, isDef, LOCAL_PLATFORM } from "../../constants.ts";
import { Commander, ManagerExists } from "../../functions/cli.ts";
import { GetAppPath, GetUserSettings } from "../../functions/config.ts";
import { BulkRemoveFiles, CheckForPath, JoinPaths, ParsePath } from "../../functions/filesystem.ts";
import { ColorString, Interrogate, LogStuff } from "../../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject, UnderstandProjectProtection } from "../../functions/projects.ts";
import type { CleanerIntensity } from "../../types/config_params.ts";
import type { LOCKFILE_GLOBAL, MANAGER_GLOBAL, ProjectEnvironment } from "../../types/platform.ts";
import { FknError } from "../../functions/error.ts";
import { CanCommit, Commit } from "../../functions/git.ts";
import type { tRESULT } from "../clean.ts";
import { sortAlphabetically, validate } from "@zakahacecosas/string-utils";
import { FkNodeInterop } from "../interop/interop.ts";

/**
 * All project cleaning features.
 */
const ProjectCleaningFeatures = {
    Update: (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Updating dependencies for ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Update({
                env,
                verbose,
            });
            if (output === true) LogStuff(`Updated dependencies for ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to update deps for ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Clean: (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        Deno.chdir(env.root);
        const { commands } = env;
        if (commands.clean === "__UNSUPPORTED") {
            LogStuff(
                `${projectName}'s cleanup is limited, as ${env.manager} doesn't have cleaning commands. If no other feature (linting, prettifying...) was specified, we'll just skip it.`,
                "warn",
                "bright-yellow",
            );
            return;
        }
        LogStuff(
            `Cleaning ${projectName}.`,
            "working",
        );
        for (const args of commands.clean) {
            LogStuff(`${commands.base} ${args.join(" ")}`, "wip");
            Commander(commands.base, args, verbose);
        }
        LogStuff(`Cleaned ${projectName}!`, "tick");

        return;
    },
    Lint: (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Linting ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Lint({
                env,
                verbose,
            });
            if (output === true) LogStuff(`Linted ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to lint ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Pretty: (
        projectName: string,
        env: ProjectEnvironment,
        verbose: boolean,
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Prettifying ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Pretty({
                env,
                verbose,
            });
            if (output === true) LogStuff(`Prettified ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to pretty ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Destroy: (
        projectName: string,
        env: ProjectEnvironment,
        intensity: CleanerIntensity,
        verbose: boolean,
    ) => {
        Deno.chdir(env.root);
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
                    Deno.removeSync(path, {
                        recursive: true,
                    });
                    LogStuff(`Destroyed ${path} successfully`, "tick");
                    continue;
                } catch (e) {
                    if (String(e).includes("os error 2")) {
                        LogStuff(
                            `Didn't destroy ${ColorString(path, "bold")}: it does not exist!`,
                            "warn",
                            "bright-yellow",
                            verbose,
                        );
                        continue;
                    }
                    LogStuff(`Error destroying ${path}: ${e}`, "error", "red", verbose);
                    continue;
                }
            }
            LogStuff(`Destroyed stuff at ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to destroy stuff at ${projectName}: ${e}`, "warn", "bright-yellow");
            return;
        }
    },
    Commit: (
        env: ProjectEnvironment,
        shouldUpdate: boolean,
        shouldLint: boolean,
        shouldPrettify: boolean,
    ) => {
        if (!shouldUpdate && !shouldLint && !shouldPrettify) {
            LogStuff("No actions to be committed.", "bruh");
            return;
        }
        if (env.settings.commitActions === false) {
            LogStuff("No committing allowed.", "bruh");
            return;
        }
        if (!CanCommit(env.root)) {
            LogStuff("Tree isn't clean, can't commit", "bruh");
            return;
        }
        Deno.chdir(env.root);
        function getCommitMessage() {
            if (
                validate(env.settings.commitMessage) && !(isDef(env.settings.commitMessage))
            ) {
                return env.settings.commitMessage;
            }

            const tasks: string[] = [];

            if (shouldUpdate) tasks.push("updating");
            if (shouldLint) tasks.push("linting");
            if (shouldPrettify) tasks.push("prettifying");

            const taskString = tasks.join(" and ");
            return `Code ${taskString} tasks (Auto-generated by ${FULL_NAME})`;
        }

        const success = Commit(ParsePath(env.root), getCommitMessage(), "all", []);
        if (success === 1) {
            LogStuff(`Committed your changes to ${NameProject(env.root, "name")}!`, "tick");
        }
        return;
    },
};

/**
 * Cleans a project.
 *
 * @export
 * @param {string} projectInQuestion
 * @param {boolean} shouldUpdate
 * @param {boolean} shouldLint
 * @param {boolean} shouldPrettify
 * @param {boolean} shouldDestroy
 * @param {boolean} shouldCommit
 * @param {("normal" | "hard" | "maxim")} intensity
 * @param {boolean} verboseLogging
 * @returns {boolean}
 */
export function PerformCleanup(
    projectInQuestion: string,
    shouldUpdate: boolean,
    shouldLint: boolean,
    shouldPrettify: boolean,
    shouldDestroy: boolean,
    shouldCommit: boolean,
    intensity: "normal" | "hard" | "maxim",
    verboseLogging: boolean,
): boolean {
    const motherfuckerInQuestion = ParsePath(projectInQuestion);
    const projectName = ColorString(NameProject(motherfuckerInQuestion, "name"), "bold");
    const workingEnv = GetProjectEnvironment(motherfuckerInQuestion);

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
        lint: doLint || (workingEnv.settings.flagless?.flaglessLint === true),
        pretty: doPrettify || (workingEnv.settings.flagless?.flaglessPretty === true),
        destroy: doDestroy || (workingEnv.settings.flagless?.flaglessDestroy === true),
        commit: shouldCommit || (workingEnv.settings.flagless?.flaglessCommit === true),
    };

    if (doClean) {
        ProjectCleaningFeatures.Clean(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["update"]) {
        ProjectCleaningFeatures.Update(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["lint"]) {
        ProjectCleaningFeatures.Lint(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["pretty"]) {
        ProjectCleaningFeatures.Pretty(
            projectName,
            workingEnv,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["destroy"]) {
        ProjectCleaningFeatures.Destroy(
            projectName,
            workingEnv,
            intensity,
            verboseLogging,
        );
    }
    if (whatShouldWeDo["commit"]) {
        ProjectCleaningFeatures.Commit(
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
 * @param {boolean} verboseLogging
 * @returns {void}
 */
export function PerformHardCleanup(
    verboseLogging: boolean,
): void {
    LogStuff(
        `Time for hard-pruning! ${ColorString("Wait patiently, please (caches will take a while to clean).", "italic")}`,
        "working",
    );

    const tmp = Deno.makeTempDirSync({
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

    if (ManagerExists("npm")) {
        LogStuff(
            "NPM",
            "package",
            "red",
        );
        Commander("npm", npmHardPruneArgs, verboseLogging);
        LogStuff("Done", "tick");
    }
    if (ManagerExists("pnpm")) {
        LogStuff(
            "PNPM",
            "package",
            "bright-yellow",
        );
        Commander("pnpm", pnpmHardPruneArgs, true);
        LogStuff("Done", "tick");
    }
    if (ManagerExists("yarn")) {
        LogStuff(
            "YARN",
            "package",
            "purple",
        );
        Commander("yarn", yarnHardPruneArgs, true);
        LogStuff("Done", "tick");
    }

    if (ManagerExists("bun")) {
        LogStuff(
            "BUN",
            "package",
            "pink",
        );
        Commander("bun", ["init", "-y"], verboseLogging); // placebo
        Commander("bun", bunHardPruneArgs, verboseLogging);
        LogStuff("Done", "tick");
    }

    if (ManagerExists("go")) {
        LogStuff(
            "GOLANG",
            "package",
            "cyan",
        );
        Commander("go", golangHardPruneArgs, verboseLogging);
        LogStuff("Done", "tick");
    }
    /* if (ManagerExists("deno")) {
        Commander("deno", ["init"], false); // placebo 2
        Commander("deno", denoHardPruneArgs, true);
    } */

    // deno requires this glue fix
    // because apparently i cannot clear the cache of deno
    // using a program thats written in deno
    // and it throws an error and exits the CLI
    // epic.
    if (ManagerExists("deno")) {
        try {
            const denoDir: string | undefined = Deno.env.get("DENO_DIR");
            if (!denoDir) throw "lmao";
            LogStuff(
                "DENO",
                "package",
                "bright-blue",
            );
            Deno.removeSync(denoDir);
            LogStuff("Done", "tick");
            // the CLI calls this kind of behaviors "maxim" cleanup
            // yet we're doing from the "hard" preset and not the
            // "maxim" one
            // epic.
        } catch {
            // nothing happened.
        }
    }

    // rust requires a gluefix too
    if (ManagerExists("cargo")) {
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
            LogStuff(
                "CARGO",
                "package",
                "orange",
            );
            BulkRemoveFiles(paths);
            LogStuff("Done", "tick");
        } catch {
            // nothing happened.
        }
    }

    // free the user's space
    Deno.writeTextFileSync(
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
 * @returns {void}
 */
export function PerformMaximCleanup(projects: string[]): void {
    LogStuff(
        `Time for maxim-pruning! ${ColorString("Wait patiently, please (node_modules takes a while to remove).", "italic")}`,
        "working",
    );

    for (const project of projects) {
        const workingProject = SpotProject(project);
        const name = NameProject(workingProject, "name");
        const env = GetProjectEnvironment(workingProject);

        if (env.runtime === "rust" || env.runtime === "golang") continue;

        LogStuff(
            `Maxim pruning for ${name}`,
            "trash",
        );
        if (!CheckForPath(env.hall_of_trash)) {
            LogStuff(
                `Maxim pruning didn't find the node_modules DIR at ${name}. Skipping this ${FWORDS.MF}...`,
                "bruh",
            );
            return;
        }
        // hall_of_trash path should be absolute
        Deno.removeSync(env.hall_of_trash, {
            recursive: true,
        });
        LogStuff(
            `Maxim pruned ${name}.`,
            "tick",
        );
    }
}

/**
 * Validates the provided intensity and handles stuff like `--`.
 *
 * @export
 * @param {string} intensity
 * @returns {CleanerIntensity}
 */
export function ValidateIntensity(intensity: string): CleanerIntensity {
    const cleanedIntensity = intensity.trim().toLowerCase();

    if (!["hard", "hard-only", "normal", "maxim", "maxim-only", "--"].includes(cleanedIntensity)) {
        throw new FknError("Param__CIntensityInvalid", `Provided intensity '${intensity}' is not valid.`);
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
        const confirmMaxim = Interrogate(
            ' Are you sure you want to use maxim cleanup? It\'ll entirely remove "./node_modules" from all of your added projects.',
            "warn",
        );
        return confirmMaxim ? workingIntensity : defaultIntensity;
    } else {
        return defaultIntensity;
    }
}

/**
 * Shows a basic report.
 *
 * @export
 * @param {{ path: string; status: string }[]} results
 * @returns {Promise<void>}
 */
export function ShowReport(results: tRESULT[]): void {
    // shows a report
    LogStuff("Report:", "chart");
    const report: string[] = [];
    for (const result of results) {
        const name = NameProject(result.path, "all");
        const status = ColorString(result.status, "bold");
        const elapsedTime = ColorString(result.elapsedTime, "italic");

        const theResult = `${name} -> ${status}, taking us ${elapsedTime}`;
        report.push(theResult);
    }
    const sortedReport = sortAlphabetically(report).join("\n");
    LogStuff(sortedReport, undefined);
    LogStuff(
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
