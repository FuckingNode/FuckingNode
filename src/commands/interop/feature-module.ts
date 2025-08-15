import { validateAgainst } from "@zakahacecosas/string-utils";
import { Commander } from "../../functions/cli.ts";
import { LogStuff, Notification } from "../../functions/io.ts";
import type { ProjectEnvironment } from "../../types/platform.ts";
import { DebugFknErr, FknError } from "../../functions/error.ts";
import { FkNodeInterop } from "./interop.ts";
import { isDef, isDis } from "../../constants.ts";
import { NameProject } from "../../functions/projects.ts";
import { GetAppPath } from "../../functions/config.ts";

function HandleError(
    err:
        | "Task__Update"
        | "Task__Lint"
        | "Task__Pretty"
        | "Task__Launch",
    stdout: string,
): never {
    Notification(
        `An error happened with ${err.split("__")[1]!.toLowerCase()} task!`,
        `The error log was dumped to ${GetAppPath("ERRORS")}.`,
        300000,
    );
    DebugFknErr(
        err,
        "Something went wrong and we don't know what",
        stdout,
    );
}

/**
 * Cross-runtime compatible tasks. Supports linting, prettifying, and updating dependencies.
 */
export const InteropedFeatures = {
    Lint: (env: ProjectEnvironment): boolean => {
        const script = env.settings.lintCmd;

        if (validateAgainst(env.runtime, ["bun", "node"])) {
            if (isDef(script)) {
                if (FkNodeInterop.PackageFileUtils.SpotDependency("eslint", env.main.cpfContent.deps) === undefined) {
                    LogStuff(
                        "No linter was given (via fknode.yaml > lintCmd), hence defaulted to ESLint - but ESLint is not installed!",
                        "bruh",
                    );
                    return false;
                }

                const output = Commander(
                    env.commands.exec[0],
                    [
                        env.commands.exec[1],
                        "eslint",
                        "--fix",
                        ".",
                    ],
                );

                if (!output.success) HandleError("Task__Lint", output.stdout);

                return true;
            } else {
                const output = Commander(
                    env.commands.run[0],
                    [env.commands.run[1], script],
                );

                if (!output.success) HandleError("Task__Lint", output.stdout);

                return true;
            }
        } else if (env.runtime === "rust") {
            const output = Commander(
                "cargo",
                ["check", "--all-targets", "--workspace"],
            );

            if (!output.success) HandleError("Task__Lint", output.stdout);

            return false;
        } else if (env.runtime === "deno") {
            const output = Commander(
                env.commands.run[0],
                ["check", "."],
            );

            if (!output.success) HandleError("Task__Lint", output.stdout);

            return true;
        } else {
            const output = Commander(
                "go",
                ["vet", "./..."],
            );

            if (!output.success) HandleError("Task__Lint", output.stdout);

            return true;
        }
    },
    Pretty: (env: ProjectEnvironment): boolean => {
        const script = env.settings.prettyCmd;

        if (validateAgainst(env.runtime, ["bun", "node"])) {
            if (isDef(script)) {
                if (FkNodeInterop.PackageFileUtils.SpotDependency("prettier", env.main.cpfContent.deps) === undefined) {
                    LogStuff(
                        "No prettifier was given (via fknode.yaml > prettyCmd), hence defaulted to Prettier - but Prettier is not installed!",
                        "bruh",
                    );
                    return false;
                }

                const output = Commander(
                    env.commands.exec[0],
                    [
                        env.commands.exec[1],
                        "prettier",
                        "--w",
                        ".",
                    ],
                );

                if (!output.success) HandleError("Task__Pretty", output.stdout);

                return true;
            } else {
                const output = Commander(
                    env.commands.run[0],
                    [env.commands.run[1], script],
                );

                if (!output.success) HandleError("Task__Pretty", output.stdout);

                return true;
            }
        } else {
            // customization unsupported for all of these
            // deno fmt settings should work from deno.json, tho
            const output = Commander(
                env.commands.base,
                env.runtime === "deno" ? ["fmt"] : ["fmt", "./..."],
            );

            if (!output.success) HandleError("Task__Pretty", output.stdout);

            return true;
        }
    },
    Update: (env: ProjectEnvironment): boolean => {
        const script = env.settings.updateCmdOverride;

        if (isDef(script)) {
            const output = Commander(
                env.commands.base,
                env.commands.update,
            );

            if (!output.success) HandleError("Task__Update", output.stdout);

            return true;
        }

        if (validateAgainst(env.runtime, ["rust", "golang"])) {
            throw new FknError(
                "Interop__JSRunUnable",
                `${env.manager} does not support JavaScript-like "run" commands, however you've set updateCmdOverride in your fknode.yaml to ${script}. Since we don't know what you're doing, update task wont proceed for this project.`,
            );
        } else {
            const output = Commander(
                env.commands.run[0],
                [env.commands.run[1], script],
            );

            if (!output.success) HandleError("Task__Update", output.stdout);

            return true;
        }
    },
    Launch: (env: ProjectEnvironment): boolean => {
        const script = env.settings.launchCmd;

        if (isDis(script)) return true;

        if (isDef(script)) {
            if (validateAgainst(env.manager, ["go", "deno", "cargo"]) && !env.settings.launchFile) {
                throw new FknError(
                    "Task__Launch",
                    `You tried to launch project ${
                        NameProject(
                            env.root,
                            "name",
                        )
                    } without specifying a launchFile in your fknode.yaml. ${env.runtime} requires to specify what file to run.`,
                );
            }

            const output = Commander(
                env.commands.base,
                validateAgainst(env.manager, ["go", "deno", "cargo"]) ? [env.commands.start, env.settings.launchFile] : [env.commands.start],
            );

            if (!output.success) HandleError("Task__Launch", output.stdout);

            return true;
        }

        const output = Commander(
            env.commands.run[0],
            [env.commands.run[1], script],
        );

        if (!output.success) HandleError("Task__Launch", output.stdout);

        return true;
    },
};
