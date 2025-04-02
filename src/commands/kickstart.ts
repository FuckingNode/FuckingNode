import { Commander, CommandExists } from "../functions/cli.ts";
import { GetAppPath } from "../functions/config.ts";
import { CheckForDir, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject } from "../functions/projects.ts";
import type { TheKickstarterConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { StringUtils } from "@zakahacecosas/string-utils";
import { NameLockfile, ResolveLockfiles } from "./toolkit/cleaner.ts";
import type { MANAGER_GLOBAL } from "../types/platform.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import { FknError } from "../functions/error.ts";

export default async function TheKickstarter(params: TheKickstarterConstructedParams) {
    const { gitUrl, path, manager } = params;

    if (!StringUtils.validate(gitUrl)) throw new Error("Git URL is required!");

    const gitUrlRegex = /^(https?:\/\/.*?\/)([^\/]+)(?:\.git)?$/;
    const regexMatch = gitUrl.match(gitUrlRegex);
    if (!regexMatch || !regexMatch[2]) throw new Error(`${gitUrl} is not a valid Git URL!`);
    const userForgotDotGit = gitUrl.endsWith(regexMatch[2]) && regexMatch[2].split(".").length === 1;

    if (userForgotDotGit) {
        await LogStuff(
            "Psst... You forgot '.git' at the end. No worries, we can still read it.",
            "bruh",
            "italic",
        );
    }

    const workingGitUrl = userForgotDotGit ? gitUrl + ".git" : gitUrl;

    const strictGitUrlRegex = /^(https?:\/\/.*?\/)([^\/]+)\.git$/;

    if (!strictGitUrlRegex.test(workingGitUrl)) throw new Error(`${gitUrl} is not a valid Git URL!`);

    const projectName = regexMatch[2];
    if (!projectName) throw new Error(`RegEx Error: Can't spot the project name in ${workingGitUrl}`);

    const cwd = Deno.cwd();
    const clonePath: string = ParsePath(StringUtils.validate(path) ? path : JoinPaths(cwd, projectName));

    const clonePathValidator = await CheckForDir(clonePath);
    if (clonePathValidator === "ValidButNotEmpty") {
        throw new Error(`${clonePath} is not empty! Stuff may break if we kickstart to this path, so choose another one!`);
    }
    if (clonePathValidator === "NotDir") {
        throw new Error(`${path} is not a directory...`);
    }

    await LogStuff("Let's begin! Wait a moment please...", "tick-clear", ["bright-green", "bold"]);
    await LogStuff(`Cloning from ${workingGitUrl}`);

    const gitOutput = await Commander("git", ["clone", workingGitUrl, clonePath], true);
    if (!gitOutput.success) throw new Error(`Error cloning repository: ${gitOutput.stdout}`);

    Deno.chdir(clonePath);

    const lockfiles = ResolveLockfiles(Deno.cwd());

    if (lockfiles.length === 0) {
        if (StringUtils.validateAgainst(manager, ["npm", "pnpm", "yarn", "bun", "deno", "cargo", "go"])) {
            await LogStuff(`This project lacks a lockfile. We'll generate it right away!`, "warn");
            await Deno.writeTextFile(
                JoinPaths(Deno.cwd(), NameLockfile(manager)),
                "",
            ); // fix Internal__CantDetermineEnv by adding a fake lockfile
            // the pkg manager SHOULD BE smart enough to ignore and overwrite it
            // tested with pnpm and it works, i'll assume it works everywhere
        } else {
            await LogStuff(
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

    // glue fix
    // TODO - use AddProject() (implies, probably, making it sync)
    Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), `${ParsePath(Deno.cwd())}\n`, {
        append: true,
    });

    // assume we skipped error
    const env = await GetProjectEnvironment(Deno.cwd());

    const initialManager = StringUtils.validateAgainst(manager, ["npm", "pnpm", "yarn", "deno", "bun"]) ? manager : env.manager;
    // if pnpm exists, prefer that over npm for fallback
    // TODO: make this into a user setting
    const fallbackNodeManager: "pnpm" | "npm" | null = CommandExists("pnpm") ? "pnpm" : CommandExists("npm") ? "npm" : null;

    const managerToUse: MANAGER_GLOBAL | null = CommandExists(initialManager)
        ? initialManager
        : CommandExists(env.manager)
        ? env.manager
        : fallbackNodeManager;

    if (!managerToUse) {
        throw new FknError(
            "Generic__MissingRuntime",
            StringUtils.validate(manager)
                ? `Neither your specified manager (${manager}) nor the repo's runtime (${env.manager}) are installed on this system. What the heck?`
                : `This repo uses ${env.manager} as a package manager, but it isn't installed locally.`,
        );
    }

    await LogStuff(
        `Installation began using ${ColorString(managerToUse, "bold")}. Have a coffee meanwhile!`,
        "tick-clear",
    );

    if (managerToUse === "go") {
        await FkNodeInterop.Installers.Golang(Deno.cwd());
    } else if (managerToUse === "cargo") {
        await FkNodeInterop.Installers.Cargo(Deno.cwd());
    } else if (
        StringUtils.validateAgainst(managerToUse, ["bun", "deno", "npm", "pnpm", "yarn"])
    ) {
        await FkNodeInterop.Installers.UniJs(Deno.cwd(), managerToUse);
    }

    await LaunchUserIDE();

    await LogStuff(`Great! ${await NameProject(Deno.cwd(), "name-ver")} is now setup. Enjoy!`, "tick-clear");

    Deno.chdir(cwd);
}
