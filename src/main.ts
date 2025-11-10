// the things.
import TheCleaner from "./commands/clean.ts";
import TheLister from "./commands/list.ts";
import TheStatistics from "./commands/stats.ts";
import TheMigrator from "./commands/migrate.ts";
import TheHelper from "./commands/help.ts";
import TheUpdater from "./commands/updater.ts";
import TheSettings from "./commands/settings.ts";
import TheAbouter from "./commands/about.ts";
import TheKickstarter from "./commands/kickstart.ts";
import TheAuditer from "./commands/audit.ts";
import TheReleaser from "./commands/release.ts";
import TheExporter from "./commands/export.ts";
import TheCompater from "./commands/compat.ts";
import TheCommitter from "./commands/commit.ts";
import TheSurrenderer from "./commands/surrender.ts";
import TheSetuper from "./commands/setup.ts";
import TheLauncher from "./commands/launch.ts";
import TheBuilder from "./commands/build.ts";
import TheTerminator from "./commands/terminate.ts";
import TheUncommitter from "./commands/uncommit.ts";
// other things
import * as DenoJson from "../deno.json" with { type: "json" };
import { LogStuff } from "./functions/io.ts";
import { FreshSetup, GetUserSettings } from "./functions/config.ts";
import { DEBUG_LOG, ErrorHandler } from "./functions/error.ts";
import type { TheCleanerConstructedParams } from "./commands/_interfaces.ts";
import { RunScheduledTasks } from "./functions/schedules.ts";
import { normalize, testFlag, testFlags, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { CleanupProjects, GetAllProjects, ListManager } from "./functions/projects.ts";
import { LaunchWebsite } from "./functions/http.ts";
import { HINTS } from "./functions/phrases.ts";
import { LOCAL_PLATFORM } from "./platform.ts";
import { parse } from "@std/path";
import { ParseFIM } from "./functions/modules/instructions.ts";
import { RunFEM } from "./functions/modules/extensions.ts";
import { brightBlue, italic } from "@std/fmt/colors";
import { orange } from "./functions/color.ts";

async function init(): Promise<void> {
    await FreshSetup();
    await RunScheduledTasks();
    await CleanupProjects(GetAllProjects());
}

/** Normalized Deno.args */
const flags = Deno.args.map((arg) =>
    normalize(arg, {
        preserveCase: true,
        strict: false,
        removeCliColors: true,
    })
);

export const FKNODE_SHALL_WE_DEBUG = import.meta.main === false ? false : Deno.env.get("FKNODE_SHALL_WE_DEBUG") === "yeah";
DEBUG_LOG("Initialized FKNODE_SHALL_WE_DEBUG constant WITH ARGS", flags);

function hasFlag(flag: string, allowQuickFlag: boolean, firstOnly: boolean = false): boolean {
    if (firstOnly === true) return testFlag(flags[0] ?? "", flag, { allowQuickFlag, allowNonExactString: true });
    return testFlags(flags, flag, { allowQuickFlag, allowNonExactString: true });
}

function isNotFlag(arg: UnknownString): arg is string {
    if (!validate(arg)) return false;
    const str = normalize(arg, { preserveCase: true, strict: false, removeCliColors: true });
    return !str.startsWith("-") && !str.startsWith("--");
}

if (hasFlag("help", true)) {
    try {
        await init();
        TheHelper({ query: flags[1] });
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("version", true, true) && !flags[1]) {
    console.log(
        `FuckingNode v${DenoJson.default.version} built for ${Deno.build.target}\nDeno JavaScript runtime ${Deno.version.deno} | TypeScript ${Deno.version.typescript} | V8 Engine ${Deno.version.v8}\nRun 'fuckingnode about' for details.`,
    );
    Deno.exit(0);
}

async function main(): Promise<void> {
    // debug commands
    if (Deno.args[0] === "FKNDBG_PROC") {
        console.log(
            "PROC NAME",
            new TextDecoder().decode(
                LOCAL_PLATFORM.SYSTEM === "msft"
                    ? new Deno.Command("powershell", {
                        args: ["Get-Process", "-Id", Deno.pid.toString()],
                    }).outputSync().stdout
                    : new Deno.Command("ps", {
                        args: ["-p", Deno.pid.toString(), "-o", "comm="],
                    }).outputSync().stdout,
            ).trim(),
        );
        console.log(
            "PROC ID",
            Deno.pid,
            "PROC PARENT ID",
            Deno.ppid,
        );
        return;
    }
    if (Deno.args[0] === "FKNDBG_WHERE") {
        console.log("AT", Deno.cwd(), "\nFROM", Deno.execPath(), "\nCONCRETELY", import.meta.url, "\nMAIN?", import.meta.main);
        return;
    }
    if (Deno.args[0] === "FKNDBG_MEM") {
        const mem = Deno.memoryUsage();
        console.log("MEM USAGE:");
        for (const [k, v] of Object.entries(mem)) console.log(`${k.padEnd(10)}: ${(v / 1024 / 1024).toFixed(2)} MB`);
        return;
    }
    if (Deno.args[0] === "FKNDBG_WHO") {
        console.log("System info:", {
            ...Deno.build,
            hostname: Deno.hostname(),
        });
        return;
    }
    if (Deno.args[0] === "FKNDBG_ROOT") {
        console.log(parse(Deno.execPath()).dir);
        return;
    }

    if (!validate(flags[0])) {
        TheHelper({});
        return;
    }

    // THIS IS A MESS BUT I GOT IT TO WORK, I BELIEVE
    const i = () => flags.findIndex((f) => f.startsWith("-") && f !== "--projects");
    const projectArg: string[] | 0 = flags[1] === "--projects"
        ? flags.slice(2, i() === -1 ? undefined : (i()))
        : (isNotFlag(flags[1]) ? [flags[1]] : 0 as const);
    const intensityArg: string = flags[1] === "--projects"
        ? (flags.includes("--intensity")
            ? (flags[flags.indexOf("--intensity") + 1] || (GetUserSettings())["default-intensity"])
            : (GetUserSettings())["default-intensity"])
        : (isNotFlag(flags[2]) ? flags[2] : (GetUserSettings())["default-intensity"]);

    const cleanerArgs: TheCleanerConstructedParams = {
        flags: {
            update: hasFlag("update", true),
            lint: hasFlag("lint", true),
            prettify: hasFlag("pretty", true),
            commit: hasFlag("commit", true),
            destroy: hasFlag("destroy", true),
        },
        parameters: {
            intensity: intensityArg,
            project: projectArg,
        },
    };

    switch (
        flags[0].toLowerCase()
    ) {
        case "clean":
            await TheCleaner(cleanerArgs);
            break;
        case "global-clean":
        case "hard-clean":
            await TheCleaner({
                flags: { ...cleanerArgs["flags"] },
                parameters: {
                    intensity: "hard-only",
                    project: projectArg,
                },
            });
            break;
        case "storage-emergency":
        case "maxim-clean":
        case "get-rid-of-node-modules":
        case "get-rid-of-node_modules":
            await TheCleaner({
                flags: { ...cleanerArgs["flags"] },
                parameters: {
                    intensity: "maxim-only",
                    project: projectArg,
                },
            });
            break;
        case "list":
            await TheLister(flags[1]);
            break;
        case "add":
            await ListManager("add", flags.slice(1));
            break;
        case "remove":
            await ListManager("rem", flags.slice(1));
            break;
        case "kickstart":
            await TheKickstarter({
                gitUrl: flags[1],
                path: flags[2],
                manager: flags[3],
            });
            break;
        case "settings":
            await TheSettings({ args: flags.slice(1) });
            break;
        case "migrate":
            await TheMigrator({ projectPath: (flags[2] ?? Deno.cwd()), wantedManager: flags[1] });
            break;
        case "self-update":
        case "upgrade":
        case "update":
            await TheUpdater({ silent: false, force: hasFlag("force", true) });
            break;
        case "about":
            await TheAbouter();
            break;
        case "build":
            await TheBuilder({
                project: (flags[1] ?? Deno.cwd()),
            });
            break;
        case "release":
        case "publish":
            await TheReleaser({
                version: flags[1],
                project: (flags[2] ?? Deno.cwd()),
                push: hasFlag("push", true),
                dry: hasFlag("dry-run", true),
            });
            break;
        case "commit": {
            const indexBranch = flags.indexOf("--branch");
            const indexB = flags.indexOf("-b");
            const indexElse = flags.indexOf("--");
            const filesEnd = indexBranch !== -1 ? indexBranch : (indexB !== -1 ? indexB : indexElse !== -1 ? indexElse : undefined);
            await TheCommitter({
                message: flags[1],
                files: flags.slice(2, filesEnd),
                branch: indexBranch !== -1 ? flags[indexBranch + 1] : (indexB !== -1 ? flags[indexB + 1] : undefined),
                push: hasFlag("push", true),
                keepStagedFiles: hasFlag("keep-staged", true),
                y: hasFlag("yes", true),
            });
            break;
        }
        case "uncommit": {
            await TheUncommitter();
            break;
        }
        case "surrender":
        case "deprecate":
        case "give-up":
        case "i-give-up":
        case "its-over":
        case "i-really-hate":
        // these are the wildest imho:
        case "im-done-with":
        case "nevermind":
            await TheSurrenderer({
                project: flags[1],
                message: flags[2],
                alternative: flags[3],
                learnMoreUrl: flags[4],
                gfm: hasFlag("github", false) || hasFlag("gh", false),
                glfm: hasFlag("gitlab", false) || hasFlag("gl", false),
            });
            break;
        case "terminate":
        case "fuck-the-lang":
        case "ftl":
        case "fuck-the-runtime":
        case "ftr":
        case "never-again-using":
        case "resign":
        case "unnode":
        case "undeno":
        case "unbun":
        case "unrust":
        case "ungo":
        case "seriously-fuck-node":
            await TheTerminator({
                runtime: (flags[0] === "unnode" || flags[0] === "seriously-fuck-node")
                    ? "node"
                    : flags[0] === "undeno"
                    ? "deno"
                    : flags[0] === "unbun"
                    ? "bun"
                    : flags[0] === "unrust"
                    ? "rust"
                    : flags[0] === "ungo"
                    ? "go"
                    : flags[1],
                projectsToo: hasFlag("remove-all-motherfuckers-too", false, false),
            });
            break;
        case "setup":
        case "configure":
        case "preset":
            TheSetuper({
                setup: flags[1],
                project: flags[2],
            });
            break;
        case "launch":
            await TheLauncher({
                project: flags[1],
                noIDE: hasFlag("no-ide", false, false),
            });
            break;
        case "cpf":
        case "export":
        case "gen-cpf":
        case "generate-cpf":
            await TheExporter({
                project: (flags[1] ?? Deno.cwd()),
                jsonc: hasFlag("jsonc", false),
                cli: hasFlag("cli", false),
                export: hasFlag("export", false),
            });
            break;
        case "compat":
        case "features":
            TheCompater({
                target: flags[1],
            });
            break;
        case "stats":
            await TheStatistics(flags[1]);
            break;
        case "documentation":
        case "docs":
        case "web":
        case "website":
            LogStuff(`Best documentation website for best CLI, live at https://fuckingnode.github.io/`, "bulb");
            LaunchWebsite("https://fuckingnode.github.io/");
            break;
        case "experimental--test-fim-parser":
            if (!Deno.args[1]) return;
            console.log(
                ParseFIM(Deno.readTextFileSync(Deno.args[1])),
            );
            break;
        case "experimental--test-fem-exec":
            if (!Deno.args[1]) return;
            await RunFEM(Deno.readTextFileSync(Deno.args[1]));
            break;
        case "github":
        case "repo":
        case "repository":
        case "oss":
        case "gh":
            LogStuff(
                `Free and open source, and free as in freedom, live at https://fuckingnode.github.io/repo\n(The above URL is a redirect to GitHub.)`,
                "bulb",
            );
            LaunchWebsite(`https://fuckingnode.github.io/repo`);
            break;
        case "audit":
            await TheAuditer({
                project: flags[1] ?? null,
            });
            break;
        case "sokoballs":
            LaunchWebsite(
                Math.random() > 0.5
                    ? "https://tenor.com/view/sokora-sokodunk-sokoballs-sokora-dunk-dunk-gif-9264211909049323587?quality=lossless"
                    : "https://tenor.com/view/sokora-dunk-ice-skate-ice-dunk-balling-gif-7665972654807661282?quality=lossless",
            );
            break;
        case "tip":
        case "hint":
        case "protip":
        case "pro-tip":
            LogStuff(`Here's a pro tip!`);
            LogStuff(
                brightBlue(HINTS[Math.floor(Math.random() * HINTS.length)]!),
            );
            break;
        case "help":
            TheHelper({ query: flags[1] });
            break;
        default:
            TheHelper({});
            LogStuff(orange(italic(`You're seeing this because command '${flags[0]}' doesn't exist.`)));
    }
}

if (import.meta.main) {
    try {
        await init();
        await main();
        Deno.exit(0);
    } catch (e) {
        ErrorHandler(e);
    }
}
