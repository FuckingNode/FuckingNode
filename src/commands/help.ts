import { StringUtils } from "@zakahacecosas/string-utils";
import { APP_NAME, APP_URLs } from "../constants.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import type { TheHelperConstructedParams } from "./constructors/command.ts";

type helpItem = [string, string | null, string];
type helpThing = helpItem[];

function formatCmd(obj: helpThing): string {
    const strings: string[] = [];

    for (const thingy of obj) {
        const cmd: string = ColorString(thingy[0], "bright-blue");
        const params: string = thingy[1] ? ColorString(thingy[1], "italic") : "";
        const desc: string = thingy[2];

        strings.push(`${cmd} ${ColorString(params, "bold")}\n${StringUtils.spaceString(desc, 2, 0)}`);
    }

    return strings.join("\n----\n");
}

function pathReminder() {
    LogStuff(
        `----\nNote: <project-path> is either a file path OR the "--self" flag which uses the Current Working Directory.\nE.g., running 'fkadd --self' here equals 'fkadd ${Deno.cwd()}'.\n\nAdditionally, in some places where we assume the project is already added (like clean or stats),\nyou can pass the project's name (as it appears in the package file) and it'll work as well.`,
        undefined,
        "italic",
    );
}

export default function TheHelper(params: TheHelperConstructedParams) {
    const { query } = params;

    const USAGE = formatCmd([
        [
            "clean",
            "<intensity | --> [--update] [--verbose] [--lint] [--pretty] [--commit] [--destroy]",
            "Cleans all of your projects.",
        ],
        [
            "manager",
            "add <project path> | remove <project path> | list",
            "Manages your added projects.",
        ],
        [
            "kickstart",
            "<git-url> [path] [npm | pnpm | yarn | deno | bun]",
            `Quickly clones a repo inside of [path], installs deps, setups ${APP_NAME.CASED}, and launches your favorite editor.`,
        ],
        [
            "commit",
            "<message> [branch] [--push]",
            `Makes a <commit> with the given message, optionally to the given [branch], only if a specified task succeeds.`,
        ],
        [
            "release",
            "<project> <version> [--push] [--dry]",
            `Releases a new <version> of the given <project> as an npm or jsr package, only if a specified task succeeds.`,
        ],
        [
            "surrender",
            "<project> [message] [alternative] [learn-more-url] [--github]",
            `Deprecates a <project>, optional leaving a [message], an [alternative], and a [learn-more-url].`,
        ],
        [
            "settings",
            "[setting] [extra parameters]",
            "Allows to change the CLIs setting. Run it without args to see current settings.",
        ],
        [
            "audit",
            "[project | --]",
            "Runs a security audit and determines if any found vulnerability actually affects your project. NodeJS-only.",
        ],
        [
            "migrate",
            "<target>",
            "Migrates a project from one package manager to another and reinstalls deps.",
        ],
        [
            "upgrade",
            null,
            "Checks for updates, and installs them if present.",
        ],
        [
            "about",
            null,
            "Shows info about the app.",
        ],
        [
            "--version, -v",
            null,
            "Shows current version.",
        ],
        [
            "--help, -h",
            "[command]",
            "Shows this menu, or the help menu for a specific command, if provided.",
        ],
    ]);

    const MANAGER_OPTIONS = formatCmd([
        [
            "manager",
            "add <project-path>",
            "Adds a project to your list.",
        ],
        [
            "manager",
            "remove <project-path>",
            "Removes a project from your list.",
        ],
        [
            "manager",
            "list [--ignored / --alive]",
            "Lists all of your added projects. You can use --ignored or --alive to filter ignored projects (with --alive, only NOT ignored projects are shown, with --ignore, vice versa).",
        ],
    ]);
    const CLEAN_OPTIONS = formatCmd([
        [
            "clean",
            "<project-path | --> <intensity | -->",
            "Where the project equals a <project-path> and intensity is either 'normal' | 'hard' | 'hard-only' | 'maxim' | 'maxim-only'.\n  The higher the intensity, the deeper (but more time-consuming) the cleaning will be.\n  Use '--' as a project to clean all your projects at once, and as the intensity to use your default one.\n  You can also just run 'clean' without flags to clean everything.",
        ],
        [
            "--update",
            null,
            "Update all your projects before cleaning them.",
        ],
        [
            "--verbose",
            null,
            "Show more detailed ('verbose') logs. This includes timestamps and a report.",
        ],
        [
            "--lint",
            null,
            "Lint the project's code if possible. You'll need either ESLint in your devDependencies or a custom lint script specified in the fknode.yaml.",
        ],
        [
            "--pretty",
            null,
            "Prettify the project's code if possible. You'll need either Prettier in your devDependencies or a custom prettify script specified in the fknode.yaml.",
        ],
        [
            "--destroy",
            null,
            "Remove additional files and DIRs (e.g. 'dist/', 'out/', etc...) when cleaning. Requires you to specify files and DIRs to remove in the fknode.yaml.",
        ],
        [
            "--commit",
            null,
            `Commit any action that changes the code (e.g. --pretty or --update) when all of these are true:\n${
                StringUtils.spaceString(`- "commitActions" is set to true in your fknode.yaml.`, 4, 0)
            }\n${StringUtils.spaceString(`- Local working tree was clean before ${APP_NAME.CASED} touched it.`, 4, 0)}\n${
                StringUtils.spaceString(`- Local repo is not behind upstream.`, 4, 0)
            }\n  Uses a default commit message; override it by setting "commitMessage" in your fknode.yaml.`,
        ],
    ]);
    const SETTINGS_OPTIONS = formatCmd([
        [
            "flush",
            "<'logs' | 'updates' | 'projects' | 'all'> [--force]",
            "Flushes (removes) chosen config files.",
        ],
        [
            "repair",
            null,
            `Resets all settings to their default value.`,
        ],
        [
            "change",
            "<setting> <value>",
            "Allows to change chosen <setting> to given <value>. See documentation for more info.",
        ],
    ]);
    const KICKSTART_OPTIONS = formatCmd([
        [
            "kickstart",
            "<git-url> [project-path] [manager]",
            "Clones <git-url> to [project-path] (or ./<repo-name> by default), installs deps with [manager] (or default (pnpm, bun, or deno) if not given), opens your editor (VSCode by default, change from settings), and adds the project to your list.",
        ],
    ]);
    const SURRENDER_OPTIONS = formatCmd([
        [
            "surrender",
            "<project> [message] [alternative] [learn-more-url] [--github]",
            "Takes a <project>, runs a last maintenance task, then edits its README file to add a deprecation notice, and optionally, a [message], an [alternative] to your project, and a URL to learn more ([learn-more-url]). If [--github] is passed, GitHub flavored MarkDown is used.\n\nAll these changes will be committed and pushed to the repo, and after that the code will be removed from your local machine.",
        ],
    ]);
    const AUDIT_OPTIONS = formatCmd([
        [
            "audit",
            "[project-path | --]",
            `Runs your manager's audit command, then asks questions to tell if any vulnerability affects the project.\n  Run without a project or with '--' to audit all projects.\n  Learn more about it at ${APP_URLs.WEBSITE}learn/audit/`,
        ],
    ]);
    const MIGRATE_OPTIONS = formatCmd([
        [
            "migrate",
            "<project-path> <target>",
            "Automatically migrates a given <project-path> to a given <target> package manager (npm, pnpm, yarn, deno, or bun).\n  Relies as of now on each manager's ability to understand the other one's package manager formats.",
        ],
    ]);
    const COMMIT_OPTIONS = formatCmd([
        [
            "commit",
            "<message> [branch] [--push]",
            "Runs our maintenance task and a script specified by you (if any) and commit only if they succeed.\n  Just like git commit, uses the CWD as the path to the project.\n  Run with --push to push the commit.\n  Pass a branch name as the 2nd argument to commit there.",
        ],
    ]);
    const RELEASE_OPTIONS = formatCmd([
        [
            "release",
            "<project-path> <version> [--push] [--dry]",
            "Runs our maintenance task and a script specified by you (if any).\n  Then bumps version in your package file to given <version> and commits that.\n  If these tasks succeed, releases the project as an npm / jsr package (autodetected).\n  Run with --push to push commit as well.\n  Use '--dry' to make everything (commit, push, run script) but without publishing to npm / jsr.",
        ],
    ]);
    const EXPORT_OPTIONS = formatCmd([
        [
            "export",
            "<project-path> [--json] [--cli]",
            "Exports a project's FnCPF (an internal file used by us to work with them) so you can see it.\n  Defaults to .yaml format, use '--json' to use JSONC format instead.\n  Add '--cli' to also show the output file in your terminal.",
        ],
    ]);
    const SETUP_OPTIONS = formatCmd([
        [
            "setup",
            "<project-path> <setup>",
            "Allows you to 'add a setup' to your project (setup = preset text-config file).\n  For now, .gitignore, tsconfig.json, and of course fknode.yaml setups exist.\n  Run 'setup' with no args to see the list of available options.",
        ],
    ]);
    const COMPAT_OPTIONS = formatCmd([
        [
            "compat",
            "[feature]",
            "Shows info about this CLI's cross-runtime & cross-platform support for the given feature,\n  or an overall summary if none given.",
        ],
    ]);
    const UPGRADE_OPTIONS = formatCmd([
        [
            "upgrade",
            null,
            "Checks for updates, and installs them if present.",
        ],
    ]);
    const ABOUT_OPTIONS = formatCmd([
        [
            "about",
            null,
            "Shows a simple (but cool looking!) about screen. Includes random quotes.",
        ],
    ]);

    switch (StringUtils.normalize(query ?? "", { strict: true })) {
        case "clean":
            LogStuff(
                `'clean' will clean your added projects. Options and flags:\n${CLEAN_OPTIONS}`,
            );
            pathReminder();
            break;
        case "manager":
            LogStuff(
                `'manager' will let you manage projects. Options:\n${MANAGER_OPTIONS}`,
            );
            pathReminder();
            break;
        case "settings":
            LogStuff(
                `'settings' lets you manage app configurations and more. Options:\n${SETTINGS_OPTIONS}`,
            );
            break;
        case "kickstart":
            LogStuff(
                `'kickstart' allows you to kickstart a repo easily. Options:\n${KICKSTART_OPTIONS}`,
            );
            pathReminder();
            break;
        case "migrate":
            LogStuff(MIGRATE_OPTIONS);
            pathReminder();
            break;
        case "audit":
            LogStuff(AUDIT_OPTIONS);
            pathReminder();
            break;
        case "surrender":
            LogStuff(
                `'surrender' allows you to deprecate a project easily. Options:\n${SURRENDER_OPTIONS}`,
            );
            pathReminder();
            break;
        case "compat":
            LogStuff(COMPAT_OPTIONS);
            break;
        case "commit":
            LogStuff(COMMIT_OPTIONS);
            break;
        case "release":
        case "publish":
            LogStuff(RELEASE_OPTIONS);
            pathReminder();
            break;
        case "export":
            LogStuff(EXPORT_OPTIONS);
            pathReminder();
            break;
        case "setup":
            LogStuff(SETUP_OPTIONS);
            pathReminder();
            break;
        case "upgrade":
            LogStuff(UPGRADE_OPTIONS);
            break;
        case "about":
            LogStuff(ABOUT_OPTIONS);
            break;
        case "help":
            LogStuff(
                `Usage: ${ColorString(APP_NAME.CLI, "bright-green")} <command> [params...]\n\n${USAGE}`,
            );
            break;
        default:
            LogStuff(
                `Usage: ${ColorString(APP_NAME.CLI, "bright-green")} <command> [params...]\n\n${USAGE}\n`,
            );
            LogStuff(
                "Pro tip: Run --help <command-name> to get help with a specific command.",
                "bulb",
                "bright-yellow",
            );
            break;
    }
}
