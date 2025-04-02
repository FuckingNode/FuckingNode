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
import { APP_NAME, APP_URLs, FULL_NAME } from "./constants.ts";
import { ColorString, LogStuff, ParseFlag } from "./functions/io.ts";
import { FreshSetup, GetAppPath, GetUserSettings } from "./functions/config.ts";
import { DEBUG_LOG, GenericErrorHandler } from "./functions/error.ts";
import type { TheCleanerConstructedParams } from "./commands/constructors/command.ts";
import { RunScheduledTasks } from "./functions/schedules.ts";
import { StringUtils, UnknownString } from "@zakahacecosas/string-utils";
import { CleanupProjects } from "./functions/projects.ts";
import { LaunchWebsite } from "./functions/http.ts";

// this is outside the main loop so it can be executed
// without depending on other modules
// yes i added this feature because of a breaking change i wasn't expecting

// ps. i don't use LogStuff because if something broke, well, it might not work
if (StringUtils.normalize(Deno.args[0] ?? "") === "something-fucked-up") {
    console.log(
        `This command will reset ${APP_NAME.CASED}'s settings, logs, and configs ENTIRELY (except for project list). Are you sure things fucked up that much?`,
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

        console.log("Done. Don't fuck up again this time!");
    } else {
        console.log("I knew it wasn't that bad...");
    }
    Deno.exit(0);
}

async function init() {
    await FreshSetup();
    await RunScheduledTasks();
    await CleanupProjects();
}

/** Normalized Deno.args */
const flags = Deno.args.map((arg) =>
    StringUtils.normalize(arg, {
        preserveCase: true,
        strict: false,
        stripCliColors: true,
    })
);

export const __FKNODE_SHALL_WE_DEBUG = flags.some((s) => StringUtils.normalize(s) === "fkndbg");
DEBUG_LOG("Initialized __FKNODE_SHALL_WE_DEBUG constant (ENTRY POINT)");
DEBUG_LOG("ARGS", flags);

function hasFlag(flag: string, allowQuickFlag: boolean, firstOnly: boolean = false): boolean {
    if (firstOnly === true) {
        return StringUtils.testFlag(flags[0] ?? "", flag, { allowQuickFlag, normalize: true });
    }
    return StringUtils.testFlags(flags, flag, { allowQuickFlag, normalize: true });
}

if (hasFlag("help", true)) {
    try {
        await init();
        await TheHelper({ query: flags[1] });
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("experimental-audit", false)) {
    try {
        await init();
        await LogStuff(
            "Beware that as an experimental feature, errors are likely to happen. Report issues, suggestions, or feedback on GitHub.",
            "warn",
            "bright-yellow",
        );
        await TheAuditer({
            project: flags[1] ?? null,
            strict: ParseFlag("strict", true).includes(flags[2] ?? ""),
        });
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("version", true, true) && !flags[1]) {
    await init();
    await LogStuff(FULL_NAME, "bulb", "bright-green");
    Deno.exit(0);
}

function isNotFlag(arg: UnknownString): arg is string {
    if (!StringUtils.validate(arg)) return false;
    const str = StringUtils.normalize(arg, { preserveCase: true, strict: false, stripCliColors: true });
    return !str.startsWith("-") && !str.startsWith("--");
}

async function main(command: string) {
    await init();

    const projectArg = isNotFlag(flags[1]) ? flags[1] : 0 as const;

    const intensityArg = isNotFlag(flags[2]) ? flags[2] : GetUserSettings().defaultIntensity;

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
        StringUtils.normalize(command, {
            strict: true,
            preserveCase: true,
            stripCliColors: true,
        })
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
        case "get-rid-of-node_modules":
            await TheCleaner({
                flags: { ...cleanerArgs["flags"] },
                parameters: {
                    intensity: "maxim-only",
                    project: projectArg,
                },
            });
            break;
        case "manager":
            await TheManager(flags);
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
            await TheMigrator({ projectPath: flags[1], wantedManager: flags[2] });
            break;
        case "self-update":
        case "upgrade":
            await LogStuff(`Currently using ${ColorString(FULL_NAME, "green")}`);
            await LogStuff("Checking for updates...");
            await TheUpdater({ silent: false, install: true });
            break;
        case "about":
            await TheAbouter();
            break;
        case "release":
        case "publish":
            await TheReleaser({
                project: flags[1],
                version: flags[2],
                push: hasFlag("push", true),
                dry: hasFlag("dry-run", true),
            });
            break;
        case "commit":
            await TheCommitter({
                message: flags[1],
                branch: flags[2],
                push: hasFlag("push", true),
            });
            break;
        case "surrender":
        case "give-up":
        case "i-give-up":
        case "its-over":
        case "i-really-hate":
        // "im-done-with <project>" is wild LMAO
        case "im-done-with":
            await TheSurrenderer({
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
            await TheSetuper({
                project: flags[1],
                setup: flags[2],
            });
            break;
        case "launch":
            await TheLauncher({
                project: flags[1],
            });
            break;
        case "export":
        case "gen-cpf":
        case "generate-cpf":
            await TheExporter({
                project: flags[1],
                json: hasFlag("json", false),
                cli: hasFlag("cli", false),
            });
            break;
        case "compat":
        case "features":
            await TheCompater({
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
            await LogStuff(`Best documentation website for best CLI, live at ${APP_URLs.WEBSITE}`, "bulb");
            break;
        case "github":
        case "repo":
        case "repository":
        case "oss":
        case "gh":
            await LogStuff(
                `Free and open source, and free as in freedom, live at ${APP_URLs.WEBSITE}repo\n(The above URL is a redirect to GitHub.)`,
                "bulb",
            );
            break;
        case "audit":
            await LogStuff(
                "The Audit feature is experimental and only available for NodeJS projects. Run '--experimental-audit' to use it.\nImportant: We did not update this feature for V3, it's planned to be fully rewritten for V3.3. Do not use it as of now, it is very broken and mostly useless (AS OF NOW).",
                "warn",
                "bright-yellow",
            );
            break;
        case "sokoballs":
            await LaunchWebsite("https://tenor.com/view/sokora-dunk-ice-skate-ice-dunk-balling-gif-7665972654807661282?quality=lossless");
            break;
        default:
            await TheHelper({ query: flags[1] });
    }

    Deno.exit(0);
}

try {
    if (!StringUtils.validate(flags[0])) {
        await init();
        await TheHelper({});
        Deno.exit(0);
    }

    await main(flags[0]);
} catch (e) {
    GenericErrorHandler(e);
}
