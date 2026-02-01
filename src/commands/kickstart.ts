import { Commander, ManagerExists } from "../functions/cli.ts";
import { CheckForDir, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { Interrogate, LogStuff, Notification } from "../functions/io.ts";
import { AddProject, ConservativelyGetProjectEnvironment } from "../functions/projects.ts";
import type { TheKickstarterConstructedParams } from "./_interfaces.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { NameLockfile, ResolveLockfiles } from "./toolkit/cleaner.ts";
import type { MANAGER_GLOBAL, ProjectEnvironment } from "../types/platform.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import { FknError } from "../functions/error.ts";
import { GetUserSettings } from "../functions/config.ts";
import { GenerateGitUrl } from "./toolkit/git-url.ts";
import { Clone } from "../functions/git.ts";
import { type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { GetElapsedTime } from "../functions/date.ts";
import { bold, brightGreen, italic, red } from "@std/fmt/colors";
import type { CF_FKNODE_SETTINGS, FullFkNodeYaml } from "../types/config_files.ts";
import { GetProjectSettings } from "../functions/projects.ts";
import { orange } from "../functions/color.ts";
import { HumanizeCmd, RunCmdSet } from "../functions/cmd-set.ts";

async function InstallDependencies(
    manager: UnknownString,
    userSettings: CF_FKNODE_SETTINGS,
    policies: FullFkNodeYaml["kickstarter"],
): Promise<ProjectEnvironment> {
    const lockfiles = ResolveLockfiles(Deno.cwd());
    const isRequest = validate(manager) && manager.startsWith("use ");

    if (lockfiles.length === 0 && !isRequest) {
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
            Deno.exit(1);
        }
    }

    let env;

    if (policies.workspaces === "standalone" || policies.workspaces === "unified") {
        Notification(
            "Heads up!",
            "Intervention is needed for your kickstart to continue.",
        );
        LogStuff(
            `This project specifically wants you to ${
                bold(policies.workspaces === "standalone" ? "add all workspaces individually" : "ignore workspaces when adding the project")
            }. Do you want to obey?`,
        );
        const proceed = Interrogate(
            "Hit 'Y' to use it, or 'N' to ignore the request and use default settings.",
            "ask",
        );
        env = await AddProject(Deno.cwd(), false, proceed ? policies.workspaces : null);
    } else if (policies.workspaces === "force-liberty") {
        Notification(
            "Watch out",
            "Intervention may be needed for your kickstart to continue.",
        );
        LogStuff(
            "By the way, this project wants you to explicitly handle workspace addition, regardless of defaults.\nIntervention might be needed.",
        );
        env = await AddProject(Deno.cwd(), false, policies.workspaces);
    } else {
        env = await AddProject(Deno.cwd());
    }

    // if there's no env the error should've already been reported
    if (env === "aborted" || env === "error") Deno.exit(1);
    if (env === "glob" || env === "rootless") {
        LogStuff(
            "Hold up, this project is a (probably rootless) monorepo. Kickstart can't handle it well.\nThe project cloned successfully, but dependencies weren't installed.",
        );
        Deno.exit(1);
    }

    if (isRequest) {
        const arr = manager.split(" ").slice(1);
        const managerName = arr.join(" ");
        if (validateAgainst(managerName, ["npm", "pnpm", "yarn", "deno", "bun"])) {
            FkNodeInterop.Installers.UniJs(Deno.cwd(), managerName);
        } else if (managerName === "go") {
            FkNodeInterop.Installers.Golang(Deno.cwd());
        } else if (managerName === "cargo") {
            FkNodeInterop.Installers.Cargo(Deno.cwd());
        } else {
            Commander(arr[0]!, arr.slice(1));
        }
    }

    const initialManager = validateAgainst(manager, ["npm", "pnpm", "yarn", "deno", "bun", "go", "cargo"]) ? manager : env.manager;

    const managerToUse: MANAGER_GLOBAL = ManagerExists(initialManager)
        ? initialManager
        : ManagerExists(env.manager)
        ? env.manager
        : userSettings["default-manager"];

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
        `Great! ${env.names.nameVer} finished dependency install and is ready to work with.`,
        "tick",
    );

    return env;
}

