import { ManagerExists } from "../functions/cli.ts";
import { CheckForDir, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { AddProject, GetProjectEnvironment } from "../functions/projects.ts";
import type { TheKickstarterConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { NameLockfile, ResolveLockfiles } from "./toolkit/cleaner.ts";
import type { MANAGER_GLOBAL } from "../types/platform.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import { FknError } from "../functions/error.ts";
import { GetUserSettings } from "../functions/config.ts";
import { GenerateGitUrl } from "./toolkit/git-url.ts";
import { Clone } from "../functions/git.ts";
import { validate, validateAgainst } from "@zakahacecosas/string-utils";
import { GetElapsedTime } from "../functions/date.ts";
import { ColorString } from "../functions/color.ts";

export default async function TheKickstarter(params: TheKickstarterConstructedParams): Promise<void> {
    const { gitUrl, path, manager } = params;
    const startup = new Date();
    const { full: repoUrl, name: projectName } = GenerateGitUrl(gitUrl);

    const clonePath: string = ParsePath(validate(path) ? path : JoinPaths(Deno.cwd(), projectName));

    const clonePathValidator = await CheckForDir(clonePath);
    if (clonePathValidator === "ValidButNotEmpty") {
        throw new FknError(
            "Fs__DemandsEmptying",
            `${clonePath} is not empty! Choose somewhere else to clone this.`,
        );
    }

    if (clonePathValidator === "NotDir") {
        throw new FknError(
            "Fs__DemandsDIR",
            `${clonePath} is not a directory...`,
        );
    }

    LogStuff("Let's begin! Wait a moment please...", "tick-clear", ["bright-green", "bold"]);
    LogStuff(`Cloning from ${repoUrl}`);

    Clone(repoUrl, clonePath);

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

    await AddProject(Deno.cwd());

    // assume we skipped error
    const env = await GetProjectEnvironment(Deno.cwd());

    const initialManager = validateAgainst(manager, ["npm", "pnpm", "yarn", "deno", "bun"]) ? manager : env.manager;

    const managerToUse: MANAGER_GLOBAL = ManagerExists(initialManager)
        ? initialManager
        : ManagerExists(env.manager)
        ? env.manager
        : (GetUserSettings())["default-manager"];

    if (!managerToUse) {
        throw new FknError(
            "Env__MissingMotor",
            validate(manager)
                ? `Neither your specified package manager (${manager}) nor the repo's manager (${env.manager}) is installed on this system. What the heck?`
                : `This repo uses ${env.manager} as a package manager, but it isn't installed locally.`,
        );
    }

    LogStuff(
        `Installation began using ${ColorString(managerToUse, "bold")}. Have a coffee meanwhile!`,
        "tick-clear",
    );

    if (managerToUse === "go") FkNodeInterop.Installers.Golang(Deno.cwd());
    else if (managerToUse === "cargo") FkNodeInterop.Installers.Cargo(Deno.cwd());
    else FkNodeInterop.Installers.UniJs(Deno.cwd(), managerToUse);

    LogStuff(`Great! ${env.names.nameVer} is now setup. Enjoy!`, "tick-clear");

    LaunchUserIDE();

    const elapsed = Date.now() - startup.getTime();
    Notification(
        `Kickstart successful!`,
        `Your project is ready. It took ${GetElapsedTime(startup)}. Go write some fucking good code!`,
        elapsed,
    );

    return;
}
