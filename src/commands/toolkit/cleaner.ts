import { FULL_NAME } from "../../constants.ts";
import { Commander, ManagerExists } from "../../functions/cli.ts";
import { GetUserSettings } from "../../functions/config.ts";
import { BulkRemove, CheckForPath, JoinPaths, ParsePath } from "../../functions/filesystem.ts";
import { Interrogate, LogStuff } from "../../functions/io.ts";
import { GetProjectEnvironment, UnderstandProjectProtection } from "../../functions/projects.ts";
import type { CleanerIntensity } from "../../types/config_params.ts";
import type { LOCKFILE_GLOBAL, MANAGER_GLOBAL, ProjectEnvironment } from "../../types/platform.ts";
import { FknError } from "../../functions/error.ts";
import { CanCommit, Commit } from "../../functions/git.ts";
import type { RESULT } from "../clean.ts";
import { sortAlphabetically, validate } from "@zakahacecosas/string-utils";
import { FkNodeInterop } from "../interop/interop.ts";
import { LOCAL_PLATFORM } from "../../constants/platform.ts";
import { FWORDS } from "../../constants/fwords.ts";
import { ColorString } from "../../functions/color.ts";

/**
 * All project cleaning features.
 */
const ProjectCleaningFeatures = {
    Update: (
        projectName: string,
        env: ProjectEnvironment,
        errors: string[],
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Updating dependencies for ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Update(env);
            if (output === true) LogStuff(`Updated dependencies for ${projectName}!`, "tick");
            return;
        } catch {
            LogStuff(`Failed to update deps for ${projectName}!`, "warn", "bright-yellow");
            errors.push("updater");
            return;
        }
    },
    Clean: (
        projectName: string,
        env: ProjectEnvironment,
    ) => {
        Deno.chdir(env.root);
        const { commands } = env;
        if (!commands.clean) return;
        LogStuff(
            `Cleaning ${projectName}.`,
            "working",
        );
        for (const args of commands.clean) {
            LogStuff(`${commands.base} ${args.join(" ")}`, "wip");
            Commander(commands.base, args);
        }
        LogStuff(`Cleaned ${projectName}!`, "tick");

        return;
    },
    Lint: (
        projectName: string,
        env: ProjectEnvironment,
        errors: string[],
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Linting ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Lint(
                env,
            );
            if (output === true) LogStuff(`Linted ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to lint ${projectName}: ${e}`, "warn", "bright-yellow");
            errors.push("linter");
            return;
        }
    },
    Pretty: (
        projectName: string,
        env: ProjectEnvironment,
        errors: string[],
    ) => {
        Deno.chdir(env.root);
        LogStuff(
            `Prettifying ${projectName}.`,
            "working",
        );
        try {
            const output = FkNodeInterop.Features.Pretty(env);
            if (output === true) LogStuff(`Prettified ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to pretty ${projectName}: ${e}`, "warn", "bright-yellow");
            errors.push("prettifier");
            return;
        }
    },
    Destroy: (
        projectName: string,
        env: ProjectEnvironment,
        intensity: CleanerIntensity,
        errors: string[],
    ) => {
        Deno.chdir(env.root);
        try {
            if (!env.settings.destroy) return;
            if (
                !env.settings.destroy.intensities.includes(intensity)
                && !env.settings.destroy.intensities.includes("*")
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
                        // using ColorString instead of the 3rd arg is on purpose
                        // emojis in italic look WEIRD
                        LogStuff(
                            ColorString(`No need to destroy ${ColorString(path, "bold")}: it does not exist.`, "italic"),
                            "tick",
                        );
                        continue;
                    }
                    LogStuff(`Error destroying ${path}: ${e}`, "error", "red");
                    continue;
                }
            }
            LogStuff(`Destroyed stuff at ${projectName}!`, "tick");
            return;
        } catch (e) {
            LogStuff(`Failed to destroy stuff at ${projectName}: ${e}`, "warn", "bright-yellow");
            errors.push("destroyer");
            return;
        }
    },
    Commit: (
        projectName: string,
        env: ProjectEnvironment,
        shouldUpdate: boolean,
        shouldLint: boolean,
        shouldPrettify: boolean,
    ) => {
        if (env.settings.commitActions === false) {
            LogStuff("No committing allowed.", "bruh");
            return;
        }
        if (!shouldUpdate && !shouldLint && !shouldPrettify) {
            LogStuff("No actions to be committed.", "bruh");
            return;
        }
        if (!CanCommit(env.root)) {
            LogStuff("Tree isn't clean, can't commit", "bruh");
            return;
        }
        Deno.chdir(env.root);
        function getCommitMessage(): string {
            if (
                env.settings.commitMessage !== false && validate(env.settings.commitMessage)
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

        Commit(ParsePath(env.root), getCommitMessage(), "all", []);
        LogStuff(`Committed your changes to ${projectName}!`, "tick");
        return;
    },
};

/**
 * Cleans a project.
 *
 * @param {string} motherfuckerInQuestion
 * @param {boolean} shouldUpdate
 * @param {boolean} shouldLint
 * @param {boolean} shouldPrettify
 * @param {boolean} shouldDestroy
 * @param {boolean} shouldCommit
 * @param {("normal" | "hard" | "maxim")} intensity
 * @returns {Promise<{ protection: string | null; errors: string | null; }>}
 */
export async function PerformCleanup(
    motherfuckerInQuestion: string,
    shouldUpdate: boolean,
    shouldLint: boolean,
    shouldPrettify: boolean,
    shouldDestroy: boolean,
    shouldCommit: boolean,
    intensity: "normal" | "hard" | "maxim",
): Promise<{
    protection: string | null;
    errors: string | null;
}> {
    const env = await GetProjectEnvironment(motherfuckerInQuestion);

    const protections: string[] = [];
    const errors: string[] = [];

    ([[shouldUpdate, "updater"], [shouldLint, "linter"], [shouldPrettify, "prettifier"], [shouldDestroy, "destroyer"], [
        true,
        "cleaner",
    ]] as [
        boolean,
        "updater",
    ][]).forEach((v) => {
        if (v[0] === true && (env.settings.divineProtection === "*" || env.settings.divineProtection.includes(v[1]))) protections.push(v[1]);
    });

    const { doClean, doDestroy, doLint, doPrettify, doUpdate } = UnderstandProjectProtection(env.settings, {
        update: shouldUpdate,
        prettify: shouldPrettify,
        destroy: shouldDestroy,
        lint: shouldLint,
    });

    /** "what should we do with the drunken sailor..." */
    const whatShouldWeDo: Record<
        "update" | "lint" | "pretty" | "destroy" | "commit",
        boolean
    > = {
        update: doUpdate || (env.settings.flagless?.flaglessUpdate === true),
        lint: doLint || (env.settings.flagless?.flaglessLint === true),
        pretty: doPrettify || (env.settings.flagless?.flaglessPretty === true),
        destroy: doDestroy || (env.settings.flagless?.flaglessDestroy === true),
        commit: shouldCommit || (env.settings.flagless?.flaglessCommit === true),
    };

    if (!env.commands.clean && Object.values(whatShouldWeDo).every((v) => v === false)) {
        LogStuff(
            `${env.names.name} will be skipped. ${
                ColorString(env.manager, "bold")
            } has no cleanup commands and no other feature is being used here.`,
        );
    }

    if (doClean) {
        ProjectCleaningFeatures.Clean(
            env.names.name,
            env,
        );
    }
    if (whatShouldWeDo["update"]) {
        ProjectCleaningFeatures.Update(
            env.names.name,
            env,
            errors,
        );
    }
    if (whatShouldWeDo["lint"]) {
        ProjectCleaningFeatures.Lint(
            env.names.name,
            env,
            errors,
        );
    }
    if (whatShouldWeDo["pretty"]) {
        ProjectCleaningFeatures.Pretty(
            env.names.name,
            env,
            errors,
        );
    }
    if (whatShouldWeDo["destroy"]) {
        ProjectCleaningFeatures.Destroy(
            env.names.name,
            env,
            intensity,
            errors,
        );
    }
    if (whatShouldWeDo["commit"]) {
        ProjectCleaningFeatures.Commit(
            env.names.name,
            env,
            whatShouldWeDo["update"],
            whatShouldWeDo["lint"],
            whatShouldWeDo["pretty"],
        );
    }

    return {
        protection: protections.length === 0 ? null : protections.map((s) => s.toUpperCase()).join(" & "),
        errors: errors.length === 0 ? null : errors.map((s) => s.toUpperCase()).join(" & "),
    };
}

/**
 * Performs a hard cleanup, AKA cleans global caches.
 *
 * @returns {void}
 */
export function PerformHardCleanup(): void {
    LogStuff(
        `Time for hard-pruning! ${ColorString("Wait patiently, please (caches will take a while to clean).", "italic")}`,
        "working",
    );

    const tmp = Deno.makeTempDirSync({
        prefix: "FKNODE-HARD-CLEAN-TMP",
    }); // we make a temporal dir where we'll do "placebo" inits, as bun requires you to be in a bun project for it to clean stuff
    // for deno idk if its necessary but i'll do it anyway

    Deno.chdir(tmp);

    const npmHardPruneArgs: string[] = ["cache", "clean", "--force"];
    const pnpmHardPruneArgs: string[] = ["store", "prune"];
    const yarnHardPruneArgs: string[] = ["cache", "clean"];
    const bunHardPruneArgs: string[] = ["pm", "cache", "rm"];
    // const denoHardPruneArgs: string[] = ["clean"];
    const golangHardPruneArgs: string[] = ["clean", "-modcache"];

    if (ManagerExists("npm")) {
        try {
            LogStuff(
                "NPM",
                "package",
                "red",
            );
            LogStuff(`Running ${ColorString(npmHardPruneArgs.join(" "), "italic")}`, undefined, ["bold", "half-opaque"]);
            Commander("npm", npmHardPruneArgs);
            LogStuff("Done", "tick");
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }
    if (ManagerExists("pnpm")) {
        try {
            LogStuff(
                "PNPM",
                "package",
                "bright-yellow",
            );
            LogStuff(`Running ${ColorString(pnpmHardPruneArgs.join(" "), "italic")}`, undefined, ["bold", "half-opaque"]);
            Commander("pnpm", pnpmHardPruneArgs);
            LogStuff("Done", "tick");
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }
    if (ManagerExists("yarn")) {
        try {
            LogStuff(
                "YARN",
                "package",
                "purple",
            );
            LogStuff(`Running ${ColorString(yarnHardPruneArgs.join(" "), "italic")}`, undefined, ["bold", "half-opaque"]);
            Commander("yarn", yarnHardPruneArgs);
            LogStuff("Done", "tick");
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }

    if (ManagerExists("bun")) {
        try {
            LogStuff(
                "BUN",
                "package",
                "pink",
            );
            Commander("bun", ["init", "-y"]); // placebo
            LogStuff(`Running ${ColorString(bunHardPruneArgs.join(" "), "italic")}`, undefined, ["bold", "half-opaque"]);
            Commander("bun", bunHardPruneArgs);
            LogStuff("Done", "tick");
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }

    if (ManagerExists("go")) {
        try {
            LogStuff(
                "GOLANG",
                "package",
                "cyan",
            );
            LogStuff(`Running ${ColorString(golangHardPruneArgs.join(" "), "italic")}`, undefined, ["bold", "half-opaque"]);
            Commander("go", golangHardPruneArgs);
            LogStuff("Done", "tick");
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
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
            if (!denoDir) throw "DENO_DIR is not defined in your environment variable set. Cannot clear Deno caches.";
            LogStuff(
                "DENO",
                "package",
                "bright-blue",
            );
            LogStuff(`Deleting ${ColorString(denoDir, "italic")}`, undefined, ["bold", "half-opaque"]);
            Deno.removeSync(denoDir);
            LogStuff("Done", "tick");
            // the CLI calls this kind of behaviors "maxim" cleanup
            // yet we're doing from the "hard" preset and not the
            // "maxim" one
            // epic.
        } catch (error) {
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }

    // rust requires a gluefix too
    if (ManagerExists("cargo")) {
        try {
            let path: string;
            if (LOCAL_PLATFORM.SYSTEM === "msft") {
                const envPath = Deno.env.get("USERPROFILE");
                if (!envPath) throw "USERPROFILE is not defined in your environment variable set. Cannot clear caches.";
                path = JoinPaths(envPath, ".cargo/registry");
            } else {
                path = ParsePath("~/.cargo/registry");
            }
            LogStuff(
                "CARGO",
                "package",
                "orange",
            );
            LogStuff(`Deleting ${ColorString(path, "italic")}`, undefined, ["bold", "half-opaque"]);
            Deno.removeSync(path, { recursive: true });
            LogStuff("Done", "tick");
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                LogStuff("Apparently there's no Cargo registry cache.", "moon-face", "italic");
                LogStuff("Done", "tick");
            }
            LogStuff("Failed!", "error");
            LogStuff(error);
        }
    }

    return;
}

/**
 * Performs a maxim cleanup, AKA removes node_modules.
 *
 * @async
 * @param {string[]} projects Projects to be cleaned.
 * @returns {void}
 */
export async function PerformMaximCleanup(projects: string[]): Promise<void> {
    LogStuff(
        `Time for maxim-pruning! ${ColorString("Wait patiently, please (node_modules takes a while to remove).", "italic")}`,
        "working",
    );

    const trash = [];

    for (const project of projects) {
        const env = await GetProjectEnvironment(project);

        // TODO(@ZakaHaceCosas) add cargo target
        if (env.runtime === "rust" || env.runtime === "golang") continue;

        if (!(CheckForPath(env.hall_of_trash))) {
            LogStuff(
                `Maxim pruning didn't find the node_modules DIR at ${env.names.name}. Skipping this ${FWORDS.MF}...`,
                "bruh",
            );
            continue;
        }
        LogStuff(
            `Maxim pruning for ${env.names.name}!!`,
            "trash",
        );
        // hall_of_trash path should be absolute
        trash.push(env.hall_of_trash);
    }
    await BulkRemove(trash);
    LogStuff(
        `Maxim pruned all possible projects!`,
        "tick",
    );
}

/**
 * Validates the provided intensity and handles stuff like `--`.
 *
 * @param {string} intensity
 * @returns {CleanerIntensity}
 */
export function ValidateIntensity(intensity: string): CleanerIntensity {
    const cleanedIntensity = intensity.trim().toLowerCase();

    if (!["hard", "hard-only", "normal", "maxim", "maxim-only", "--"].includes(cleanedIntensity)) {
        throw new FknError("Param__CIntensityInvalid", `Provided intensity '${intensity}' is not valid.`);
    }

    const workingIntensity = cleanedIntensity as CleanerIntensity | "--";
    const defaultIntensity = (GetUserSettings())["default-intensity"];

    if (workingIntensity === "--") return defaultIntensity;

    if (workingIntensity === "normal") return "normal";

    if (workingIntensity === "hard") return "hard";

    if (workingIntensity === "hard-only") return "hard-only";

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
 * Shows a report with the results of the cleanup.
 *
 * @param {RESULT[]} results
 */
export function ShowReport(results: RESULT[]): void {
    LogStuff("Report:\n", "chart");
    const report: string[] = results.map((result) => {
        const protection = result.extras?.ignored
            ? ColorString(
                `\n--> The above ${ColorString("was divinely protected from", "blue", "bold", "italic")} ${
                    ColorString(result.extras?.ignored, "bold")
                }`,
                "italic",
            )
            : "";
        const errors = result.extras?.failed
            ? ColorString(
                `\n--> The above ${ColorString("faced errors with", "bold", "red", "italic")} ${ColorString(result.extras?.failed, "bold")}`,
                "italic",
            )
            : "";

        return `${result.name} -> ${ColorString(result.status, "bold")}, taking ${
            ColorString(result.elapsedTime, "italic")
        }${protection}${errors}`;
    });
    LogStuff(
        `${sortAlphabetically(report).join("\n")}\n\n${ColorString(`Cleaning completed at ${new Date().toLocaleString()}`, "bright-green")}`,
        "tick",
    );
}

/**
 * Resolves all lockfiles of a project.
 *
 * @param {string} path
 * @returns {LOCKFILE_GLOBAL[]} All lockfiles
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
    for (const lockfile of possibleLockfiles) if (CheckForPath(JoinPaths(path, lockfile))) lockfiles.push(lockfile);
    return lockfiles;
}

/**
 * Names a lockfile using a manager name.
 *
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
