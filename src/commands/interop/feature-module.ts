import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";
import { Commander } from "../../functions/cli.ts";
import { LogStuff } from "../../functions/io.ts";
import type { ProjectEnvironment } from "../../types/platform.ts";
import { DebugFknErr, FknError } from "../../functions/error.ts";
import { FkNodeInterop } from "./interop.ts";
import { isDef } from "../../constants.ts";
import { NameProject } from "../../functions/projects.ts";

function HandleError(
    err:
        | "Unknown__CleanerTask__Update"
        | "Unknown__CleanerTask__Lint"
        | "Unknown__CleanerTask__Pretty"
        | "Unknown__CleanerTask__Launch",
    stdout: UnknownString,
): never {
    DebugFknErr(
        err,
        "Something went wrong and we don't know what",
        stdout ??
            "UNDEFINED COMMAND STDOUT/STDERR - Check above, command output is likely to be present in your terminal session.",
    );
}

interface InteropedFeatureParams {
    /** Project's environment. */
    env: ProjectEnvironment;
    /** Whether to use verbose logging for this or not. */
    verbose: boolean;
}

/**
 * Cross-runtime compatible tasks. Supports linting, prettifying, and updating dependencies.
 */
export const InteropedFeatures = {
    Lint: async (params: InteropedFeatureParams): Promise<boolean> => {
        const { env, verbose } = params;
        const script = env.settings.lintCmd;

        if (StringUtils.validateAgainst(env.runtime, ["bun", "node"])) {
            if (isDef(script)) {
                if (FkNodeInterop.PackageFileUtils.SpotDependency("eslint", env.main.cpfContent.deps) === undefined) {
                    await LogStuff(
                        "No linter was given (via fknode.yaml > lintCmd), hence defaulted to ESLint - but ESLint is not installed!",
                        "bruh",
                    );
                    return false;
                }

                const output = await Commander(
                    env.commands.exec[0],
                    env.commands.exec.length === 1
                        ? [
                            "eslint",
                            "--fix",
                            ".",
                        ]
                        : [
                            env.commands.exec[1],
                            "eslint",
                            "--fix",
                            ".",
                        ],
                    verbose,
                );

                if (!output.success) HandleError("Unknown__CleanerTask__Lint", output.stdout);

                return true;
            } else {
                const output = await Commander(
                    env.commands.run[0],
                    [env.commands.run[1], script],
                    verbose,
                );

                if (!output.success) HandleError("Unknown__CleanerTask__Lint", output.stdout);

                return true;
            }
        } else if (StringUtils.validateAgainst(env.runtime, ["deno", "rust"])) {
            await LogStuff(
                `Linting is unsupported for ${StringUtils.toUpperCaseFirst(env.runtime)}. Skipping task...", "warn", "bright-yellow`,
            );
            // TODO - funnily enough, our repository itself has a gluefix for this (iterates thru all code files running the check command individually)
            // both Deno and cargo use <rt> check <file> cmd, so we should do that later on
            return false;
        } else {
            const output = await Commander(
                "go",
                ["vet", "./..."],
                verbose,
            );

            if (!output.success) HandleError("Unknown__CleanerTask__Lint", output.stdout);

            return true;
        }
    },
    Pretty: async (params: InteropedFeatureParams): Promise<boolean> => {
        const { env, verbose } = params;
        const script = env.settings.prettyCmd;

        if (StringUtils.validateAgainst(env.runtime, ["bun", "node"])) {
            if (isDef(script)) {
                if (FkNodeInterop.PackageFileUtils.SpotDependency("prettier", env.main.cpfContent.deps) === undefined) {
                    await LogStuff(
                        "No prettifier was given (via fknode.yaml > prettyCmd), hence defaulted to Prettier - but Prettier is not installed!",
                        "bruh",
                    );
                    return false;
                }

                const output = await Commander(
                    env.commands.exec[0],
                    env.commands.exec.length === 1
                        ? [
                            "prettier",
                            "--w",
                            ".",
                        ]
                        : [
                            env.commands.exec[1],
                            "prettier",
                            "--w",
                            ".",
                        ],
                    verbose,
                );

                if (!output.success) HandleError("Unknown__CleanerTask__Pretty", output.stdout);

                return true;
            } else {
                const output = await Commander(
                    env.commands.run[0],
                    [env.commands.run[1], script],
                    verbose,
                );

                if (!output.success) HandleError("Unknown__CleanerTask__Pretty", output.stdout);

                return true;
            }
        } else {
            // customization unsupported for all of these
            // deno fmt settings should work from deno.json, tho
            const output = await Commander(
                env.commands.base,
                env.runtime === "deno" ? ["fmt"] : ["fmt", "./..."],
                verbose,
            );

            if (!output.success) HandleError("Unknown__CleanerTask__Pretty", output.stdout);

            return true;
        }
    },
    Update: async (params: InteropedFeatureParams): Promise<boolean> => {
        const { env, verbose } = params;
        const script = env.settings.updateCmdOverride;

        if (isDef(script)) {
            const output = await Commander(
                env.commands.base,
                env.commands.update,
                verbose,
            );

            if (!output.success) HandleError("Unknown__CleanerTask__Update", output.stdout);

            return true;
        }

        if (StringUtils.validateAgainst(env.runtime, ["rust", "golang"])) {
            throw new FknError(
                "Interop__CannotRunJsLike",
                `${env.manager} does not support JavaScript-like "run" commands, however you've set updateCmdOverride in your fknode.yaml to ${script}. Since we don't know what you're doing, update task wont proceed for this project.`,
            );
        } else {
            const output = await Commander(
                env.commands.run[0],
                [env.commands.run[1], script],
                verbose,
            );

            if (!output.success) HandleError("Unknown__CleanerTask__Update", output.stdout);

            return true;
        }
    },
    Launch: async (params: InteropedFeatureParams): Promise<boolean> => {
        const { env, verbose } = params;
        const script = env.settings.launchCmd;

        if (isDef(script)) {
            if (StringUtils.validateAgainst(env.manager, ["go", "deno", "cargo"]) && !env.settings.launchFile) {
                throw new FknError(
                    "Unknown__CleanerTask__Launch",
                    `You tried to launch project ${await NameProject(
                        env.root,
                        "name",
                    )} without specifying a launchFile in your fknode.yaml. ${env.runtime} requires to specify what file to run.`,
                );
            }

            const output = await Commander(
                env.commands.base,
                StringUtils.validateAgainst(env.manager, ["go", "deno", "cargo"])
                    ? [env.commands.start, env.settings.launchFile]
                    : [env.commands.start],
                verbose,
            );

            if (!output.success) HandleError("Unknown__CleanerTask__Launch", output.stdout);

            return true;
        }

        const output = await Commander(
            env.commands.run[0],
            [env.commands.run[1], script],
            verbose,
        );

        if (!output.success) HandleError("Unknown__CleanerTask__Launch", output.stdout);

        return true;
    },
};
