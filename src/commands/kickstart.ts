import { ManagerExists } from "../functions/cli.ts";
import { CheckForDir, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { AddProject } from "../functions/projects.ts";
import type { TheKickstarterConstructedParams } from "./_interfaces.ts";
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
import { bold, italic } from "@std/fmt/colors";

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

    LogStuff("Let's kickstart! Wait a moment please...", "tick-clear", ["bright-green", "bold"]);
    LogStuff(`Cloning repo from ${bold(repoUrl)}`, "working");

    Clone(repoUrl, clonePath);

    LogStuff("Cloned it!", "tick-clear");

    Deno.chdir(clonePath);

    const lockfiles = ResolveLockfiles(Deno.cwd());

    if (lockfiles.length === 0) {
        if (validateAgainst(manager, ["npm", "pnpm", "yarn", "bun", "deno", "cargo", "go"])) {
            LogStuff("This project lacks a lockfile. We'll generate an empty one, then let the package manager populate it.", "warn");
            Deno.writeTextFileSync(
                JoinPaths(Deno.cwd(), NameLockfile(manager)),
                "",
            ); // fix env determination error by adding a fake lockfile
            // the pkg manager SHOULD BE smart enough to ignore and overwrite it
            // tested with pnpm and it works, i'll assume it works everywhere
        } else {
            LogStuff(
                `${
                    bold("This project lacks a lockfile and we can't set it up.")
                }\nIf the project lacks a lockfile and you don't specify a package manager to use (kickstart 3rd argument), we simply can't tell what to use to install dependencies. Sorry!\n${
                    italic(
                        `PS. Git DID clone the project at ${Deno.cwd()}. Just run there the install command you'd like!`,
                    )
                }`,
                "warn",
            );
            return;
        }
    }

    const env = await AddProject(Deno.cwd());

    // if there's no env the error should've already been reported
    if (env === "aborted" || env === "error") return;
    if (env === "glob" || env === "rootless") {
        LogStuff(
            "Hold up, this project is a (probably rootless) monorepo. Kickstart can't handle it well.\nThe project cloned successfully, but dependencies weren't installed.",
        );
        return;
    }

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
        `Installation began using ${bold(managerToUse)} ${
            ManagerExists(initialManager)
                ? "(default)"
                : ManagerExists(env.manager)
                ? "(fallback, project's default)."
                : "(fallback, settings default)"
        }. Have a coffee meanwhile!`,
        "working",
    );

    if (managerToUse === "go") FkNodeInterop.Installers.Golang(Deno.cwd());
    else if (managerToUse === "cargo") FkNodeInterop.Installers.Cargo(Deno.cwd());
    else FkNodeInterop.Installers.UniJs(Deno.cwd(), managerToUse);

    LogStuff(
        `Great! ${env.names.nameVer} is now setup and ready for use. Your IDE will now launch.\nGo write some fucking good code!`,
        "tick-clear",
    );

    LaunchUserIDE();

    const elapsed = Date.now() - startup.getTime();
    Notification(
        "Kickstart successful!",
        `Your project is ready. It took ${GetElapsedTime(startup)}. Go write some fucking good code!`,
        elapsed,
    );

    return;
}
