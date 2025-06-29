import { format, parse } from "@std/semver";
import { ColorString, Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheReleaserConstructedParams } from "./constructors/command.ts";
import type { CargoPkgFile } from "../types/platform.ts";
import { Commander } from "../functions/cli.ts";
import { AddToGitIgnore, Commit, IsRepo, Push, Tag } from "../functions/git.ts";
import { RunUserCmd, ValidateUserCmd } from "../functions/user.ts";
import { validate } from "@zakahacecosas/string-utils";
import { APP_NAME, isDis } from "../constants.ts";
import { FknError } from "../functions/error.ts";
import { stringify as stringifyToml } from "@std/toml/stringify";
import { GetTextIndentSize } from "../functions/filesystem.ts";

export default function TheReleaser(params: TheReleaserConstructedParams) {
    if (!validate(params.version)) {
        throw new Error("No version specified!");
    }

    // validate version
    try {
        parse(params.version);
    } catch {
        LogStuff(`Invalid version: ${params.version}. Please use a valid SemVer version.`, "error", "red");
        return;
    }

    const parsedVersion = parse(params.version);
    const project = (params.project || "").startsWith("--") ? Deno.cwd() : SpotProject(params.project);
    const CWD = Deno.cwd();
    const env = GetProjectEnvironment(project);
    const canUseGit = IsRepo(project);

    Deno.chdir(env.root);

    if (env.commands.publish === "__UNSUPPORTED") {
        throw new Error(`Platform ${env.runtime} doesn't support publishing. Aborting.`);
    }

    const releaseCmd = ValidateUserCmd(env, "releaseCmd");

    const actions: string[] = [
        `${ColorString(`Update your ${ColorString(env.main.name, "bold")}'s`, "white")} "version" field`,
        `Create a ${ColorString(`${env.main.name}.bak`, "bold")} file, and add it to .gitignore`,
    ];

    if (!isDis(releaseCmd)) {
        if (env.runtime === "rust") {
            throw new FknError(
                "Release__Fail__ReleaseCmd",
                `Cargo does not support JS-like run, however your fknode.yaml file has the releaseCmd set to "${env.settings.releaseCmd}". To avoid unexpected behavior, we stopped execution. Please, remove the "releaseCmd" key from your config file.`,
            );
        }
        actions.push(
            `Run ${
                ColorString(
                    `${env.commands.run.join(" ")} ${releaseCmd}`,
                    "bold",
                )
            }`,
        );
    }
    if (canUseGit) {
        actions.push(
            `${ColorString(`Commit ${ColorString(params.version, "bold")} to Git`, "white")}`,
            `Create a Git tag ${ColorString(params.version, "bold")}`,
        );
        if (params.push) {
            actions.push(
                `Push one commit to GitHub ${
                    ColorString("adding ALL of your uncommitted content alongside our changes", "bold")
                }, and push the created tag too`,
            );
        }
    }
    if (params.push && !canUseGit) {
        LogStuff("--push was specified, but you're not in a Git repo, so it'll be ignored.\n");
    }
    if (!(params.dry === true || env.settings.releaseAlwaysDry === true)) {
        actions.push(
            ColorString(
                `Publish your changes to ${ColorString(env.runtime === "deno" ? "JSR" : env.runtime === "rust" ? "crates.is" : "npm", "bold")}`,
                "red",
            ),
        );
    }
    const confirmation = Interrogate(
        `Heads up! We're about to take the following actions:\n${actions.join("\n")}\n\n- all of this at ${
            NameProject(
                project,
                "all",
            )
        }`,
        "heads-up",
    );

    if (!confirmation) return;

    // write the updated pkg file
    try {
        Deno.copyFileSync(env.main.path, `${env.main.path}.bak`); // Backup original
        if (env.runtime === "rust") {
            const newPackageFile = {
                ...(env.main.stdContent),
                package: {
                    ...(env.main.stdContent as CargoPkgFile).package,
                    version: format(parsedVersion),
                },
            };
            Deno.writeTextFileSync(env.main.path, stringifyToml(newPackageFile));
        } else {
            const newPackageFile = {
                ...env.main.stdContent,
                version: format(parsedVersion),
            };
            const indent = GetTextIndentSize(Deno.readTextFileSync(env.main.path));
            Deno.writeTextFileSync(env.main.path, JSON.stringify(newPackageFile, undefined, indent));
        }
    } catch (e) {
        throw new Error(`Failed to write to '${env.main.path}' (intention was to update your version code): ${e}`);
    }

    // run their releaseCmd
    if (!isDis(releaseCmd)) {
        RunUserCmd({
            key: "releaseCmd",
            env,
        });
    }

    if (params.dry === true || env.settings.releaseAlwaysDry === true) {
        LogStuff(
            `Aborted committing, publishing, and whatever else, because either the command you executed or this project's fknode.yaml instructed ${APP_NAME.CASED} to make a "dry-run".\nYour 'releaseCmd' did execute.`,
            "warn",
            "bright-yellow",
        );
        return;
    }

    LogStuff(
        `\nFor safety, we'll first run ${env.manager}'s publish command with "--dry-run", and pause execution. Check that everything went alright, then come back to this terminal session and hit 'Y' so we continue with all tasks you assigned to us.\n(or hit 'N' if something's wrong).\n`,
        undefined,
        ["bright-yellow"],
    );

    Commander(
        env.commands.base,
        [
            ...env.commands.publish,
            "--dry-run",
        ],
        true,
    );
    console.log("");
    const finalConfirmation = Interrogate(
        "Dry-run complete. Check that everything is alright.\nOnce you did, hit 'Y' so we continue, or 'N' so we abort.",
        "ask",
    );

    if (!finalConfirmation) {
        LogStuff("Aborted successfully. Fix whatever's wrong and come back whenever you wish.", "tick");
        return;
    } else {
        LogStuff("Roger that.", "tick");
    }

    if (canUseGit) {
        // just in case
        AddToGitIgnore(
            project,
            `${env.main.name}.bak`,
        );

        Commit(
            project,
            `Release v${format(parsedVersion)} (automated by F*ckingNode)`,
            [env.main.path],
            [],
        );

        Tag(
            project,
            format(parsedVersion),
            params.push,
        );

        if (params.push) {
            // push stuff to git
            const pushOutput = Push(project, false);
            if (pushOutput === 1) {
                throw new Error(`Git push failed unexpectedly.`);
            }
        }
    }

    // publish the package
    const publishOutput = Commander(env.commands.base, env.commands.publish);
    if (!publishOutput.success) {
        throw new Error(`Publish command failed: ${publishOutput.stdout}`);
    }

    Deno.chdir(CWD);
    LogStuff(`That worked out! ${params.version} should be live now.`, "tick", ["bold", "bright-green"]);
    return;
}