export default async function TheKickstarter(params: TheKickstarterConstructedParams): Promise<void> {
    const { gitUrl, path, manager } = params;
    const startup = new Date();
    const { full: repoUrl, name: projectName } = GenerateGitUrl(gitUrl);

    const userSettings = GetUserSettings();
    const root = userSettings["kickstart-root"] ?? Deno.cwd();
    const clonePath: string = ParsePath(validate(path) && !validateAgainst(path, ["-", "--"]) ? path : JoinPaths(root, projectName));

    const clonePathValidator = CheckForDir(clonePath);
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

    LogStuff(bold(brightGreen("Let's kickstart! Wait a moment please...")), "tick");
    LogStuff(`Cloning repo from ${bold(repoUrl)} into ${bold(clonePath)}`, "working");

    Clone(repoUrl, clonePath);

    LogStuff("Cloned it!", "tick");

    Deno.chdir(clonePath);

    const settings = GetProjectSettings(clonePath);

    let env;

    if (!settings.kickstarter.install) {
        env = await InstallDependencies(manager, userSettings, settings.kickstarter);
    } else if (settings.kickstarter.install.startsWith("use ")) {
        Notification(
            "Heads up!",
            "Intervention is needed for your kickstart to continue.",
        );
        LogStuff(
            `This project specifically wants you to use the '${
                bold(settings.kickstarter.install.split(" ").slice(1).join(" "))
            }' installation command. Shall we?`,
            "warn",
        );
        const proceed = Interrogate(
            `Hit 'Y' to use it, or 'N' to ignore the request.\n${
                bold(orange(
                    "If the package manager is not installed or if you ignore the request, we won't continue the kickstart, risking some time loss on your side. This isn't critical because the repository is already cloned, but it's worth noting.",
                ))
            }`,
            "ask",
        );
        if (!proceed) {
            LogStuff("Request ignored. Exited.", "bruh");
            return;
        }
        env = await InstallDependencies(settings.kickstarter.install, userSettings, settings.kickstarter);
    } else {
        LogStuff(
            bold(
                "This project specifically wants no dependency installation to happen, therefore it has been skipped.\nYou can manually install dependencies at any time.\n",
            ),
        );
        env = await ConservativelyGetProjectEnvironment(clonePath);
    }

    const elapsed = Date.now() - startup.getTime();
    Notification(
        settings.kickstartCmd ? "Almost there!" : "Kickstart successful!",
        settings.kickstartCmd
            ? `After ${GetElapsedTime(startup)}, there's one last step before having your project ready.`
            : `Your project is ready. It took ${GetElapsedTime(startup)}. Go write some fucking good code!`,
        elapsed,
    );

    if (!settings.kickstartCmd) {
        // launch IDE after notification so he gets notified yes or yes
        // and comes up to the IDE opening
        // (or, if unlucky, to whatever error stopping it from launching)
        LaunchUserIDE();
        Deno.exit(0);
    }

    LogStuff(
        `${red(bold("This repository wants a CmdSet to run."))} Think of it as a post-install script.\nThe sequence is as follows:\n\n${
            bold(HumanizeCmd(settings.kickstartCmd))
        }\n${
            bold(orange(
                "Kickstart CmdSets can be a useful way to save time, but they also imply risks. Unless on a trusted repository, make sure to carefully review it.\nDo not run stuff you do not understand.",
            ))
        }`,
        "warn",
    );
    const proceed = Interrogate(
        "Hit 'Y' to allow this CmdSet to run, or 'N' not to do so. "
            + italic("We'll launch your IDE with the project regardless of what you choose."),
    );
    if (!proceed) {
        LogStuff(
            "Okay, won't run it. The rest is already setup, so we'll launch your IDE now. Go write some fucking good code!",
            "tick",
        );
        LaunchUserIDE();
        Deno.exit(0);
    }
    await RunCmdSet({
        key: "kickstartCmd",
        env,
    });
    LogStuff("All setup. Go write some fucking good code!", "tick");
    LaunchUserIDE();
    Deno.exit(0);
}
