// the things.
import TheCleaner from "./commands/clean.ts";
import TheLister from "./commands/list.ts";
import TheStatistics from "./commands/stats.ts";
import TheMigrator from "./commands/migrate.ts";
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
import { defineProgram } from "@optique/core/program";
import { object, or } from "@optique/core/constructs";
import { commandLine, message, metavar, optionName } from "@optique/core/message";
import { argument, command, constant, flag, option } from "@optique/core/primitives";
import { choice, string, url } from "@optique/core/valueparser";
import { path, run } from "@optique/run";
import { multiple, optional } from "@optique/core/modifiers";
import { table, testFlag, testFlags } from "@zakahacecosas/string-utils";
import { DEBUG_LOG, ErrorHandler } from "./functions/error.ts";
import { LOCAL_PLATFORM } from "./platform.ts";
import { parse } from "@std/path";
import { RunScheduledTasks } from "./functions/schedules.ts";
import { FreshSetup, GetUserSettings } from "./functions/config.ts";
import { CleanupProjects, GetAllProjects, ListManager } from "./functions/projects.ts";
import { LaunchWebsite } from "./functions/http.ts";
import { HINTS } from "./functions/phrases.ts";
import { LogStuff } from "./functions/io.ts";
import { brightBlue } from "@std/fmt/colors";
import { shuffle } from "@zakahacecosas/entity-utils";
import { SetupUnixMan } from "./functions/man.ts";

export const FuckingNodeMeta = {
    version: DenoJson.default.version,
    brief: message`A CLI to automate headache giving tasks and make it easier to develop in NodeJS, Deno, or Bun.`,
    description:
        message`The FKN project tries to make various small tasks that we deal with every day during the software development cycle as efficient to tackle as viable. It is a simple CLI that shortcuts and adds easier-to-use wrappers over stuff like Git clones, editor launches, project builds and more. You can learn more about it on <https://fuckingnode.github.io/>`,
    author: message`ZakaHaceCosas <https://me.zhc.es/>`,
    bugs: message`Report bugs at https://github.com/FuckingNode/FuckingNode/issues`,
    footer: message`Visit https://fuckingnode.github.io for more info.`,
};

const CleanerOptions = {
    projects: optional(
        multiple(argument(
            string({
                metavar: "PROJECT(S)",
            }),
            {
                description: message`Project(s) to be cleaned. When omitted, bulk-cleans all added projects.`,
            },
        )),
    ),
    pretty: option("-p", "--pretty", {
        description:
            message`Prettify the project's code. You should specify a prettifying script in your fknode.yaml file. If absent, defaults to Prettier if installed or skipping this if otherwise.`,
    }),
    lint: option("-l", "--lint", {
        description:
            message`Lint the project's code. You should specify a linting script in your fknode.yaml file. If absent, defaults to ESLint if installed or skipping this if otherwise.`,
    }),
    commit: option("-c", "--commit", {
        description: message`Commit any changes made (via, e.g., ${optionName("-p")} or ${
            optionName("-u")
        }) ONLY IF ${'"commitActions"'} is set to true in your fknode.yaml AND local working tree was clean before we touched it AND local repo is not behind upstream. It uses a default commit message; override it by setting ${'"commitMessage"'} in your fknode.yaml.`,
    }),
    destroy: option("-d", "--destroy", {
        description:
            message`Destroys files and DIRs specified by you in the fknode.yaml. Useful for stuff like (e.g. 'dist/', 'out/', etc...). Cannot be undone, ignores any 'Send to Trash' system API.`,
    }),
    update: option("-u", "--update", {
        description: message`Updates all your projects before cleaning them.`,
    }),
} as const;

const CommitterOptionsA = {
    type: constant("commit"),
    message: argument(
        string({
            metavar: "COMMIT-MSG",
        }),
        {
            description: message`Commit message. Required.`,
        },
    ),
} as const;
const CommitterOptionsB = {
    branch: optional(option(
        "-b",
        "--branch",
        string({
            metavar: "BRANCH",
        }),
        {
            description: message`Branch to commit to. If not given, currently active branch is used.`,
        },
    )),
    keepStaged: optional(option("-k", "--keep-staged", {
        description:
            message`If any file was staged before running the command, it'll keep it staged.\nBy default we unstage everything so only what you specify here is committed.`,
    })),
    yes: optional(
        option("-y", "--yes", {
            description: message`By default we show a confirmation to ensure you want to proceed. This skips it.`,
        }),
    ),
    push: optional(option("-p", "--push", { description: message`If passed, pushes the commit to the remote repository after making it.` })),
} as const;

