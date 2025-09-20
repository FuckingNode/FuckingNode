import { format, parse } from "@std/semver";
import { Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import type { TheReleaserConstructedParams } from "./_interfaces.ts";
import type { CargoPkgFile } from "../types/platform.ts";
import { Commander } from "../functions/cli.ts";
import { AddToGitIgnore, Commit, IsRepo, Push, Tag } from "../functions/git.ts";
import { validate } from "@zakahacecosas/string-utils";
import { FknError } from "../functions/error.ts";
import { stringify as stringifyToml } from "@std/toml/stringify";
import { GetTextIndentSize } from "../functions/filesystem.ts";
import { ColorString } from "../functions/color.ts";
import { RunCmdSet, ValidateCmdSet } from "../functions/cmd-set.ts";

export default async function TheReleaser(params: TheReleaserConstructedParams): Promise<void> {
    if (!validate(params.version)) throw new FknError("Param__VerInvalid", "No version specified!");

    // validate version
    try {
        parse(params.version);
    } catch {
        throw new FknError(
            "Param__VerInvalid",
            `Invalid version: ${params.version}. Please use a valid SemVer version.`,
        );
    }

    const parsedVersion = parse(params.version);
    const env = await GetProjectEnvironment(params.project);
    const canUseGit = IsRepo(env.root);

    Deno.chdir(env.root);

    if (!env.commands.publish) throw new FknError("Interop__PublishUnable", `Platform ${env.runtime} doesn't support publishing. Aborting.`);

    const releaseCmd = ValidateCmdSet({ env, key: "releaseCmd" });
    const buildCmd = ValidateCmdSet({ env, key: "buildCmd" });

    const actions: string[] = [
        `${ColorString(`Update your ${ColorString(env.mainName, "bold")}'s`, "white")} "version" field`,
        `Create a ${ColorString(`${env.mainName}.bak`, "bold")} file, and add it to .gitignore`,
    ];
    if (buildCmd && env.settings.buildForRelease) {
        actions.push(
            `Run your 'buildCmd' set (${buildCmd.length} cmds).`,
        );
    }
    if (releaseCmd) {
        actions.push(
            `Run your 'releaseCmd' set (${releaseCmd.length} cmds).`,
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
    if (params.push && !canUseGit) LogStuff("--push was specified, but you're not in a Git repo, so it'll be ignored.\n");
    if (!(params.dry === true || env.settings.releaseAlwaysDry === true)) {
        actions.push(
            ColorString(
                `Publish your changes to ${ColorString(env.runtime === "deno" ? "JSR" : env.runtime === "rust" ? "crates.is" : "npm", "bold")}`,
                "red",
            ),
        );
    }
    const confirmation = Interrogate(
        `Heads up! We're about to take the following actions:\n${actions.join("\n")}\n\n- all of this at ${env.names.full}`,
        "heads-up",
    );

    if (!confirmation) return;

    // write the updated pkg file
    Deno.copyFileSync(env.mainPath, `${env.mainPath}.bak`); // Backup original
    if (env.runtime === "rust") {
        const newPackageFile = {
            ...(env.mainSTD),
            package: {
                ...(env.mainSTD as CargoPkgFile).package,
                version: format(parsedVersion),
            },
        };
        Deno.writeTextFileSync(env.mainPath, stringifyToml(newPackageFile));
    } else {
        const newPackageFile = {
            ...env.mainSTD,
            version: format(parsedVersion),
        };
        const indent = GetTextIndentSize(Deno.readTextFileSync(env.mainPath));
        Deno.writeTextFileSync(env.mainPath, JSON.stringify(newPackageFile, undefined, indent));
    }

    // build
    if (env.settings.buildForRelease) {
        if (!buildCmd) LogStuff("You enabled buildForRelease, but no buildCmd was specified!", "warn", "bright-yellow");
        else RunCmdSet({ env, key: "buildCmd" });
    }

    // run their releaseCmd
    if (releaseCmd) {
        await RunCmdSet({
            key: "releaseCmd",
            env,
        });
    }

    if (params.dry === true || env.settings.releaseAlwaysDry === true) {
        LogStuff(
            "Aborted committing, publishing, and whatever else, because either the command you executed or this project's fknode.yaml instructed FuckingNode to make a \"dry-run\".\nYour 'releaseCmd' did execute.",
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
    );

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
            env.root,
            `${env.mainName}.bak`,
        );
        LogStuff(
            `Ignored ${env.mainName}.bak successfully`,
            "tick",
        );

        Commit(
            env.root,
            `Release v${format(parsedVersion)} (automated by FuckingNode)`,
            [env.mainPath],
            [],
        );

        Tag(
            env.root,
            format(parsedVersion),
            params.push,
        );

        if (params.push) Push(env.root, false);
    }

    // publish the package
    const publishOutput = Commander(env.commands.base, env.commands.publish);
    if (!publishOutput.success) throw new FknError("External__Publish", `Publish command failed: ${publishOutput.stdout}`);

    LogStuff(`That worked out! ${params.version} should be live now.`, "tick", ["bold", "bright-green"]);
    return;
}
