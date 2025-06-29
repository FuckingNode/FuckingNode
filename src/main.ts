// the things.
import TheCleaner from "./commands/clean.ts";
import TheManager from "./commands/manage.ts";
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
// other things
import { APP_NAME, APP_URLs, FULL_NAME, FWORDS } from "./constants.ts";
import { ColorString, LogStuff } from "./functions/io.ts";
import { FreshSetup, GetAppPath, GetUserSettings } from "./functions/config.ts";
import { DEBUG_LOG, ErrorHandler } from "./functions/error.ts";
import type { TheCleanerConstructedParams } from "./commands/constructors/command.ts";
import { RunScheduledTasks } from "./functions/schedules.ts";
import { normalize, testFlag, testFlags, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { CleanupProjects } from "./functions/projects.ts";
import { LaunchWebsite } from "./functions/http.ts";
import { HINTS } from "./functions/phrases.ts";
import { GetDateNow } from "./functions/date.ts";

// this is outside the main loop so it can be executed
// without depending on other modules
// yes i added this feature because of a breaking change i wasn't expecting

// ps. i don't use LogStuff because if something broke, well, it might not work
if (normalize(Deno.args[0] ?? "") === "something-fucked-up") {
    console.log(
        `This command will reset ${APP_NAME.CASED}'s settings, logs, and configs ENTIRELY (except for project list). Are you sure things ${FWORDS.FK}ed up that much?`,
    );
    const c = confirm("Confirm reset?");
    if (c === true) {
        const paths = [
            GetAppPath("SCHEDULE"),
            GetAppPath("SETTINGS"),
            GetAppPath("ERRORS"),
            GetAppPath("LOGS"),
            GetAppPath("REM"),
        ];

        for (const path of paths) {
            Deno.removeSync(path, { recursive: true });
        }

        console.log(`Done. Don't ${FWORDS.FK} up again this time.`);
    } else {
        console.log(`I knew it wasn't that ${FWORDS.FK}ed up...`);
    }
    Deno.exit(0);
}

async function init() {
    const dir = Deno.cwd();
    FreshSetup();
    await RunScheduledTasks();
    CleanupProjects();
    Deno.chdir(dir);
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
DEBUG_LOG("Initialized FKNODE_SHALL_WE_DEBUG constant (ENTRY POINT)");
DEBUG_LOG("ARGS", flags);

function hasFlag(flag: string, allowQuickFlag: boolean, firstOnly: boolean = false): boolean {
    if (firstOnly === true) return testFlag(flags[0] ?? "", flag, { allowQuickFlag, allowNonExactString: true });
    return testFlags(flags, flag, { allowQuickFlag, allowNonExactString: true });
}

if (hasFlag("help", true)) {
    try {
        await init();
        TheHelper({ query: flags[1] ?? "help" });
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("version", true, true) && !flags[1]) {
    console.log(FULL_NAME, "built for", Deno.build.target);
    console.log("Deno JavaScript runtime", Deno.version.deno, "| TypeScript", Deno.version.typescript, "| V8 Engine", Deno.version.v8);
    console.log("Run 'fuckingnode about' for details.");
    Deno.exit(0);
}

function isNotFlag(arg: UnknownString): arg is string {
    if (!validate(arg)) return false;
    const str = normalize(arg, { preserveCase: true, strict: false, removeCliColors: true });
    return !str.startsWith("-") && !str.startsWith("--");
}

async function main(command: UnknownString) {
    // debug commands
    if (FKNODE_SHALL_WE_DEBUG || Deno.args[0]?.startsWith("FKNDBG")) {
        console.log(ColorString("FKNDBG at " + GetDateNow(), "italic"));
        console.log("FKNDBG Logs aren't stored into the .log file.");
        console.log("-".repeat(37));
    }
    if (Deno.args[0] === "FKNDBG_PROC") {
        console.log(
            "PROC NAME",
            new TextDecoder().decode(
                new Deno.Command("ps", {
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
        console.log("AT", Deno.cwd());
        console.log("FROM", Deno.execPath());
        console.log("CONCRETELY", import.meta.url);
        console.log("MAIN?", import.meta.main);
        return;
    }
    if (Deno.args[0] === "FKNDBG_MEM") {
        const mem = Deno.memoryUsage();
        console.log("MEM USAGE:");
        for (const [k, v] of Object.entries(mem)) {
            console.log(`${k.padEnd(10)}: ${(v / 1024 / 1024).toFixed(2)} MB`);
        }
        return;
    }
    if (Deno.args[0] === "FKNDBG_WHO") {
        console.log("System info:", {
            ...Deno.build,
            hostname: Deno.hostname(),
        });
        return;
    }

    if (!validate(command)) {
        TheHelper({});
        Deno.exit(0);
    }

    DEBUG_LOG("FLAGS[1]", flags[1], isNotFlag(flags[1]));
    const projectArg = (isNotFlag(flags[1])) ? flags[1] : 0 as const;
    DEBUG_LOG("PROJECT ARG IS", projectArg);
    DEBUG_LOG("FLAGS[2]", flags[2], isNotFlag(flags[2]));
    const intensityArg = isNotFlag(flags[2]) ? flags[2] : GetUserSettings().defaultIntensity;
    DEBUG_LOG("INTENSITY ARG IS", intensityArg);

    const cleanerArgs: TheCleanerConstructedParams = {
        flags: {
            verbose: hasFlag("verbose", true),
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
        command.toLowerCase()
    ) {
        case "clean":
            TheCleaner(cleanerArgs);
            break;
        case "global-clean":
        case "hard-clean":
            TheCleaner({
                flags: { ...cleanerArgs["flags"] },
                parameters: {
                    intensity: "hard-only",
                    project: projectArg,
                },
            });
            break;
        case "storage-emergency":
        case "maxim-clean":
        case "get-rid-of-node_modules":
            TheCleaner({
                flags: { ...cleanerArgs["flags"] },
                parameters: {
                    intensity: "maxim-only",
                    project: projectArg,
                },
            });
            break;
        case "manager":
            TheManager(flags);
            break;
        case "kickstart":
            TheKickstarter({
                gitUrl: flags[1],
                path: flags[2],
                manager: flags[3],
            });
            break;
        case "settings":
            TheSettings({ args: flags.slice(1) });
            break;
        case "migrate":
            TheMigrator({ projectPath: flags[1], wantedManager: flags[2] });
            break;
        case "self-update":
        case "upgrade":
        case "update":
            LogStuff(`Currently using ${ColorString(FULL_NAME, "green")}`);
            LogStuff("Checking for updates...");
            await TheUpdater({ silent: false });
            break;
        case "about":
            TheAbouter();
            break;
        case "release":
        case "publish":
            TheReleaser({
                version: flags[1],
                project: (flags[2] ?? Deno.cwd()),
                push: hasFlag("push", true),
                dry: hasFlag("dry-run", true),
            });
            break;
        case "commit": {
            const indexBranch = flags.indexOf("--branch");
            const indexB = flags.indexOf("-b");
            const filesEnd = indexBranch !== -1 ? indexBranch : (indexB !== -1 ? indexB : undefined);
            TheCommitter({
                message: flags[1],
                files: flags.slice(2, filesEnd),
                branch: indexBranch !== -1 ? flags[indexBranch + 1] : (indexB !== -1 ? flags[indexB + 1] : undefined),
                push: hasFlag("push", true),
                keepStagedFiles: hasFlag("keep-staged", true),
                y: hasFlag("yes", true),
            });
            break;
        }
        case "surrender":
        case "give-up":
        case "i-give-up":
        case "its-over":
        case "i-really-hate":
        // "im-done-with <project>" is wild LMAO
        case "im-done-with":
            TheSurrenderer({
                project: flags[1],
                message: flags[2],
                alternative: flags[3],
                learnMoreUrl: flags[4],
                isGitHub: hasFlag("github", false) || hasFlag("gh", false),
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
            TheLauncher({
                project: flags[1],
            });
            break;
        case "export":
        case "gen-cpf":
        case "generate-cpf":
            TheExporter({
                project: flags[1],
                json: hasFlag("json", false),
                cli: hasFlag("cli", false),
            });
            break;
        case "compat":
        case "features":
            TheCompater({
                target: flags[1],
            });
            break;
        case "stats":
            TheStatistics(flags[1]);
            break;
        case "documentation":
        case "docs":
        case "web":
        case "website":
            LogStuff(`Best documentation website for best CLI, live at ${APP_URLs.WEBSITE}`, "bulb");
            LaunchWebsite(APP_URLs.WEBSITE);
            break;
        case "github":
        case "repo":
        case "repository":
        case "oss":
        case "gh":
            LogStuff(
                `Free and open source, and free as in freedom, live at ${APP_URLs.WEBSITE}repo\n(The above URL is a redirect to GitHub.)`,
                "bulb",
            );
            LaunchWebsite(`${APP_URLs.WEBSITE}repo`);
            break;
        case "audit":
            TheAuditer({
                project: flags[1] ?? null,
            });
            break;
        case "sokoballs":
            LaunchWebsite("https://tenor.com/view/sokora-dunk-ice-skate-ice-dunk-balling-gif-7665972654807661282?quality=lossless");
            break;
        case "tip":
        case "hint":
        case "protip":
        case "pro-tip":
            LogStuff(
                HINTS[Math.floor(Math.random() * HINTS.length)]!,
                undefined,
                "bright-blue",
            );
            break;
        default:
            TheHelper({ query: flags[1] });
    }

    Deno.exit(0);
}

// I SWEAR - THE FACT THAT THIS "IF" WAS MISSING MADE ALL THE TEST SUITE NOT WORK LMFAO
// javascript is definitely... something
if (import.meta.main) {
    try {
        await init();

        await main(flags[0]);
    } catch (e) {
        ErrorHandler(e);
    }
}
