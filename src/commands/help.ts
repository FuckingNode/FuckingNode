import { normalize, spaceString } from "@zakahacecosas/string-utils";
import { APP_NAME } from "../constants/name.ts";
import { LogStuff } from "../functions/io.ts";
import type { TheHelperConstructedParams } from "./constructors/command.ts";
import { ColorString } from "../functions/color.ts";

type HelpItem = [string, string | null, string] | [string, string | null, string, boolean];

function formatCmd(obj: HelpItem[]): string {
    const strings: string[] = [];

    for (const thingy of obj) {
        const cmd: string = ColorString(
            thingy[0],
            thingy[0] === ">>>" ? "bright-green" : ["export", "compat"].includes(thingy[0]) ? "cyan" : "bright-blue",
        );
        const params: string = thingy[1]
            ? ColorString(thingy[1], "bold", "italic", "half-opaque")
            : ColorString("(No parameters)", "italic", "half-opaque");
        const desc: string = thingy[2].replaceAll("\n", "\n" + spaceString(" ", 0, 19))
            .replace(new RegExp("--[^\\s]+", "gim"), (match) => ColorString(match, "orange", "bold"))
            .replace(new RegExp("\<[^\\s]+\>", "gim"), (match) => ColorString(match, "pink", "bold"))
            .replace(new RegExp("'[^\\s]+'", "gim"), (match) => ColorString(match, "orange", "bold"));

        strings.push(
            `${spaceString(cmd, 0, 20 - (thingy[0].length))}${desc}${((thingy[3] ?? false) === true) ? `\n${params}` : ""}`,
        );
    }

    return strings.join("\n\n");
}

function formatCmdWithTitle(title: string, desc: string, obj: HelpItem[]): string {
    return `> ${ColorString(title, "bright-green", "bold")}\n\n>>> Details:\n\n${desc}\n\n>>> Parameters\n\n${formatCmd(obj)}\n`;
}

function projectReminder() {
    LogStuff(
        "Note: <project> is either a file path OR a project's name.\nIn places where we can assume the project is already added (like 'clean', 'remove', or 'stats'),\nyou can pass the project's name (as it appears in the package file) and it should be recognized.",
        undefined,
        ["italic", "half-opaque"],
    );
}

