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
// other things
import { APP_NAME, VERSION } from "./constants.ts";
import { ColorString, LogStuff, ParseFlag } from "./functions/io.ts";
import { FreshSetup, GetAppPath, GetSettings } from "./functions/config.ts";
import { GenericErrorHandler } from "./utils/error.ts";
import type { TheCleanerConstructedParams } from "./commands/constructors/command.ts";
import { RunScheduledTasks } from "./functions/schedules.ts";
import { StringUtils } from "@zakahacecosas/string-utils";

// this is outside the main loop so it can be executed
// without depending on other modules
// yes i added this feature because of a breaking change i wasn't expecting
if (StringUtils.normalize(Deno.args[0] ?? "") === "something-fucked-up") {
    const c = await LogStuff(
        `This command will reset ${APP_NAME.CASED}'s settings, logs, and configs ENTIRELY (except for project list). Are you sure things fucked up that much?`,
        "what",
        "bold",
        true,
    );
    if (c === true) {
        const paths = [
            await GetAppPath("SCHEDULE"),
            await GetAppPath("SETTINGS"),
            await GetAppPath("ERRORS"),
            await GetAppPath("LOGS"),
        ];

        for (const path of paths) {
            await Deno.remove(path, { recursive: true });
        }

        await LogStuff("Done. Don't fuck up again this time!", "tick");
    } else {
        await LogStuff("I knew it wasn't that bad...");
    }
    Deno.exit(0);
}

async function init() {
    await FreshSetup();
    await RunScheduledTasks();
}

/** Normalized Deno.args */
const flags = Deno.args.map((arg) => StringUtils.normalize(arg));

if (!StringUtils.validate(flags[0])) {
    await init();
    await TheHelper({});
    Deno.exit(0);
}

function hasFlag(flag: string, allowShort: boolean): boolean {
    return ParseFlag(flag, allowShort).some((f) => flags.includes(StringUtils.normalize(f)));
}

if (hasFlag("help", true)) {
    await init();
    try {
        await TheHelper({ query: flags[1] });
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("experimental-audit", false)) {
    await init();
    try {
        await LogStuff(
            "Beware that, as an experimental features, errors are likely to happen. Report any issue, suggestion, or feedback on GitHub.",
            "warn",
            "bright-yellow",
        );
        await TheAuditer(
            flags[1] ?? null,
            ParseFlag("strict", true).includes(flags[2] ?? ""),
        );
        Deno.exit(0);
    } catch (e) {
        console.error("Critical error", e);
        Deno.exit(1);
    }
}

if (hasFlag("version", true) && !flags[1]) {
    await LogStuff(VERSION, "bulb", "bright-green");
    Deno.exit(0);
}

async function main(command: string) {
    await init();

    /* this is a bit unreadable, i admit */
    const projectArg = (
            flags[1] &&
            flags[1].trim() !== "" &&
            (((!flags[1].trim().startsWith("--") && !flags[1].trim().startsWith("-")) &&
                !ParseFlag("self", false).includes(flags[1])) || ParseFlag("self", false).includes(flags[1]))
        )
        ? flags[1]
        : 0 as const;

    const intensityArg = (flags[2] && flags[2].trim() !== "" && !flags[2].trim().includes("--"))
        ? flags[2]
        : (await GetSettings()).defaultCleanerIntensity;

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

    try {
        switch (StringUtils.normalize(command, true, true)) {
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
                    gitUrl: flags[1] ?? "",
                    path: flags[2] ?? "",
                    manager: flags[3] ?? "",
                });
                break;
            case "settings":
                await TheSettings({ args: flags });
                break;
            case "migrate":
                await TheMigrator({ project: flags[1], desiredManager: flags[2] });
                break;
            case "self-update":
            case "upgrade":
                if (command.toLowerCase() === "self-update") await LogStuff("Use upgrade instead", "warn", "bright-yellow");
                await LogStuff(`Currently on version ${ColorString(VERSION, "green")}`);
                await LogStuff("Checking for updates...");
                await TheUpdater({ silent: false });
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
                await TheStatistics(flags[1] ?? "");
                break;
            case "documentation":
            case "docs":
            case "web":
            case "website":
                await LogStuff("Best documentation website for best CLI, live at https://zakahacecosas.github.io/FuckingNode/", "bulb");
                break;
            case "github":
            case "repo":
            case "repository":
            case "oss":
                await LogStuff(
                    "Free and open source, and free as in freedom, live at https://zakahacecosas.github.io/FuckingNode/repo\n(The above URL is a redirect to GitHub.)",
                    "bulb",
                );
                break;
            case "audit":
                await LogStuff(
                    "The Audit feature is experimental. It's only available for NodeJS projects using npm, and hidden behind '--experimental-audit'.",
                    "warn",
                    "bright-yellow",
                );
                break;
            default:
                await TheHelper({ query: flags[1] });
                Deno.exit(0);
        }

        Deno.exit(0);
    } catch (e) {
        GenericErrorHandler(e, true);
    }
}

await main(flags[0]);
