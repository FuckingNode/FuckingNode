import { CommandExists } from "../functions/cli.ts";
import { CheckForDir, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { AddProject, GetProjectEnvironment, NameProject } from "../functions/projects.ts";
import type { TheKickstarterConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { NameLockfile, ResolveLockfiles } from "./toolkit/cleaner.ts";
import type { MANAGER_GLOBAL } from "../types/platform.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import { FknError } from "../functions/error.ts";
import { GetUserSettings } from "../functions/config.ts";
import { GenerateGitUrl } from "./toolkit/git-url.ts";
import { Git } from "../functions/git.ts";
import { validate, validateAgainst } from "@zakahacecosas/string-utils";

export default function TheKickstarter(params: TheKickstarterConstructedParams) {
    const { gitUrl, path, manager } = params;

    const { full: repoUrl, name: projectName } = GenerateGitUrl(gitUrl);

    const cwd = Deno.cwd();
    const clonePath: string = ParsePath(validate(path) ? path : JoinPaths(cwd, projectName));

    const clonePathValidator = CheckForDir(clonePath);
    if (clonePathValidator === "ValidButNotEmpty") throw new Error(`${clonePath} is not empty! Choose somewhere else to clone this.`);

    if (clonePathValidator === "NotDir") throw new Error(`${path} is not a directory...`);

    LogStuff("Let's begin! Wait a moment please...", "tick-clear", ["bright-green", "bold"]);
    LogStuff(`Cloning from ${repoUrl}`);

    const gitOutput = Git.Clone(repoUrl, clonePath);
    if (!gitOutput) Deno.exit(1);

    Deno.chdir(clonePath);

    const lockfiles = ResolveLockfiles(Deno.cwd());

    if (lockfiles.length === 0) {
        if (validateAgainst(manager, ["npm", "pnpm", "yarn", "bun", "deno", "cargo", "go"])) {
            LogStuff(`This project lacks a lockfile. We'll generate it right away!`, "warn");
            Deno.writeTextFileSync(
                JoinPaths(Deno.cwd(), NameLockfile(manager)),
                "",
            ); // fix Internal__CantDetermineEnv by adding a fake lockfile
            // the pkg manager SHOULD BE smart enough to ignore and overwrite it
            // tested with pnpm and it works, i'll assume it works everywhere
        } else {
            LogStuff(
                `${
                    ColorString("This project lacks a lockfile and we can't set it up.", "bold")
                }\nIf the project lacks a lockfile and you don't specify a package manager to use (kickstart 3RD argument), we simply can't tell what to use to install dependencies. Sorry!\n${
                    ColorString(
                        `PS. Git DID clone the project at ${Deno.cwd()}. Just run there the install command you'd like!`,
                        "italic",
                    )
                }`,
                "warn",
            );
            return;
        }
    }

    AddProject(Deno.cwd());

    // assume we skipped error
    const env = GetProjectEnvironment(Deno.cwd());

    const initialManager = validateAgainst(manager, ["npm", "pnpm", "yarn", "deno", "bun"]) ? manager : env.manager;

    const managerToUse: MANAGER_GLOBAL = CommandExists(initialManager)
        ? initialManager
        : CommandExists(env.manager)
        ? env.manager
        : GetUserSettings().defaultManager;

    if (!managerToUse) {
        throw new FknError(
            "Generic__MissingRuntime",
            validate(manager)
                ? `Neither your specified package manager (${manager}) nor the repo's manager (${env.manager}) is installed on this system. What the heck?`
                : `This repo uses ${env.manager} as a package manager, but it isn't installed locally.`,
        );
    }

    LogStuff(
        `Installation began using ${ColorString(managerToUse, "bold")}. Have a coffee meanwhile!`,
        "tick-clear",
    );

    if (managerToUse === "go") {
        FkNodeInterop.Installers.Golang(Deno.cwd());
    } else if (managerToUse === "cargo") {
        FkNodeInterop.Installers.Cargo(Deno.cwd());
    } else {
        FkNodeInterop.Installers.UniJs(Deno.cwd(), managerToUse);
    }

    LogStuff(`Great! ${NameProject(Deno.cwd(), "name-ver")} is now setup. Enjoy!`, "tick-clear");

    LaunchUserIDE();

    Deno.chdir(cwd);
}