function hasFlag(flag: string, allowQuickFlag: boolean, firstOnly: boolean = false): boolean {
    if (firstOnly === true) return testFlag(Deno.args[0] ?? "", flag, { allowQuickFlag, allowNonExactString: true });
    return testFlags(Deno.args, flag, { allowQuickFlag, allowNonExactString: true });
}

export let SHALL_DEBUG = false;
export let SHALL_CLEAN_OUTPUT = false;
export let SHALL_ASCIIFY_EMOJIS = false;
export let SHALL_LOAD_CFG = true;

if (import.meta.main) {
    if (hasFlag("dbg", false, false) || Deno.env.get("FKNODE_SHALL_WE_DEBUG") === "yeah") SHALL_DEBUG = true;
    if (hasFlag("clear", false, false) || Deno.env.get("FKNODE_CLEAR_OUTPUT") === "yeah") SHALL_CLEAN_OUTPUT = true;
    if (hasFlag("ascii-only", false, false) || Deno.env.get("FKNODE_ASCII_ONLY") === "yeah") SHALL_ASCIIFY_EMOJIS = true;
    if (hasFlag("no-config", false, false) || Deno.env.get("FKNODE_DETACH_CONFIG") === "yeah") SHALL_LOAD_CFG = false;
}

if (SHALL_DEBUG) DEBUG_LOG("Initialized FKNODE_SHALL_WE_DEBUG constant WITH ARGS", Deno.args);