export default function TheHelper(params: TheHelperConstructedParams) {
    const { query } = params;

    const USAGE = formatCmd([
        [
            ">>>",
            `The ${APP_NAME.CASED} experience...`,
            "Base commands:",
        ],
        [
            "clean",
            "<intensity | --> [--update] [--lint] [--pretty] [--commit] [--destroy]",
            "Cleans all of your projects.",
        ],
        [
            "add",
            "<project>",
            "Adds a project to your list.",
        ],
        [
            "remove",
            "<project>",
            "Removes a project from your list.",
        ],
        [
            "list",
            "[--ignored OR --alive]",
            "Shows your added project list.",
        ],
        [
            "kickstart",
            "<git-url> [path] [npm | pnpm | yarn | deno | bun]",
            `Quickly clones a repo inside [path], installs deps, setups ${APP_NAME.CASED}, and launches your code editor.`,
        ],
        [
            "commit",
            "<message> [branch] [--push]",
            `Makes a commit with the given <message> only if a specific task succeeds, (to [branch], if specified).`,
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
            "audit",
            "[project | --]",
            "Runs a security audit and determines if any found vulnerability actually affects your project.",
        ],
        [
            "migrate",
            "<target> [project]",
            "Migrates a project from one package manager to another and reinstalls deps.",
        ],
        [
            "build",
            "[project]",
            "Runs a set of user-defined commands, meant for building your project. If a command fails, it halts.",
        ],
        [
            "setup",
            "[setup-to-use] [project]",
            "Adds a typical config file (tsconfig, gitignore,...) for you. Run with no args to see available setups.",
        ],
        [
            "launch",
            "<project>",
            'Launches your code editor with a specific project and runs a specified command (e.g., "npm run start").',
        ],
        [
            "stats",
            "[project]",
            "Shows basic statistics for a project and (if viable) compares it against a basic set of recommended standards.",
        ],
        [
            "export",
            "[project] [--json] [--cli]",
            "Exports your project's CPF. Meant for debugging only.",
        ],
        [
            ">>>",
            "Configuration and more...",
            "Other commands:",
        ],
        [
            "settings",
            "[setting] [extra parameters]",
            "Allows you to change settings. Run it without args to see current settings.",
        ],
        [
            "compat",
            "[feature]",
            "Shows an overall summary of support for all features, or details on a specific feature if provided.",
        ],
        [
            "upgrade",
            null,
            "Checks for updates. As of now they need to be installed manually. Data won't be lost.",
        ],
        [
            "about",
            null,
            `Shows info about ${APP_NAME.CASED}.`,
        ],
        [
            "tip",
            null,
            "Shows a random pro-tip.",
        ],
        [
            "--version, -v",
            null,
            "Shows details about locally installed version.",
        ],
        [
            "help, --help, -h",
            "[command]",
            "Shows this menu, or the help menu for a specific command, if provided.",
        ],
    ]
        .map((item) => [...item, true]) as HelpItem[]);

    switch (normalize(query ?? "", { strict: true })) {
        case "clean":
            LogStuff(
                formatCmdWithTitle(
                    "'clean' will clean, lint, prettify,... all your projects.",
                    `Recursively runs a set of tasks across all of your projects, depending on given flags and project configuration (via fknode.yaml).\nIt's our main feature, base for ${APP_NAME.CASED} saving you time.`,
                    [
                        [
                            "<project | -->",
                            null,
                            'Project to be cleaned. Set to "--" to bulk-clean all added projects.\nRun with no args to bulk-clean all projects, too.',
                        ],
                        [
                            "[intensity | --]",
                            null,
                            "Either 'normal' | 'hard' | 'hard-only' | 'maxim' | 'maxim-only'.\nThe higher the intensity, the deeper (but more time-consuming) the cleaning will be.\nUse '--' as a project to clean all your projects at once, and as the intensity to use your default one.\nYou can also just run 'clean' without flags to clean everything.",
                        ],
                        [
                            "--update, -u",
                            null,
                            "Update all your projects before cleaning them.",
                        ],
                        [
                            "--lint, -l",
                            null,
                            "Lint the project's code (if possible).\nYou need to specify a linting script in your fknode.yaml file.\nIf script is absent, we'll try to use ESLint (if installed).",
                        ],
                        [
                            "--pretty, -p",
                            null,
                            "Prettify the project's code (if possible).\nYou need to specify a prettifying script in your fknode.yaml file.\nIf script is absent, we'll try to use Prettier (if installed).",
                        ],
                        [
                            "--destroy, -d",
                            null,
                            "Removes files and DIRs (e.g. 'dist/', 'out/', etc...) specified by you in the fknode.yaml.",
                        ],
                        [
                            "--commit, -c",
                            null,
                            `Commit any changes made (via, e.g., --pretty or --update) only if all of these are true:\n- "commitActions" is set to true in your fknode.yaml.\n- Local working tree was clean before ${APP_NAME.CASED} touched it.\n- Local repo is not behind upstream.\nIt uses a default commit message; override it by setting "commitMessage" in your fknode.yaml.`,
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "add":
            LogStuff(
                formatCmdWithTitle(
                    "'add' lets you add projects to your list.",
                    "Your project list is used to:\n- Bulk-run several maintenance tasks (like cleaning, linting, etc.) at once, via 'clean'.\n- Let you use a project's name instead of full path from most other commands.\nThis command lets you add projects to it.",
                    [
                        [
                            "<project>",
                            null,
                            "Path to the project to be added.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "remove":
            LogStuff(
                formatCmdWithTitle(
                    "'remove' lets you remove projects to your list.",
                    "Your project list is used to:\n- Bulk-run several maintenance tasks (like cleaning, linting, etc.) at once, via 'clean'.\n- Let you use a project's name instead of full path from most other commands.\nThis command lets you remove projects from it.",
                    [
                        [
                            "<project>",
                            null,
                            "Path to the project to be removed.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "list":
            LogStuff(
                formatCmdWithTitle(
                    "'list' shows your project list.",
                    "Your project list is used to:\n- Bulk-run several maintenance tasks (like cleaning, linting, etc.) at once, via 'clean'.\n- Let you use a project's name instead of full path from most other commands.\nThis command shows you the list.",
                    [
                        [
                            "[filter]",
                            null,
                            "You can use a [filter], either --ignored or --alive to filter ignored projects.\n(With --alive, only NOT ignored projects are shown, with --ignore, vice versa).",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "build":
            LogStuff(
                formatCmdWithTitle(
                    "'build' simplifies building your project",
                    "You can define one or more 'build' commands from your fknode.yaml.\nThis command runs them one by one, showing progress.\nIf any of those fails, the entire process is aborted.",
                    [
                        [
                            "[project]",
                            null,
                            "Project to build. Defaults to the current working directory.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "launch":
            LogStuff(
                formatCmdWithTitle(
                    "'launch' quickly launches your project with all you need",
                    "This launches your code editor with the given project opened.\nIt also runs a specific command (e.g., 'npm run start') if specified in your fknode.yaml.",
                    [
                        [
                            "[project]",
                            null,
                            "Project to launch. Defaults to the current working directory.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "stats":
            LogStuff(
                formatCmdWithTitle(
                    "'stats' displays some stats about your project",
                    "This shows basic stats (like number of dependencies) for your project.\nIn supported platforms, also compares your project's main file (e.g., the package.json) to a set of recommendations.",
                    [
                        [
                            "[project]",
                            null,
                            "Project to show stats for. Defaults to the current working directory.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "settings":
            LogStuff(
                formatCmdWithTitle(
                    "'settings' lets you manage app configurations and more.",
                    "This commands holds subcommands to manage your settings.\nYou can change any setting, or reset them all to their default value.\nYou can also cleanup old internal files from here, to save up space.",
                    [
                        [
                            "flush <f> [--force]",
                            null,
                            "Flushes (removes) chosen config files.\nSpecify what to remove by setting <f> to either:\n'logs' (logging files), 'updates' (update data), 'projects' (all added projects), or 'all' (everything).\nYou can pass --force to skip confirmation.",
                        ],
                        [
                            "repair",
                            null,
                            `Resets all settings to their default value.`,
                        ],
                        [
                            "change <s> <v>",
                            null,
                            "Allows to change chosen setting, <s>, to given value, <v>.\nWhen you run 'settings' with no args, you'll see all settings and their key.\n(The key is the gray, cursive, code-like word at the end).\nThat's the name you'll use for <s>.",
                        ],
                    ],
                ),
            );
            break;
        case "kickstart":
            LogStuff(
                formatCmdWithTitle(
                    "'kickstart' allows you to easily kickstart a remote project.",
                    "This command clones a remote repository, installs dependencies, sets up the project, and launches your code editor with it.\nNeedless to say, it also adds it to your project list.",
                    [
                        [
                            "<git-url>",
                            null,
                            "Git repository to clone. It can be a URL or a scope.\nScopes like 'gh' for GitHub, 'gl' for GitLab, etc. are supported.\nRun 'compat kickstart' to see a list of supported scopes.",
                        ],
                        [
                            "[path]",
                            null,
                            'Where to clone the repository. Otherwise, defaults to "./<repo-name>".',
                        ],
                        [
                            "[manager]",
                            "<git-url> [path] [manager]",
                            "Manager to use when installing dependencies. If not set, will default to whatever lockfile the cloned repo has.",
                        ],
                    ],
                ),
            );
            break;
        case "migrate":
            LogStuff(
                formatCmdWithTitle(
                    "'migrate' helps you migrate projects from a pkg manager to another",
                    "This is a simple automation, since all package managers understand each other nowadays.\nIt just speeds up the process by needing to run a single command instead of several.",
                    [
                        [
                            "<project>",
                            null,
                            "Project to be migrated.",
                        ],
                        [
                            "<target>",
                            null,
                            "Target package manager (npm, pnpm, yarn, deno, or bun).\nWe rely on each manager's ability to understand the other one.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "audit":
            LogStuff(
                formatCmdWithTitle(
                    "'audit' audits projects for you and helps you understand vulnerabilities",
                    "This will run the 'audit' command for the given project, or all projects if no project is specified.\nIt will then ask questions to determine if found vulnerabilities are actually concerning.\n\nA simple example is:\nIf a vulnerability related to HTTP appears, but you state not to use HTTP requests at all, it won't be considered a concern.",
                    [
                        [
                            "[project | --]",
                            null,
                            "Project to audit. Leave empty or set to '--' to audit all projects.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "surrender":
            LogStuff(
                formatCmdWithTitle(
                    "'surrender' allows you to deprecate a project easily.",
                    "This is a fun one. It automates the process of deprecating that project you know you won't ever release...\nIt randomly chooses a deprecation notice, lets you add:\n- a message\n- an alternative to this tool\n- a URL to somewhere to learn more about this\nThen it creates a deprecation notice in the project's README, and commits it.",
                    [
                        [
                            "<project>",
                            null,
                            "Path to the project to surrender. Use '.' for the current working directory.",
                        ],
                        [
                            "[message]",
                            null,
                            "Optional message to add to the deprecation notice.",
                        ],
                        [
                            "[alternative]",
                            null,
                            "Optional message to any alternative to this tool.\nIf any, we recommend adding a link to it.",
                        ],
                        [
                            "[learn-more-url]",
                            null,
                            "An optional URL to wherever you can learn more about this deprecation.",
                        ],
                        [
                            "--github, --gh",
                            null,
                            "If passed, the deprecation notice will use GitHub Flavored Markdown.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "compat":
            LogStuff(
                formatCmdWithTitle(
                    "'compat' shows compatibility info",
                    "If used with no args, shows a table indicating what features work where (NodeJS, Bun, Deno, Rust, and Golang).\nIf you specify a feature, it shows more specific details related to that feature's compatibility.",
                    [
                        [
                            "[feature]",
                            null,
                            "Specific feature to show all info about.\nIf not given, a basic summary of all features is shown.",
                        ],
                    ],
                ),
            );
            break;
        case "commit":
            LogStuff(
                formatCmdWithTitle(
                    "'commit' auto runs specific tasks (like a test suite) and commits only if they succeed.",
                    "This is language agnostic, by the way. It runs a user-defined command (likely your test suite) and commits ONLY if it succeeds.\nIt also prevents committing files you forgot you had staged, by default (avoid this with '--keep-staged').",
                    [
                        [
                            "<message>",
                            null,
                            'Commit message. Must be quoted ("commit message").',
                        ],
                        [
                            "<files...>",
                            null,
                            "A list of files or directories to be staged.\nYou can use -A to stage all changed files.\nIMPORTANT: Either an empty flag ('--') or the --branch flag indicate the end of the files list.",
                        ],
                        [
                            "--keep-staged",
                            null,
                            "If any file was staged before running the command, it'll keep it staged.\nBy default we unstage everything so only what you specify here is committed.",
                        ],
                        [
                            "--branch [branch]",
                            null,
                            "Branch to commit too. If not given, default branch is used.\nThis is a delimiter. All strings between the commit message and the --branch flag are considered files to be staged.",
                        ],
                        [
                            "--push",
                            null,
                            "If passed, pushes the commit to the remote repository after making it.",
                        ],
                        [
                            "--yes",
                            null,
                            "By default we show a confirmation to ensure you want to proceed.\nRun with --yes to skip this confirmation.",
                        ],
                    ],
                ),
            );
            break;
        case "release":
        case "publish":
            LogStuff(
                formatCmdWithTitle(
                    "'release' releases an npm or jsr package for you",
                    "This updates the version in the package file for you and runs a user-defined release script.\nThen, (unless using a dry run), it publishes to npm or jsr.",
                    [
                        [
                            "<version>",
                            null,
                            "Version to be released. Must be SemVer compliant.",
                        ],
                        [
                            "<project>",
                            null,
                            "Optional. Uses this path instead of the current working directory.",
                        ],
                        [
                            "--push",
                            null,
                            "Since code changes (and thus a commit) are made, you can pass this flag to push those changes to remote.",
                        ],
                        [
                            "--dry",
                            "<project> <version> [--push] [--dry]",
                            "Make everything (commit, run release script, even push), but without publishing to npm / jsr.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "export":
            LogStuff(
                formatCmdWithTitle(
                    "'export' lets you see your project's CPF, meant for debug",
                    `The ${APP_NAME.CASED} Common Package File (FnCPF) is a fancy name for a common structure we convert all package files into.\nIt's useful to debug - as if this file shows content differences with your package file, there's likely a bug in our source code.`,
                    [
                        [
                            "<project>",
                            null,
                            "Project to show the CPF for. Defaults to the current working directory.",
                        ],
                        [
                            "--json",
                            null,
                            "Default format is YAML, use --json to use JSONC format instead.",
                        ],
                        [
                            "--cli",
                            null,
                            "If passed, the output (which is written to a file btw), wil also be shown in the terminal.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "setup":
            LogStuff(
                formatCmdWithTitle(
                    "'setup' lets you quickly add a pre-made setup file.",
                    "Provides a set of pre-made setup files for you to use.\nYou can run it with no args to see available setups, or specify one to add it to a project.\nIncludes setups for tsconfig, gitignore, fknode, and other files.",
                    [
                        [
                            "<setup>",
                            null,
                            "Setup to use. Run 'setup' with no args to see available setups, with their name.",
                        ],
                        [
                            "<project>",
                            null,
                            "Project to add the setup to. Defaults to the current working directory.",
                        ],
                    ],
                ),
            );
            projectReminder();
            break;
        case "upgrade":
            LogStuff("Checks for updates. Takes no arguments.\nAs of now, updates need to be installed manually. Data won't be lost.");
            break;
        case "about":
            LogStuff("Shows a simple (but cool looking!) about screen. Takes no arguments.\nIncludes a bunch of info, and a randomized quote.");
            break;
        case "tip":
            LogStuff("Shows a randomized pro-tip related to the app.");
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
                "Run 'help <command-name>' to get help with a specific command.",
                "bulb",
                "bright-yellow",
            );
            break;
    }
}