// or() nesting needed for it to not crash out
const parser = or(
    or(
        command(
            "clean",
            object({
                type: constant("clean"),
                intensity: optional(option(
                    "-i",
                    "--intensity",
                    choice(
                        ["normal", "hard", "hard-only", "maxim", "maxim-only"],
                        {
                            metavar: "INTENSITY",
                        },
                    ),
                    {
                        description:
                            message`Either ${"normal"}, ${"hard"}, ${"hard-only"}, ${"maxim"}, or ${"maxim-only"}. Higher intensities yield better (but more time-consuming) results. Omitting this will use your default value (changeable through settings).`,
                    },
                )),
                ...CleanerOptions,
            }),
            {
                brief: message`Cleans up your projects.`,
                description:
                    message`Recursively runs a set of tasks across all of your projects, depending on given flags and project configuration (via fknode.yaml).\nIt's our main feature, base for FuckingNode saving you time.`,
            },
        ),
        command(
            "hard-clean",
            object({
                type: constant("clean"),
                intensity: constant("hard-only"),
                ...CleanerOptions,
            }),
            {
                brief: message`Alias for 'clean' with hard intensity.`,
                description: message`Equivalent to 'clean --intensity hard'. Supports all other flags; exists for you to type a bit less.`,
                aliases: ["global-clean"],
            },
        ),
        command(
            "maxim-clean",
            object({
                type: constant("clean"),
                intensity: constant("maxim"),
                ...CleanerOptions,
            }),
            {
                brief: message`Alias for 'clean' with maxim intensity.`,
                description: message`Equivalent to 'clean --intensity maxim'. Supports all other flags; exists for you to type a bit less.`,
                aliases: ["storage-emergency", "get-rid-of-node-modules", "get-rid-of-node_modules"],
            },
        ),
        command(
            "add",
            object({
                type: constant("add"),
                project: multiple(argument(
                    string({
                        metavar: "PROJECT(S)",
                    }),
                    {
                        description: message`Path(s) to project(s) to be added.`,
                    },
                )),
            }),
            {
                brief: message`Adds projects to your project list.`,
                description:
                    message`Given one or more directory paths, it adds them to the FKN project list. Using this list is optional but very recommended because it makes ${
                        commandLine("fkn clean")
                    } work out of the box with many projects at once AND allows in some places to reference by name rather than project path (as in, given a project named ${"foobar"}, allowing you to do ${
                        commandLine("fkn build foobar")
                    } rather than ${commandLine("fkn build ~/projects/foobar")}).`,
                footer: message`Analog to ${commandLine("fkn rem")}.`,
            },
        ),
        command(
            "rem",
            object({
                type: constant("remove"),
                project: multiple(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                        metavar: "PROJECT(S)",
                        mustExist: true,
                    }),
                    {
                        description: message`Path(s) to project(s) to be removed.`,
                    },
                )),
            }),
            {
                brief: message`Removes projects from your project list.`,
                footer: message`Analog to ${commandLine("fkn add")}.`,
                aliases: ["remove"],
            },
        ),
        command(
            "list",
            object({
                type: constant("list"),
                ignored: optional(
                    flag("-i", "--ignored", {
                        description: message`Only show projects with any degree of divineProtection.`,
                    }),
                ),
                alive: optional(
                    flag("-a", "--alive", {
                        description: message`Only show projects without any divineProtection.`,
                    }),
                ),
            }),
            {
                brief: message`Shows your added project list.`,
                description:
                    message`Your project list is used to:\n- Bulk-run several maintenance tasks (like cleaning, linting, etc.) at once, via 'clean'.\n- Let you use a project's name instead of full path from most other commands.\nThis command shows you the list.`,
                aliases: ["ls"],
            },
        ),
        command(
            "kickstart",
            object({
                type: constant("kickstart"),
                gitUrl: argument(
                    string({
                        metavar: "GIT URL OR ALIAS",
                    }),
                    {
                        description:
                            message`Git repository. Must either be a URL (trailing ".git" is not required) or a Git alias (like ${"gh:option/name"} or ${"gl:option/name"}).`,
                    },
                ),
                path: optional(
                    argument(
                        path({
                            allowCreate: true,
                            mustExist: false,
                            type: "directory",
                            metavar: "DIRECTORY",
                        }),
                        {
                            description:
                                message`Optionally, directory to clone into. If absent, ${"{cwd}/{repo name}"} is used (just like Git).`,
                        },
                    ),
                ),
                manager: optional(
                    // TODO(@ZakaHaceCosas)
                    argument(
                        choice(["npm", "pnpm", "yarn", "deno", "bun"], {
                            metavar: "PKG MANAGER",
                            caseInsensitive: true,
                        }),
                        {
                            description: message`If chosen, this will be used to install dependencies. Omit to infer from repository's files.`,
                        },
                    ),
                ),
            }),
            {
                brief: message`Quickly clones a repo inside [path], installs deps, setups FuckingNode, and launches your code editor.`,
                description:
                    message`This command clones a remote repository, installs dependencies, sets up the project, and launches your code editor with it. Needless to say, it also adds it to your project list.\n\nIf the repository has a FuckingNode post-kickstart script (that exists), it'll ask you whether to run it or not.`,
            },
        ),
        command(
            "docs",
            object({
                type: constant("website"),
            }),
            {
                brief: message`Launches the official site.`,
                description: message`Launches our official website in your web browser and nothing else.`,
                aliases: ["web", "doc", "website"],
            },
        ),
        command(
            "terminate",
            object({
                type: constant("terminate"),
                runtime: argument(
                    string({
                        metavar: "RUNTIME",
                    }),
                    {
                        description: message`Runtime to be uninstalled.`,
                    },
                ),
                projectsToo: option("--motherfuckers-too"),
            }),
            {
                brief: message`Terminates a runtime.`,
                description:
                    message`Terminates a runtime; this is, does a deep uninstall (trying its best so no installation leftovers remain).\n\nIt uninstalls the whole toolchain. For Node.js this includes all package managers that you may have.\n\nWorks by running a shell script (you can check their source on our public code repository).\n\nIf chosen via ${
                        optionName("--motherfuckers-too")
                    } (discouraged!), it will remove from your disk all projects written in said lang. This is useful as projects in a language you are not even using anymore unnecessarily take up storage, though you should use this option with care. Only affects projects tracked by FKN.`,
                aliases: ["fuck-the-lang", "fuck-the-runtime", "ftl", "ftr", "never-again-using", "resign"],
            },
        ),
        command(
            "upgrade",
            object({
                type: constant("upgrade"),
                force: optional(
                    option("-f", "--force"),
                ),
            }),
            {
                brief: message`Upgrades the CLI if needed.`,
                description: message`Checks for updates. If any, tries to auto-update itself.`,
                aliases: ["update", "self-update"],
            },
        ),
        command(
            "build",
            object({
                type: constant("build"),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    {
                        description: message`Project to build. Leave empty to use the one in the CWD.`,
                    },
                )),
            }),
            {
                brief: message`Runs a set of user-defined commands, meant for building your project. If a command fails, it halts.`,
                description:
                    message`You can define one or more 'build' commands from your fknode.yaml. This command runs them one by one, showing progress, and if any of those fails, the entire process is aborted.`,
            },
        ),
        command(
            "cpf",
            object({
                type: constant("cpf"),
                project: optional(argument(
                    path({
                        allowCreate: false,
                        type: "directory",
                    }),
                    {
                        description: message`Project to show the CPF for. Defaults to the current working directory.`,
                    },
                )),
                jsonc: optional(option("-j", "--jsonc", { description: message`Use JSONC format instead of the default (YAML).` })),
                cli: optional(
                    option("-p", "--print", {
                        description: message`If passed, the output will be shown in the terminal regardless of whether ${
                            optionName("--export")
                        } was passed as well or not.`,
                    }),
                ),
                export: optional(option("-e", "--export", {
                    description: message`If passed, the output will be written to a file instead of being shown in the terminal.`,
                })),
            }),
            {
                brief: message`Exports your project's CPF. Helps with debugging.`,
                description:
                    message`The FuckingNode Common Package File (FnCPF) is a fancy name for a common structure we convert all package files into. It's useful to debug - as if this file shows content differences with your package file, there's likely a bug in our source code.`,
                aliases: ["export", "gen-cpf", "generate-cpf"],
            },
        ),
        command(
            "tip",
            object({
                type: constant("tip"),
            }),
            {
                brief: message`Shows a random pro-tip.`,
                description: message`Shows a randomly chosen phrase, likely a useful tip and rarely a "useless" fun message.`,
                aliases: ["hint", "protip", "pro-tip"],
            },
        ),
        command(
            "man",
            object({
                type: constant("man"),
            }),
            {
                brief: message`Sets up man.`,
                description:
                    message`Updates the Unix manpage for FKN. This auto-runs on each update, so you shouldn't really touch it on your own.`,
                hidden: true,
            },
        ),
    ),
    or(
        command(
            "audit",
            object({
                type: constant("audit"),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    {
                        description: message`Project to audit. Leave empty to audit all projects one by one.`,
                    },
                )),
            }),
            {
                brief: message`Runs a security audit and determines if any found vulnerability actually affects your project.`,
                description:
                    message`This will run the 'audit' command for the given project, or all projects if no project is specified. It will then ask questions to determine if found vulnerabilities are actually concerning.\n\nA simple example is:\nIf a vulnerability related to HTTP appears, but you state not to use HTTP requests at all, it won't be considered a concern.`,
            },
        ),
        command(
            "migrate",
            object({
                type: constant("migrate"),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to migrate. Defaults to the current working directory.` },
                )),
                mgr: optional(argument(
                    string({
                        metavar: "PACKAGE MANAGER",
                    }),
                    {
                        description:
                            message`Target package manager (npm, pnpm, yarn, deno, or bun). Note we rely on each manager's ability to understand the other one.`,
                    },
                )),
            }),
            {
                brief: message`Migrates a project from one package manager to another and reinstalls deps.`,
                description:
                    message`This is a simple automation, since all package managers understand each other nowadays.\nIt just speeds up the process by needing to run a single command instead of several.`,
            },
        ),
        command(
            "stats",
            object({
                type: constant("stats"),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to show stats for. Defaults to the current working directory.` },
                )),
            }),
            {
                brief: message`Shows basic statistics for a project and (if viable) compares it against a basic set of recommended standards.`,
                description:
                    message`This shows basic stats (like number of dependencies) for your project.\nIn supported platforms, also compares your project's main file (e.g., the package.json) to a set of recommendations.`,
            },
        ),
        command(
            "settings",
            or(
                object({
                    type: constant("settings"),
                }),
                object({
                    type: constant("settings"),
                    task: optional(argument(
                        string({
                            metavar: "TASK",
                        }),
                        {
                            description: message`Can be any of:\n
                            - flush <f> [--force]\nClears chosen config files. Specify what to remove by setting <f> to either: 'errors' (error log file), 'updates' (update data), 'projects' (all added projects), or 'all' (everything). You can pass --force to skip confirmation.\n\n- repair\nResets all settings to their default value.\n\n- change <s> <v>\nAllows to change chosen setting, <s>, to given value, <v>. When you run 'settings' with no args, you'll see all settings and their key. (The key is the gray, cursive, code-like word at the end). That's the name you'll use for <s>.`,
                        },
                    )),
                    changed: optional(argument(string({
                        metavar: "SET. TO BE CHANGED",
                    }))),
                    val: optional(argument(string({
                        metavar: "VALUE TO CHANGE TO",
                    }))),
                    force: optional(option("-f", "--force")),
                }),
            ),
            {
                brief: message`Allows you to view or change settings. Run it without args to see current settings.`,
                description:
                    message`This commands holds subcommands to manage your settings. You can change any setting, or reset them all to their default value. You can also cleanup old internal files from here, to save up space.`,
            },
        ),
        command(
            "release",
            object({
                type: constant("release"),
                version: argument(
                    string(
                        { pattern: /^\d+\.\d+\.\d+$/, metavar: "VERSION" },
                    ),
                    {
                        description: message`Version to be released. Must be higher than the one in your package file and SemVer compliant.`,
                    },
                ),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to release. Defaults to the current working directory.` },
                )),
                push: optional(
                    option("-p", "--push", {
                        description:
                            message`Since code changes (and thus a commit) are made, you can pass this flag to push those changes to remote.`,
                    }),
                ),
                dryRun: optional(option("-d", "--dry-run", {
                    description: message`Make everything (commit, run release script, even push), but without publishing to npm / jsr.`,
                })),
            }),
            {
                brief: message`Releases a new version of a package for you.`,
                description:
                    message`This updates the version in the package file for you and runs a user-defined release script. Then, granted the script succeeded and not using a dry run, it publishes to npm or jsr.`,
                aliases: ["publish"],
            },
        ),
        command("uncommit", object({ type: constant("uncommit") }), {
            brief: message`Takes the last commit in the CWD and helps you modify it.`,
            description:
                message`This will undo the commit and track its files, so you can edit it. FuckingNode will hang until you hit any key, so it can remake the commit. If a commitCmd exists it'll re-run it as 'commit' would do. Keep in mind you should not quit FuckingNode during the process or things will kinda fuck up.`,
        }),
        command(
            "launch",
            object({
                type: constant("launch"),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to launch. Defaults to the current working directory.` },
                )),
                noIDE: optional(
                    option("-n", "--no-ide", { description: message`If passed, your IDE will not launch, just the launchCmd.` }),
                ),
            }),
            {
                brief: message`Launches your code editor with a specific project and runs a specified command (e.g., "npm run start").`,
                description:
                    message`This launches your code editor with the given project opened. It also runs a specific command (e.g., 'npm run start') if specified in your fknode.yaml's launchCmd.`,
            },
        ),
        command(
            "compat",
            object({
                type: constant("compat"),
                target: optional(argument(string(), {
                    description: message`Specific feature to show all info about. If not given, a basic summary of all features is shown.`,
                })),
            }),
            {
                aliases: ["features"],
                brief: message`Shows an overall summary of support for all features, or details on a specific feature if provided.`,
                description:
                    message`If used with no args, shows a table indicating what features work where (NodeJS, Bun, Deno, Rust, and Golang).\nIf you specify a feature, it shows more specific details related to that feature's compatibility.`,
            },
        ),
        command(
            "dbg",
            object({
                type: constant("dbg"),
                whatTo: argument(
                    choice(["proc", "where", "mem", "who", "root"], {
                        caseInsensitive: true,
                        metavar: "WHAT-TO-DEBUG",
                    }),
                    {
                        description: message`What to show hints for.`,
                    },
                ),
            }),
            {
                brief: message`Gives some hints that could be useful for a contributor to debug the program.`,
                description: message`Takes any of ${["proc", "where", "mem", "who", "root"].join(", ")} as ${
                    metavar("WHAT-TO-DEBUG")
                } and shows some hints related to that. ${"proc"} for example shows PID and PPID, ${"mem"} shows some memory-related stuff, ${"who"} shows hostname info, etc...`,
            },
        ),
        command(
            "details",
            object({
                type: constant("details"),
            }),
            {
                brief: message`Show version details.`,
            },
        ),
        command(
            "repo",
            object({
                type: constant("repo"),
            }),
            {
                brief: message`URL to the code repository.`,
                description: message`Shows the URL to our open source repository. Also, auto-launches it on your browser if possible.`,
                aliases: ["gh", "github", "repository", "source", "oss"],
            },
        ),
        command(
            "about",
            object({
                type: constant("about"),
            }),
            {
                brief: message`Shows a simple (but cool looking!) about screen.`,
                description:
                    message`Shows a cool looking screen with details about the compilation, the project overall, and a randomized quote.`,
            },
        ),
        command(
            "sokoballs",
            object({
                type: constant("sokoballs"),
            }),
            {
                hidden: true,
            },
        ),
        command(
            "setup",
            object({
                type: constant("setup"),
                setup: argument(string(), {
                    description: message`Name of the setup to use.`,
                }),
                project: optional(argument(
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to apply this setup to. Defaults to the current working directory.` },
                )),
            }),
            {
                aliases: ["configure", "preset"],
                brief:
                    message`Adds a template for typical config file (tsconfig, gitignore,...) for you. Run with no args to see available setups.`,
                description:
                    message`Provides a set of pre-made setup files for you to use. You can run it with no args to see available setups, or specify one to add it to a project. Includes setups for tsconfig, gitignore, fknode, and other files.`,
            },
        ),
        command(
            "surrender",
            object({
                type: constant("surrender"),
                message: optional(
                    argument(string({ metavar: "MESSAGE (TEXT)" }), {
                        description: message`Optional message to add to the deprecation notice. Write anything you wish.`,
                    }),
                ),
                alternative: optional(argument(string({ metavar: "ALTERNATIVE (TEXT)" }), {
                    description:
                        message`Optional message explaining any alternative to this tool. If provided, we recommend adding a link to it.`,
                })),
                learnMore: optional(argument(
                    url({
                        allowedProtocols: ["https:"],
                        metavar: "LEARN-MORE-URL",
                    }),
                    {
                        description: message`An optional URL to wherever you can learn more about this deprecation.`,
                    },
                )),
                project: optional(option(
                    "-p",
                    "--project",
                    path({
                        type: "directory",
                        allowCreate: false,
                    }),
                    { description: message`Project to surrender. Defaults to the current working directory.` },
                )),
                gfm: optional(option("--gh", "--github", {
                    description: message`If passed, the deprecation notice will use GitHub Flavored Markdown.`,
                })),
                glm: optional(option("--gl", "--gitlab", {
                    description: message`If passed, the deprecation notice will use GitLab Flavored Markdown.`,
                })),
            }),
            {
                aliases: [
                    "deprecate",
                    "give-up",
                    "i-give-up",
                    "its-over",
                    "i-really-hate",
                    // these are the wildest imho:
                    "im-done-with",
                    "nevermind",
                ],
                brief: message`Deprecates a project, optionally leaving a [message], an [alternative], and a [learn-more-url].`,
                description:
                    message`This is a fun one. It automates the process of deprecating that project you know you won't ever release...\nIt randomly chooses a deprecation notice, lets you add:\n- a message\n- an alternative to this tool\n- a URL to somewhere to learn more about this\nThen it creates a deprecation notice in the project's README, and commits it. Note that messages are position-based, so to skip [message] and only write alternative for example, pass an empty string ("") to [message].`,
            },
        ),
    ),
    or(
        command(
            "commit",
            or(
                object({
                    ...CommitterOptionsA,
                    files: multiple(
                        argument(
                            path({
                                metavar: "FILES",
                                mustExist: false,
                                type: "either",
                            }),
                            {
                                description: message`List of files and directories to be staged. You can use -A to stage all files.`,
                            },
                        ),
                        { min: 1 },
                    ),
                    ...CommitterOptionsB,
                }),
                object({
                    ...CommitterOptionsA,
                    files: option("-A", {
                        description: message`Stage all files in the workspace.`,
                    }),
                    ...CommitterOptionsB,
                }),
            ),
            {
                brief: message`Makes a commit with the given <message> only if a specific task succeeds, (to [branch], if specified).`,
                description:
                    message`This is language agnostic, by the way. It runs a user-defined command (likely your test suite) and commits ONLY if it succeeds. It also prevents committing files you forgot you had staged, by default (avoid this with ${
                        optionName("--keep-staged")
                    }).`,
            },
        ),
    ),
);

// deno-lint-ignore no-slow-types
export const FuckingNode = defineProgram({
    parser,
    metadata: {
        name: "fkn",
        ...FuckingNodeMeta,
    },
});

async function main(): Promise<void> {
    const out = run(FuckingNode.parser, {
        help: { command: true },
        ...FuckingNodeMeta,
    });

    if (out.type === "details") {
        return console.log(
            `FuckingNode v${DenoJson.default.version} built for ${Deno.build.target}\nDeno JavaScript runtime ${Deno.version.deno} | TypeScript ${Deno.version.typescript} | V8 Engine ${Deno.version.v8}\nRun 'fkn about' for details.`,
        );
    } else if (out.type === "dbg") {
        if (out.whatTo === "proc") {
            console.log(
                table([
                    {
                        "Process name": new TextDecoder().decode(
                            LOCAL_PLATFORM.SYSTEM === "msft"
                                ? new Deno.Command("powershell", {
                                    args: ["Get-Process", "-Id", Deno.pid.toString()],
                                }).outputSync().stdout
                                : new Deno.Command("ps", {
                                    args: ["-p", Deno.pid.toString(), "-o", "comm="],
                                }).outputSync().stdout,
                        ).trim(),
                        "Process ID": Deno.pid,
                        "Parent Process ID": Deno.ppid,
                    },
                ]),
            );
        } else if (out.whatTo === "where") {
            console.log(
                table([{
                    "CWD": Deno.cwd(),
                    "execPath": Deno.execPath(),
                    "import.meta.url": import.meta.url,
                    "Is it main?": import.meta.main ? "Yes" : "No",
                }]),
            );
        } else if (out.whatTo === "mem") {
            const mem = Deno.memoryUsage();
            console.log(table(
                [Object.fromEntries(
                    Object.entries(mem)
                        .map(
                            ([k, v]) => [k, `${(v / 1024 / 1024).toFixed(2)} MB`],
                        ),
                )],
            ));
            console.log(
                "(Note: For properly testing CLI performance, your system's resource manager or the repository's benchmarks are better).",
            );
        } else if (out.whatTo === "who") {
            console.log(table([{
                ...Deno.build,
                standalone: Deno.build.standalone.toString(),
                hostname: Deno.hostname(),
            }]));
        } else {
            console.log(parse(Deno.execPath()).dir);
        }
        return;
    }

    if (out.type === "clean") {
        return await TheCleaner({
            flags: {
                commit: out.commit,
                destroy: out.destroy,
                lint: out.lint,
                prettify: out.pretty,
                update: out.update,
            },
            parameters: {
                intensity: out.intensity ?? (GetUserSettings())["default-intensity"],
                project: !out.projects || out.projects.length === 0 ? 0 : out.projects,
            },
        });
    }
    if (out.type === "add") return await ListManager("add", out.project);
    if (out.type === "remove") return await ListManager("rem", out.project);
    if (out.type === "list") return await TheLister(out.alive ? "alive" : out.ignored ? "ignored" : undefined);
    if (out.type === "terminate") {
        // TODO(@ZakaHaceCosas): unnode, unbun, etc...
        return await TheTerminator({
            runtime: out.runtime,
            projectsToo: out.projectsToo,
        });
    }
    if (out.type === "launch") {
        return await TheLauncher({
            project: out.project,
            noIDE: out.noIDE ?? false,
        });
    }
    if (out.type === "build") {
        return await TheBuilder({
            project: out.project ?? Deno.cwd(),
        });
    }
    if (out.type === "release") {
        return await TheReleaser({
            version: out.version,
            project: out.project ?? Deno.cwd(),
            push: out.push ?? false,
            dry: out.dryRun ?? false,
        });
    }
    if (out.type === "audit") {
        return await TheAuditer({
            project: out.project,
        });
    }
    if (out.type === "compat") {
        return TheCompater({
            target: out.target,
        });
    }
    if (out.type === "migrate") {
        return await TheMigrator({ projectPath: out.project ?? Deno.cwd(), wantedManager: out.mgr });
    }
    if (out.type === "cpf") {
        return await TheExporter({
            project: out.project ?? Deno.cwd(),
            jsonc: out.jsonc ?? false,
            cli: out.cli ?? false,
            export: out.export ?? false,
        });
    }
    if (out.type === "kickstart") {
        return await TheKickstarter({
            gitUrl: out.gitUrl,
            path: out.path,
            manager: out.manager,
        });
    }
    if (out.type === "tip") {
        LogStuff(`Here's a pro tip!`);
        LogStuff(
            brightBlue(shuffle(HINTS)),
        );
        return;
    }
    if (out.type === "repo") {
        LogStuff(
            `Free and open source, and free as in freedom, live at https://fuckingnode.github.io/repo\n(The above URL is a redirect to GitHub.)`,
            "bulb",
        );
        LaunchWebsite(`https://fuckingnode.github.io/repo`);
        return;
    }
    if (out.type === "setup") {
        return await TheSetuper({
            setup: out.setup,
            project: out.project,
        });
    }
    if (out.type === "sokoballs") {
        return LaunchWebsite(
            Math.random() > 0.5
                ? "https://tenor.com/view/sokora-sokodunk-sokoballs-sokora-dunk-dunk-gif-9264211909049323587?quality=lossless"
                : "https://tenor.com/view/sokora-dunk-ice-skate-ice-dunk-balling-gif-7665972654807661282?quality=lossless",
        );
    }
    if (out.type === "man") {
        if (LOCAL_PLATFORM.SYSTEM === "msft") LogStuff("You are on Windows, why the hell would you want to setup a manpage?");
        else SetupUnixMan();
        return;
    }
    if (out.type === "website") {
        LogStuff(`Best documentation website for best CLI, live at https://fuckingnode.github.io/`, "bulb");
        return LaunchWebsite("https://fuckingnode.github.io/");
    }
    if (out.type === "commit") {
        return await TheCommitter({
            message: out.message,
            files: typeof out.files === "boolean" ? "A" : out.files,
            branch: out.branch,
            push: out.push ?? false,
            keepStagedFiles: out.keepStaged ?? false,
            y: out.yes ?? false,
        });
    }
    if (out.type === "settings") {
        if (!("task" in out)) return await TheSettings({ args: [] });
        if (out.task?.toLowerCase() === "change") return await TheSettings({ args: ["change", out.changed ?? "", out.val ?? ""] });
        return await TheSettings({ args: [out.task ?? "", out.changed ?? "", out.force ? "--force" : ""] });
    }
    if (out.type === "uncommit") return await TheUncommitter();
    if (out.type === "stats") return await TheStatistics(out.project);
    if (out.type === "surrender") {
        return await TheSurrenderer({
            project: out.project,
            message: out.message,
            alternative: out.alternative,
            learnMoreUrl: out.learnMore,
            gfm: out.gfm ?? false,
            glfm: out.glm ?? false,
        });
    }
    if (out.type === "upgrade") return await TheUpdater({ silent: false, force: out.force ?? false });
    if (out.type === "about") return await TheAbouter();
}

if (import.meta.main) {
    try {
        await FreshSetup();
        await RunScheduledTasks();
        await CleanupProjects(GetAllProjects());
        await main();
        Deno.exit(0);
    } catch (e) {
        ErrorHandler(e);
    }
}
