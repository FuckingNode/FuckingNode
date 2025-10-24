<!-- markdownlint-disable MD024 -->

# FuckingNode Changelog

All notable changes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Dates are in the DD-MM-YYYY format.

## Unreleased

### Added

- Added the ability to `fklaunch` with `--no-ide` so the IDE doesn't start up.
- Added runtime-agnosticness to `build`.
- Added runtime-agnosticness to CmdSets, so they can be used anywhere.

### Changed

- Now some FknError codes were moved, removing the `External__` category.

### Fixed

- Fixed `build` not properly handling errors.
- Fixed CmdSets crashing if either `msft` or `posix` isn't explicitly defined. It now assumes the value is null.
- Fixed `compat` compatibility table being out of date.
- Fixed `launch` and `commit` not being _actually_ agnostic, and made runtime-agnostic features more reliable overall.
- Fixed error logs having so much unnecessary whitespace.

## [5.0.2] (18-10-2025)

### Added

- Added `--force` flag to `update` to force a reinstall.
- Added the ability to use `fkcommit` with any repo, even if not a supported stack.
  - If stack is unsupported (not JS/Go/Rust), `fknode.yaml` won't work and neither will `commitCmd`. We might address this on the next release.

### Changed

- Installer shell scripts will no longer ask for confirmation before adding `fk`-shortcuts, they just will proceed.

### Fixed

- Fixed CmdSets not properly handling `null` values in Cmd objects.
- Fixed the CLI crashing when unable to send Linux notifications instead of silently failing (as expected).
- Fixed user IDE (at least VSCode) not launching on Linux.
- Fixed the updater not properly working on Windows. As a side effect, it'll launch a separate PowerShell instance for updating itself.
- Fixed the output of `kickstart` not being fully consistent. As a side addition, it now tells you whether it's installing with the package manager you expected or with a fallback (and what type of fallback).

## [5.0.1] (04-10-2025)

### Changed

- Now output for the cleaner command looks more organized and consistent.
- Now, if for whatever reason you kickstart a project in an already added path (which is rare), kickstart won't exit and it'll finish setup.

### Fixed

- Fixed migrate doing some duplicate validations.
- Fixed Cmds properly ignoring double quotes but not single quotes.
- Fixed Cmds removing the last character if only the first one was a quote.
- Fixed some errors (especially interop/golang ones) being inconsistent or lacking info in the error message.
- Fixed `terminate` not removing Deno and Bun from PATH.
- Fixed website launch not working on Windows.

## [5.0.0] (28-09-2025)

### Added

- Added a new, common interface for command automation (`commitCmd`, `launchCmd`, etc...). Now everything runs the on `CmdSets`, which are much more powerful + are also consistent across cmds.
- Added a new `terminate` command (with many aliases) that uninstalls a runtime (literally) and removes leftovers, if any.
- Added an option to customize (in milliseconds) the threshold for notifications.
- Added the option to use GLFM instead of GFM for `surrender` (via `--gitlab/-gl`).
- Added `deprecate` and `nevermind` as aliases to `surrender`.
- Added the ability for the CLI to update itself when running `update`. _Yes, it now properly works._
- Added an `--export` option to `export`; if not provided the default behavior is to just show it in terminal instead of writing it.
- Added a 3 second countdown to `surrender`, giving you time to rethink and quit the program.
- Added spreading to `add` and `remove`, allowing you to `fkadd project1 project2 project3` from one command.
- Added spreading to `clean` too, so you can use `--projects` to cleanup several projects at once. When not using it, behavior should not break.
- Added removal of `target/` on Rust projects for maxim cleanup.
- Added more setups to `setup`.
- Added the ability to make the cleaner immediately stop upon an error instead of collecting them as "statistics", via both project settings and global settings. Global setting affects hard-cleanup too.
- Added more questions to `audit` for improved accuracy.
- Added support for custom `lintScript` and `prettyScript` (prev. `lintCmd` and `prettyCmd`) for Deno.
- While experimental, undocumented, and very very far from complete, FuckingNode 5 exposes for testing purposes an extension runner we're working on for the next major release.
- Added several changes to improve the CLI's performance by a lot.

### Changed

- (Breaking) Renamed `prettyCmd` and `lintCmd` to `prettyScript` and `lintScript`.
- (Breaking) All `fknode.yaml` keys ending in `Cmd` have been updated to a whole different syntax (more verbose, but much more powerful). See documentation for info.
- (Breaking) Now setting keys were changed and use dashes, much more common for CLIs (and also makes keys consistent with what you see when running `settings`).
- (Breaking) Now `export` expects `--jsonc` and not `--json` to be passed, matching the output filetype.
- (Breaking) FnCPF spec slightly changed. Starting with V5 this spec will be publicly documented.
- (Breaking) Annoyingly (but to avoid confusion), the default package manager is now `npm`.
- (Breaking) Now, to use the destroyer with all intensities, use just `"*"` and not an array containing `"*"`.
- Now Git errors should be much more properly handled and reported.
- Now the error dump file should be more readable.
- Now `surrender` templates will take your project's name and use it within the template.
- Now the `about` command plays a typewriter animation.
- Now `setup` will search for setups instead of throwing an error when typing an invalid setup name.
- Now workspace handling should be a bit more reliable.

### Fixed

- Fixed `projectEnvOverride` potentially not working if FuckingNode's inference short-circuits the process first.
- Fixed the entire maxim cleanup process failing if just one project doesn't somehow have a `node_modules` DIR.
- Fixed compatibility with Golang projects; now Golang version and dependencies are correctly read (it previously failed to get Golang version, skipped indirect dependencies, and didn't differentiate `github.com` from `pkg.go.dev` dependencies; now it does).
- Fixed a typo in `export`'s help entry.
- Fixed `migrate` and maxim cleanup wrongly attempting to remove `node_modules` from Deno projects.
- Fixed `commit` showing a wrong number in the "and N more" string.
- Fixed Cargo hard cleanup showing both the success and error messages when an error happens.
- Fixed `clean` being error-prone when cleaning specific projects.

### Removed

- (Breaking) Removed `launchWithUpdate` from `fknode.yaml`. Your `launchCmd` now can contain several instructions, so you an move your update command there.
- (Breaking) Removed `launchFile` from `fknode.yaml`. Your `launchCmd` now can have its behavior customized, you directly declare wether a script, a file, both, or none, should run.
- (Breaking) Removed `"disabled"` option from `divineProtection` in `fknode.yaml`. Just don't declare it at all.
- (Breaking) Removed the `logs.log` file, where _everything_ that happened in the CLI was logged. This meant writing to a file every time we wrote to the stdout, slowing the CLI down and taking up unneeded space. This change improves performance.
  - Errors still get logged to the `errors.log` file.
- (Breaking) Removed the `something-fucked-up` command.
- Removed emojis from `surrender` templates. They're not too professional, you know.
- Removed some ASCII arts from `about`.
- Removed the `flush-freq` settings. It's not used anymore as no log file exists.

<!-- Once V5 is done, take the benchmark set and run it on V4.3.0 and compare results. Log the improvement here. -->

## [4.3.0] (26-08-2025)

### Added

- Added even more system notification prompts.
  - Whenever a `buildCmd`, `releaseCmd`, or `commitCmd` fails.
- Added back showing output (not live, of course) to `commitCmd` and `releaseCmd`.

### Changed

- Now the standard, full `FknError` is shown when a `buildCmd` fails, instead of just the message.
- Now, when a package of yours doesn't have a version, it'll always say `@Unknown` instead of `@0.0.0`.
- Now checking for updates doesn't show current version number twice.
- Now a few more FknErrors were given hints to help sort issues out.
- Now hard cleanup shows what actions are actually running.
- Now hard cleanup consistently handles errors across all runtimes.

### Fixed

- Fixed Golang packages showing _two_ warnings when not in a Git repo or no Git tags exist. Now when these "errors" happen, version is assumed to be 'Unknown' and no warning shows up.
- Fixed the informative comment in exported FnCPFs showing the CLI's name and version twice.
- Fixed `FKNDBG_PROC` not working on Windows.
- Fixed a critical mistake where hard cleanup would delete your entire Cargo installation.
- Fixed a theoretical issue where the program would crash if a non-string value was console logged.
- Fixed error messages for some hard cleanup scenarios.

## [4.2.0] (17-08-2025)

### Added

- Added more system notification prompts. They all respect `showNotifications` setting.
  - Whenever a cleaning task (e.g. lint) fails.
  - When a `build` finishes.
- Added (back) showing more details into the final report. It shows what features `divineProtection` prevented (if any) and (this is new) what features failed (if any).

### Changed

- Now the cleanup process should look a bit cleaner in your terminal, we changed spacing and stuff for it to look better.
- Now the "cleanup is limited" notice only shows when the project is actually skipped.
- Now the completion notification tells you if any error happened during cleanup.

### Fixed

- Fixed the help menu displaying `migrate`'s parameters in wrong order.
- Fixed (one last time) `buildCmd`: `stderr` was not being shown when a command failed.

## [4.1.0] (14-08-2025)

_Sort of_ breaking, but nothing important so I won't make a major release.

### Added

- Added settings to enable/disable notifications and their thresholds.
- Added more setups to `setup`.

### Changed

- Now output is not shown live anymore. It gave too many problems as if it's shown live, it cannot be read by the CLI.
- Now, the "report" shown after a cleanup is no longer hidden behind a flag.
- Now threshold for notifications were made the same and reduced to 30 seconds.

### Fixed

- Fixed (FINAL and HOPEFULLY) `buildCmd`.
- Fixed a missing line break causing text to look wrong in `commit`.
- Fixed elapsed time showing 0m 0s sometimes if it only took milliseconds.
- Fixed calculation of elapsed times. [Thanks.](https://stackoverflow.com/a/21294619)

### Removed

- (Breaking) `--verbose` is no longer a feature anywhere. Also, removed the ability to see live output of any command that you run.
  - This was made to fix bugs. Plus, now error dumps should be more likely to have that same output of the erroring command.

## [4.0.2-patch.2] (11-08-2025)

### Fixed

- Fixed `buildCmd` not properly halting execution when a command fails.

## [4.0.2-patch.1] (11-08-2025)

### Fixed

- Fixed a possible crash (detected with the new bulk removal), caused by attempting to manually remove temporary files that may no longer exist.
  - Funnily enough, the fix (which is to stop trying to remove temp files), also implies removing 2 file checks and 1 file read on startup. Minimal but more performance.

## [4.0.2] (11-08-2025)

### Fixed

- Fixed `commit` not properly handling `--keep` and `commitCmd`.
- Fixed `clean` not respecting if you provide an explicit project to be cleaned while using `maxim-only` intensity.
- Fixed some performance optimization issues
  - Checking for validity _each time_ your project list is requested. This check already runs once each time you run any command, rerunning _during work_ is useless. Good impact, several read operations saved up.
  - In some places, the own CLI saves the CWD before changing directories then goes back to it. Made by my old self who didn't know a process' directory changes are independent from the shell's. This has minimal impact, but everything counts.
  - Now bulk-removal operations are done in parallel.
- Fixed `setup` being agnostic (not working in "unsupported platforms"). It's not meant to.
- Fixed hard cleanup quietly continuing without telling you an error happened when it does happen.

## [4.0.1] (09-08-2025)

### Fixed

- Fixed `settings` not working because of wrong input validation.
- Fixed the `defaultManager` setting not being changeable.
- Fixed places that showed elapsed time in any task showing wrong times.
- Fixed the `hard` step of cleanup not running when intensity is `maxim` (which is higher).
- Fixed cleanup saying "All your projects were cleaned" when there's just one.
- Fixed `remove` doing an unnecessary function call, wasting some resources.
- Fixed the CLI crashing when an invalid project manages to make it to the project list. Expected behavior was the project being auto-removed.
- Fixed the `projectEnvOverride` project setting not always being respected.
- Fixed projects with a `@owner/package` type of name not being properly identified on Windows.

## [4.0.0] (08-08-2025)

### Added

- Added the ability to stage files directly from `commit`, removing the need to do `git add` first.
- Added the ability to include previously staged files when `commit`ing with `--keep-staged` / `-k`. **(1)**
- Added the ability to skip the confirmation at `commit` with `--yes` / `-y`.
- Added the ability to bulk-stage all files with `-A` to `commit`, just as in regular `git commit`.
- Added `audit` support for Bun.
- Added a `projectEnvOverride` field to `fknode.yaml` files, to override our project environment inference system.
- Added Cargo support for `release`.
- Added `build` command, which allows the user to define several CLI commands (via the `buildCmd` `fknode.yaml` key, and separated by `^`) to be run one after each other.
  - Added `buildForRelease` key to `fknode.yaml`. If true, calling `release` will first invoke `build`.
- Added a bunch of error codes. Now, all(most) known possible exceptions are a `FknError`, with an identifiable error code. These also have a new documentation page.
- Added system notifications. Tasks that _can_ take 2 minutes or more (as of now: `clean`, `kickstart`, and `migrate`), will send a system notification once done. It'll only appear if the task takes more than a threshold (3 minutes for `clean`, 2 for `kickstart` and `migrate`).

### Changed

- (Breaking) Now `setup` takes FIRST the setup to use, THEN the path of the project. This is for the command to work in the CWD without specifying a path, as explained above.
- (Breaking) Now `release` takes FIRST the version, THEN the path of the project, which is now optional (if not provided, the CWD is used, as explained above).
- Renamed all existing FknError codes.
- Now **(1)** `commit` will unstage previously staged files. This is to avoid committing files you forgot were staged, or were staged, modified, then not staged again. Use `-k` to keep prev. staged files.
- Now `commit` tells more clearly when the commit was aborted due to an error in your `commitCmd`.
- Now the `help` command should look a bit better.
- Now when no path is provided and it makes sense to, the CWD will be used, without needing to specify it.
- Now `package.json` files do not crash the program if no `version` was specified.
- Now glob patterns are supported when seeking for monorepos when adding a project.
- Now we no longer show a "partial support" warning when adding DenoJS or BunJS projects, and when cleaning, "Cleanup is unsupported" was replaced with "This runtime lacks cleanup/deduping commands".
- Now `commit` does not require the CWD to be an added project, making it tech-stack agnostic.
- Now, when using dry-run with `release` (which should mean "no _real action_"), this will actually be respected (before, commits would be made and even pushed despite having this flag). Now with this flag only your `releaseCmd` gets to run.
- Now `release` will always use `--dry-run` with your package manager's release command before publishing, and tell you to check if everything's alright. If you find something wrong, you'll be able to abort.

### Fixed

- Fixed the biggest error of the CLI so far, codenamed ["context mismatch"](https://github.com/FuckingNode/FuckingNode/issues/15) - though it actually was a mutation issue, the CLI was overwriting its own defaults. More info in [#15](https://github.com/FuckingNode/FuckingNode/issues/15).
- Fixed your `commitCmd` not actually working (it did run but with the files staged, AKA unmodifiable, making it stupidly useless). Now, if your commitCmd altered any committed file, these changes will properly reflect in the made commit.
- Fixed the CLI running 3 CLI commands instead of 1 to check if a package manager is installed, consuming more resources and time.
- Fixed several issues with project environment inference.
- Fixed commands with dashes (e.g. `storage-emergency` or `im-done-with`) not working.
- Fixed message for `FknError/Env__CannotDetermine` (prev. `Internal__Projects__CantDetermineEnv`) showing `"root"` instead of the real root of the project.

### Removed

- (Breaking) Removed the `manager` command. Manager subcommands are now standalone commands (`manager add .` is now just `add .`, for example).
- Removed the ability to auto-update from the CLI, because it never really worked. If we get it to work it'll be added back, but for now it's better not to have it than to have a broken implementation.
- Removed `--self`. It's a bit stupid since I somehow never realized passing a dot (`"."`) as a path is equivalent and native, so keeping that extra code in there was useless.

## [3.4.1] (04-05-2025)

### Changed

- Now `FKNDBG` itself doesn't work. Set the environment variable `FKNODE_SHALL_WE_DEBUG` to the string `yeah` in order to show debug logs.
- Now more `FKNDBG_*` commands are available. They just show some debug info, nothing special.
- Now the `about` command looks better. Also, added several random quotes.
- Now `--version` (`-v`) returns colorless output and includes more details (current platform and TS/V8/DENO versioning).
- Now executables are released with fully lowercase names. Casing between Linux and Windows filesystems is really a headache.

### Fixed

- Fixed `launch` showing an error in the CLI (despite working fine) because of a non-existent "`__DISABLE`" task.
- Fixed `audit` miscalculating the score.

## [3.4.0] (22-04-2025)

### Added

- Added linting support to Deno and Cargo. Now when running `fkclean` for these platforms with `--lint`, `-l`, or `flaglessLint` set to true, `deno check .` and `cargo check --all-targets --workspaces` will be used respectively.
- Added Git aliases to `fkstart`. For example, `fkstart gh:ZakaHaceCosas/dev-utils` will translate into `https://github.com/ZakaHaceCosas/dev-utils.git`. 10 Git providers are supported, run `compat kickstart` to see them all.
- Added missing `compat launch` command, listing launch-able IDEs.
- Added more vectors & questions to `audit`.

### Changed

- Now the `setup` command respects earlier indent size on `tsconfig.json` and `.prettierrc` files.
- Now `Cargo.toml` files are better understood, reducing a lot error proneness.

### Fixed

- Fixed a situation where projects _might_ not get added (not awaiting an async function).
- Fixed lint and prettify flags being swapped (`--lint` prettifying and `--pretty` linting).
- Fixed the "not fully supported" warning not showing up for Golang and Rust.
- Fixed a lot of issues with Git URL parsing from the `fkstart` command.
- Fixed the GHSA advisory list in audit containing duplicate entries.
- Fixed initialization checks running twice.
- Fixed `help` not properly taking user input.

## [3.3.0] (13-04-2025)

### Added

- Added Audit V4, a rewrite of the `audit` feature that's JSON based, mathematically more complex and accurate, and finally considered a stable (still NodeJS only) feature.
- Added a `defaultManager` setting for kickstart, letting users define what manager to use by default when none passed. Defaults to `pnpm` if installed; if not, `npm`.

### Fixed

- Fixed `fkclean --self` cleaning all projects instead of only the current one.

### Removed

- Removed an unused, undocumented feature (interop layer versioning).
- Removed `--strict` flag from audit, now all audits are "strict" per se.

## [3.2.1] (11-04-2025)

### Fixed

- Fixed schedules and update checks being one hour ahead. This wasn't causing any trouble _per se_, but it still wasn't right anyway; now it should be.

## [3.2.0] (07-04-2025)

### Added

- Added the ability to run a script/file when launching a project.
- Added `fklist` alias to `fuckingnode manager list`.
- Added two new setups to `fkn setup`
- Added `fkn hint` to randomly show one of the hints / _FuckingProTips_ shown in the about page. A few more hints were added as well.

### Changed

- Now several more methods are sync, for error fixing.
- Now you can specify GitHub URLs without `.git` (`https://github.com/me/my-repo`).
- Now `migrate` _technically_ respects the lockfile's versions.
  - Note it does not actually _read_ the versions from the lockfile _per se_ (as that would take too long on projects with 20K LOC+ lockfiles). It instead uses the `update` command, which typically ensures version coherence.
- Now `fkn repo` and `fkn website` will launch the corresponding URL automatically.

### Fixed

- Fixed the CLI not handling "rootless workspaces" (workspaces where the root itself is not a project - thus lacking `"name"` or `"version"`). Closes issue [#13](https://github.com/FuckingNode/FuckingNode/issues/13).
  - There's a known issue for this - if the workspace lacks a lockfile, this will silently fail and it will not be added even though the CLI will say it did.
- Fixed workspaces sometimes not being detected because of some path handling issues.
- Fixed the CLI never being able to run if an invalid project is mistakenly added _once_.

## [3.1.1] (29-03-2025)

### Added

- Added the ability for the CLI to update itself. From now on, running `fkn upgrade` on outdated installations will download the installer script for the latest version and proceed with the installation.
- Added `stats` Recommended Community Standards for DenoJS. It is _very basic_, though.

## [3.1.0] (03-03-2025)

### Added

- Added new command **launch**, to auto-launch a project by its name & update its dependencies instantly.

### Changed

- Now even more error messages are more descriptive.

### Fixed

- Fixed `kickstart` forcing you into NodeJS package managers + not properly detecting if a manager is installed or not.
- Fixed `surrender` not respecting `updateCmdOverride` when updating.
- Fixed documentation issues (wrong references to upcoming pages, wrong links, broken mermaid...).

## [3.0.1] (03-03-2025)

### Changed

- Now some error messages were made more descriptive.
- Now `commitCmd` and `releaseCmd` show their output.

### Fixed

- Fixed the app not letting you add projects with a `bun.lockb` instead of a `bun.lock` lockfile.
- Fixed `fkcommit` allowing to commit when no files are added.
- Fixed `fkcommit` throwing an unrelated error when trying to commit outside of a repo.
- Fixed installation attempts that fail because of a missing package manager not explaining what's up.
- Fixed a theoretically possible point where a `FknErr` stops execution before running its debug function, preventing it from dumping the error log to the `errors.log` file

### Removed

- Removed (as expected) V2 to V3 config migrator, for the codebase to be cleaner.

## [3.0.0] (02-03-2025)

This release officially elevates the status of FuckingNode from "cool side project" to "main project". A lot of new features were added, a lot of bugs were fixed, and the CLI feels overall more polished.

Acknowledgements to [@MrSerge01](https://github.com/MrSerge01) and [@dimkauzh](https://github.com/dimkauzh) for helping out behind the cameras.

### Breaking changes for v3

- **Order of `clean` arguments swapped:** It's now `clean <project | "--"> <intensity | "--"> [...flags]` instead of `clean <intensity | "--"> <project | "--"> [...flags]`. This was made so the command makes more sense. E.g., `clean my-project hard`.
- **User settings, schedules, and update timestamps will reset once:** Some internal breaking changes force us to do this. This'll only happen once and won't reset your project list.

### Added

- Added a new logo.
- Added **cross-platform support** - Golang and Rust projects can now benefit from FuckingNode (just as with Deno/Bun, unbridgeable features won't work but won't interrupt the flow either). While compatibility is more limited, it's better than nothing.
  - Added a new `export <project>` command to export a project's FnCPF (an internal "file" used for interoperability purposes). If something's not working, it _might_ help out, as it'll show whether we're correctly reading your project's info or not.
- Added a **new command** `release`. Automatically runs a task of your choice, bumps SemVer version from your package file, commits your changes, creates a Git tag, pushes to mainstream, and **automatically publishes to `npm` or `jsr`**, from a single command.
  - `dry-run` and other options are available to prevent Git commit and npm/jsr publish tasks from running, if desired.
  - While the process is fully automated you'll still have to move your hands in these cases (we still save you time with this addition :wink:):
    - Always when publishing to JSR, as you're required to click once in their web UI to authorize the publishing.
    - When publishing to npm having 2FA enabled and required for publishing.
  - `publish` is allowed as an alias to the command.
- Added a **new command** `commit (message) [branch] [--push]` to run any task of your choice before committing, and making the Got commit only if that tasks succeeds.
- Added a **new command** `surrender (project) [message] [alternative] [learn-more-url] [--github]` to deprecate a project (automatically add a deprecation notice, update dependencies one last time, commit and push all changes, and once the project's pushed, remove locally).
- Added a **new command** `setup (project) (template)` to automatically add a template `tsconfig.json` or `.gitignore` file, with more templates to be added. `fknode.yaml` templates exist as well, of course.
- Added a **new command** `something-fucked-up` to completely reset all internal settings except for your project list.
- Added a **new command** `compat (feature)` to show overall compatibility, or compatibility of a specific feature if provided, of the CLI across environments (NodeJS, Bun, Go...).
- Added Bun and Deno support for `migrate` feature.
- Added a new `maxim-only` intensity level. Plus, now `maxim` cleanup should work on per-project cleanup as well.
- Added new shell-based installers (`.ps1` for Windows and `.sh` for macOS and Linux).
- Added an `fknode` CLI shortcut. Equivalent to `fuckingnode`.
- Added `fkclean`, `fkcommit`, `fkadd`, and `fkrem` aliases for `clean`, `commit`, `manager add`, and `manager remove` respectively. They take the same arguments the normal command would do. They're standard `.ps1` / `.sh` scripts, auto-added on installation, and live on the same path as the `fuckingnode` executable.
- Added support for quick flags (or however you call those) for the `clean` command, so `-l` instead of `--lint` for example will work.
- Added recognition of new `bun.lock` file to identify Bun projects.
- Added a new `errors.log` file, stored with all of our config files. Some errors will now dump more detailed info in there.
- Added support for `pnpm` and `yarn` for the audit experiment.
- Added the ability for the CLI to auto-clean invalid entries from your project list, removing the need to do it for yourself.
- Added a "recommended community standards" sort of thing for NodeJS projects in `fuckingnode stats`.

### Changed

- Now error messages for not found / not added projects are consistent.
- Now any generated YAML files by the CLI follow common formatting.
- Now many commands (not all though) are strictly normalized, meaning even stupid things like `fuckingnode mÀnaGëR lÌSt` will work perfectly.
- Now the CLI more reliably tells whether a runtime is installed or not (at the expense of some extra milliseconds).
- Now `audit` experiment's parsing rules are more reliable. _They still have known issues (direct/indirect deps + patched version), but they're internal-only and don't affect usage as of now_.
- Now updating dependencies will always run with `--save-text-lockfile` in Bun.
- Now `migrate` will always update dependencies before running.
- Now `migrate` will back up your project's package file and lockfile.
- Now error handling is more consistent (and also uses less `try-catch` code). (I just learnt that JS errors propagate up to the caller, that's why there we so many damn `catch (e) { throw e }` lines, sorry mb).
- Now when the cleaner's done it says "cleaned all your **JavaScript** projects" instead of "Node" projects. I admit it looks nice as an "easter egg" or something referencing where we come from, but it was not intended to be that, I just forgot to change it.
- Now `settings change <key>` uses the same keys as the config file itself, so everything makes more sense.
  - Saw [breaking changes](#breaking-changes-for-v3) above? One of the reasons for the config reset is that some keys were renamed so you don't type a lot in the CLI because of this change.
- Now you can pass the `--fkn-dbg` flag to enable debug mode. It will output (in some places only) debug logs meant for developers.
- Now internal ENV-related checks (what your system is and whether if internal files are present or not) are more reliable.
- Now error message for non specified project is more clear and up to date.
- Now some base methods (path existence checking, path parsing, internal path getting, project lockfile resolving...) are synchronous. This should not visibly affect performance as the CLI works in a linear flow anyway.
- Now error messages when adding a project & when spotting a project are much more detailed.
- Now when bulk adding workspaces from `manager add`, only one call to `writeTextFile` will be made.
- Now `settings` will show, besides your current settings, their key name so you know what to change.
- Now path handling should be a bit more reliable.

### Fixed

- Fixed `manager add` allowing to add _one_ duplicate of each entry.
- Fixed `manager add` project-env errors being ambiguous. Now they're more specific (missing lockfile, missing path, etc...).
- Fixed `manager list` showing a "no projects exist" message when they do exist but are all ignored.
- Fixed project paths not being correctly handled in some cases.
- Fixed the CLI running init task (check for updates & config files) twice.
- Fixed cleaner intensity being hypothetically case sensitive.
- Fixed cleaner showing elapsed time since the _entire process_ had begun instead of since _that specific project's cleanup_ begun.
- Fixed the CLI adding an odd-looking linebreak before "Cleaning..." when using per-project cleanup.
- Fixed the confirmation for using maxim cleanup.
- Fixed projects not being alphabetically sorted when listing them.
- Fixed Bun projects' config files not being properly read.
- Fixed the app randomly showing "That worked out!" before any other CLI output.
- Fixed schedules running each time you run the CLI after they reach their scheduled run time once (they didn't reset the timer).
- Fixed Report not being shown when using verbose flag & per-project cleanup.
- Fixed `kickstart` not always running the correct install command.
- Fixed `kickstart` throwing `Internal__CantDetermineEnv` with reason "Path _x_ doesn't exist" even though it does exist.
- Fixed `kickstart` throwing `Internal__CantDetermineEnv` with reason "No lockfile present" for lockfile-less projects even if a package manager is specified when running.
- Fixed a bunch of issues with how `kickstart` determined a project's environment and the runtime to work with.
- Fixed how workspaces are shown to the user when found while adding a project.
- Fixed some minor issues with `clean`.
- Fixed FknError `Generic__NonFoundProject` not showing the name inputted (showing instead `trim function`-whatever).
- Fixed FknError `Generic__NonFoundProject` showing up when you pass an empty string as the project (now `Manager__ProjectInteractionInvalidCauseNoPathProvided` shows up instead).
- Fixed `audit` experiment not properly handling vulnerability-less projects (showing `0.00% risk factor` instead of a "no vulns found" message as it should).
- Fixed `audit` showing an empty report table when no projects are vulnerable.
- Fixed `audit` using workspace flags in all npm projects, making workspace-less projects fail.
- Fixed input validation not being precise enough and showing wrong (duplicate) error messages in `migrate`.
- Fixed the CLI sometimes not finding your projects because of string manipulation issues.
- Fixed Git-related commands sometimes not working because of output handling.
  - As as side effect, you now don't get to see Git's output live.
- Fixed the CLI not being able to handle projects that were missing the `name` or `version` field in a `package.json`/`deno.json` file.
- Fixed an edge case where the CLI wouldn't work because it fetched configuration _right before_ having it setup.
- Fixed hard cleanup not respecting verbose logging setting.
- Fixed useless path-related and settings-related function calls, minimally increasing performance.
- Fixed the CLI adding "NOTE: Invalid fknode.yaml" to files that _already_ have the note.
- Fixed the `fknode.yaml` validator having a wrong value set (for whatever unknown reason) for intensities, marking valid config files as invalid and ignoring them.
- Fixed Git not properly adding files for commit, thus failing.
- Fixed `commit` allowing to be used without anything to commit, thus failing.
- Fixed goddamn project validation. You'll find a slightly stricter CLI from now own (requiring you, for example, to add a `"name"` field to a project just to add it).
- Fixed an error being thrown when trying to gitignore stuff in projects without a .gitignore file, it'll now be automatically created.
- Fixed verbose logging making EVERYTHING hidden when running hard cleanup, instead of hiding just what should be considered verbose.
- Fixed paths being lowercased (Linux File System is case-sensitive, so this behavior breaks the app).
- Fixed temp DIR used for hard cleanup not being removed.
- Fixed the annoying "`<project>` has an invalid fknode.yaml!" warning; now we'll silently add a comment to the file.

### Removed

- Removed `manager cleanup`, running it will now show a message telling you we now automate project list cleanup for you.

## [2.2.1] 16-01-2025

### Changed

- Now you don't need to confirm if you want to add Deno or Bun projects.
- Now sync output of command is hidden behind `--verbose`.
- Now project validation can return more error codes (`"CantDetermineEnv"`, `"NoLockfile"`).

### Fixed

- Fixed `--self` not being recognized for per-project cleanup.
- Fixed autocommit not running if committable actions were made through a flagless feature instead of a flagged feature.
- Fixed issues with workspaces:
  - Not validating that workspace arrays exist
  - Not parsing `deno.jsonc` properly.
  - When adding a project, always seeking for `package.json` instead of the runtime's specific main file.

## [2.2.0] 15-01-2025

### Breaking changes

- Update config file has been "reset" (renamed from `*-updates.yaml` to `*-schedule.yaml`). Last update check will be overwritten.

### Added

- Added per-project cleanup.
- Added flagless features, allowing to enable features (e.g. the auto linter) in a per-project basis and without depending on a `--lint` flag.
- Added auto flush for log files, so they're auto cleaned every once in a while. Frequency can be changed.

### Changed

- Renamed `flush updates` to `flush schedule`.

### Fixed

- Fixed `clean --update` updating twice, once ignoring `updateCmdOverride` if present.
- Fixed cleaner and updater messages being messed up (showing "Cleaned ...!" after updating, e.g.).
- Fixed `updateCmdOverride` not being used, because the CLI mixed up "npm run" with "npx" (and the same on all package managers).
- Fixed the app not properly handling changes to what settings are available from one update to another.

## [2.1.0] 14-01-2024

### Added

- Added a **new** experimental **command**: _**audit**_. Currently it's only available for `npm` users and behind the `--experimental-audit` flag. TL;DR it helps you better understand security audits by asking questions, [read more in here](https://fuckingnode.github.io/learn/audit/).
- Added support for more IDEs / code editors as favorite editors (VSCodium, Emacs, Notepad++, Atom).
- Added a `repo` command that shows the URL to GitHub.

### Changed

- Changed `stats` so it displays just the first 5 dependencies and then an "and x more" string. Also removed "Main file:" string.

### Fixed

- Fixed handling of duplicates with `manager cleanup` sometimes misbehaving (either not detecting duplicates or removing duplicates AND the original entry).

## [2.0.3] 08-01-2025

Happy new year btw

### Added

- Added a `documentation` command to show a link to our website, where everything is documented more in-depth.

### Changed

- Now you'll be shown a warning if we couldn't remove a temporary DIR.

### Fixed

- Fixed the app skipping `deno.jsonc`, meaning projects with a `deno.jsonc` and not a `package.json` wouldn't work properly.
- Fixed doing so many path-related operations just to get a project's working env, slightly improving performance.
- Fixed the help command being case sensitive.
- Fixed some useless debug logs being shown.
- Fixed `stats` showing `[object Object]` as the "Main file".

## [2.0.2] 28-12-2024

### Fixed

- Fixed a long standing issue with hard cleanup: it didn't properly detect if you had certain managers like `npm`, skipping them when it shouldn't. _(That has been in there since october :skull:)_.
- Fixed the updater thinking you're on an outdated version when you aren't.
- Fixed settings displaying `autoFlush` related settings (that's not a feature).
- Fixed `kickstart` not knowing where was the project cloned (hence failing).
- Fixed `kickstart` cloning into non-empty DIRs or paths that aren't a DIR (hence, again, failing).
- Fixed `kickstart`'s process being blocked by add confirmation for Deno and Bun projects.

## [2.0.1] 26-12-2024

### Fixed

- This release SHOULD have fixed macOS and Linux compatibility. Report any issues you find, please. Thank you.

## [2.0.0] 25-12-2024 <!-- 2.0.0 - major release, even tho there aren't "breaking" changes (well, adding runtimes that aren't Node to the "FuckingNODE" project is kinda "breaking") -->

### Breaking changes

- `.fknodeignore` becomes `fknode.yaml`, and follows a new format detailed in the `README.md`.
- `self-update` becomes `upgrade`.
- The project list and other config files will "reset" when downloading this update (simply because file names changed from `.json` to `.yaml`). You can recover old data from `C:\Users\YOUR_USER\AppData\FuckingNode\`.
- `manager revive` and `manager ignore` have been removed, as ignoring is now more complex. **You can still ignore projects manually from the `fknode.yaml`**. We will (hopefully) readd ignoring CLI commands in a future release.

### Added

- **Added partial support for cleanup of both the Bun and Deno JavaScript runtimes.**
- Added new capabilities besides cleaning and updating.
  - Automatic linting of projects.
  - Automatic prettifying of projects.
  - Automatic removal of unneeded files (e.g. `dist/`, `out/`, etc...).
  - Added the ability to auto-commit these changes (only if there weren't previous uncommitted changes).
- Added an install script for Microsoft Windows.
- Added the option to flush config files (like `.log`s), so the user can save up space.
- Added the ability to customize whether an ignored project should ignore updates, cleanup, or everything.
- Added much more better support for workspaces, by recognizing `pnpm-workspace.yaml`, `yarnrc.yaml` and `bunfig.toml`.
- Added the ability to only do a hard cleanup (global cache cleanup), by running either `global-clean`, `hard-clean`, or `clean hard-only`.
- Added an about page.
- Added the `--alive` flag to `manager list` so it only lists projects that are not ignored.
- Added a `settings` command which allows to tweak:
  - Update check frequency
  - Default cleaner intensity
  - Favorite editor (for new `kickstart` command).
- Now verbose logging in `clean` will show the time it took for each project to be cleaned.
- Added a `kickstart` command to quickly clone a Git repo and start it up a project.
- Added the ability to override the command used by the `--update` task in `clean`, via `fknode.yaml`.
- Added `stats` as a different command. It's now stabilized and instead of showing a project's size, it shows other relevant data. Many more props to be added in future minor releases.
- Added the ability to use a project's name instead of their path in some cases.
  - For example, `manager remove myProject` instead of `remove "C:\\Users\\Zaka\\myProject"`, as long as the `name` field in `package.json` (or it's equivalent) is set to `myProject`.
- Added support for Linux and macOS (that should actually work). Also, thanks to @dimkauzh, added support for NixOS.

### Changed

- Now `self-update` is called `upgrade`.
- Now all commands show their output fully synchronously, giving the feel of a faster CLI and properly reflecting what is being done.
- Now in some places instead of an "Unknown command" error, the help menu is shown so you can see what commands are valid.
- Now `manager list` shows, if possible, the name of the project from the `package.json`, alongside it's absolute path. Also, now projects are alphabetically sorted by name (by their path if not possible to obtain their name). This also applies to any other listing, like cleaner reports when using `--verbose`.
- Now the CLI has cool looking colors 🙂.
- Now, projects without a `node_modules` DIR won't show a warning before adding them.
- Now, `manager cleanup` will show next to the project's path an error code indicating why it's in there.
- Now the app uses YAML instead of JSON for its config files.
- Now the clean command can be used without providing an intensity (use `--` to pass flags).

### Fixed

- Fixed `clean hard` not working with `npm`, as cache required a `--force` arg.
- Fixed `clean hard` wasting resources by recursively running global commands (like cache cleaning).
- Fixed `clean hard` trying to use, for example, `yarn clean` with users that don't have `yarn` installed.
- Fixed the CLI writing unneeded logs from `npm` / `pnpm` / `yarn` to the `.log` file.
- Fixed the app crashing (unhandled error) upon joining two untraceable paths.
- Fixed the app crashing (unhandled error) upon calling `manager list` and having untraceable paths saved.
- Fixed `clean` writing twice to the `stdout` what cleanup commands would do.
- Fixed many potential unhandled errors at many places.
- Fixed the base directory for app config being recursively created on each run.
- Fixed `manager list` not listing ignored projects (showing an empty list when there are ignored projects).
- Fixed `upgrade` (_`self-update`_) not correctly handling GitHub's rate limit.
- Fixed an issue where naming projects (reading their `name` from `package.json`) would crash the CLI.
- Fixed unreliability when finding out if a project uses Node, Deno, or Bun.
- Fixed projects not being correctly added due to missing `await` keyword.
- Fixed `--help <command>` working but `help <command>` (without `--`) not.
- Fixed the log file being unreadable because it saved `\x1b` stuff.
- Fixed the CLI writing twice the "There's a new version!" message.

### Removed

- `settings schedule`. Due to `Deno.cron()`s limitations, this feature is not viable as of now.
- `manager ignore` and `manager revive` as commands. Since ignoring projects (which is STILL A FEATURE) is now more complex, ignoring from the CLI requires to be remade from scratch. It'll be likely re-added in a future release.

## [1.4.2] 27-10-2024

### Added

- Added `settings schedule <hour> <day>` to schedule FuckingNode, so your projects are automatically cleaned.

### Fixed

- Fixed an issue with path joining that made the app unusable (as it couldn't access config files).

## [1.4.1] 26-10-2024

### Fixed

- Fixed `manager add` not detecting workspaces when an object instead of an array is used.
- Fixed `manager add` not correctly resolving relative paths, such as `../../my-project`.

## [1.4.0] 26-10-2024

### Added

- Added support for monorepos / Node workspaces. When adding a project, now FuckingNode will look through the `package.json`. If `workspaces` are found, it will prompt to add them as separate projects so they get their own cleanup as well.
- Added cleaning levels, adding a new `hard` level and replacing the `--maxim` flag. Now `clean` takes a level, either `clean normal`, `clean hard`, or `clean maxim` (if no level, "normal" will be used as default).
  - `normal` will do the easy: recursively run cleaning commands.
  - `hard` will do what default used to do (clean + dedupe) + it will also clean cache.
  - `maxim` will do what maxim does: forcedly remove `node_modules/` for everyone.
- Added `list --ignored` flag to only list ignored projects.

### Changed

- **Rename some paths used to store program info.**
- Now flag commands like --help or --version are now case unsensitive and all support single dash calls (-help) and 1st letter calls (-h, -v).
- Now `migrate` will install with the new manager before removing the old lockfile. As far as I know some managers can understand other managers' lockfile format, so this will make stuff less likely to fail.

### Removed

- Remove the `--full` arg from `stats`. Now the project itself is always counted.

### Fixed

- Fixed `stats` adding it's self size twice, incorrectly increasing the MB size.
- Fixed paths being always joined as `some/location`, now Deno's `join` function is used to avoid issues.
- Fixed `manager cleanup` not detecting some projects (an error with duplicate handling).
- "Fixed" handling projects with more than one lockfile. For now it'll just skip them to avoid messing up versions. Future versions might add a better handler.

## [1.3.0] 24-10-2024

### Added

- Added `migrate` moves a project from one package to another.
- Added `manager revive` allows to stop ignoring a project (opposite of `manager ignore`)

### Changed

- **Decided to hide `stats` behind `--experimental-stats` due to instability.**
- Updated help menu.
- Now `--self` can be used anywhere you need to pass a path.
  - Also, now `normalize` from `node:path` is used to avoid issues.

### Fixed

- Now `stats` (`--experimental-stats`) will recursively get the size of DIRs within `node_modules/` for more accuracy.
- Now `stats` (`--experimental-stats`) rounds numbers correctly.

### Known issues

- `stats` (`--experimental-stats`):
  - While recursive fetching improved accuracy, it still provides sizes lower than the real one (like hundreds of MBs lower).
  - It takes a _lot_ of CPU.
  - It does throw an error for many files stating that they "cannot be accessed".

## [1.2.0] 21-10-2024

### Added

- Added `manager cleanup` checks the list of projects and validates them. If some project cannot be cleaned, it will prompt you to remove it.
- Added `--self` flag to `manager` commands, so you can use the CWD instead of manually typing a path.

### Changed

- Now `manager add` validates if you want to add paths that are valid but don't make sense (they don't have `package.json` or `node_modules`).

### Fixed

- Fixed an error where the app would throw an error when the user checked for updates too much (AKA reached GitHub's API rate limit).
- Fixed an error where non-existent paths would break `stats`.
- Fixed `manager add` adding a path even if it doesn't exist.
- Fixed an issue where if the `node_modules` DIR wasn't present but the user chose to add the project anyway, it got added twice.
- Fixed an issue where removing a duplicate project would remove it entirely, instead of keeping one entry.
  - Note: it was fixed by making it remove only _once_, so if you have the same entry four times and remove it, you will still have 3 duplicates.

## [1.1.1] - 19-10-2024

### Added

- Added `self-update` so the user can manually check for updates every time he wants to.

### Changed

- Now `manager add` checks if the path exists before adding it.

### Fixed

- Fixed `manager` being broken by a human mistake on previous updates (sorry, mb) and it didn't recognize one word commands like `list`. It has been fixed.
- Fixed `clean` crashing if one of your project's path didn't exist. Now it will log an error and skip it without interrupting the cleanup.
- When auto-checking for updates, the program would consider there are updates if your version number is greater than the one from GitHub - it's unlikely that the end user ever saw this, but it's now fixed.

## [1.1.0] 19-10-2024

### Added

- Added `stats` command. Shows stats, AKA how much storage your projects are taking up. By default only counts the size of `node_modules/`, but you can pass the `--full` flag to it so it also includes your code.
- Added `manager ignore` command. Creates a `.fknodeignore` file at the root of the project, so FuckingNode simply ignores it whenever a cleanup is made.

### Changed

- Replaced the actual f-word with an asterisk-included version (fucking) app-wide. Also made an effort to rename variables and all that kind of stuff. ~~I don't want to get banned~~.
- Now "unknown errors" when pruning a project actually show the command's `stderr`.

### Fixed

- Fixed `manager` sometimes not properly handle wrong arguments. Now it should do.

## [1.0.2] 15-10-2024

### Added

- Added `--maxim` flag to the `clean` command. It will _take cleaning to the max_ (AKA removing `node_modules/` entirely).
- Added additional commands to the cleaner, like `dedupe`, for more in-depth cleaning.
- Added the capability to the CLI of checking for updates by itself. Does it only once every 7 days to save up on the user's resources.

### Changed

- Changed some logs to include emojis.

### Fixed

- Fixed an unhandled error where if you just run `fuckingnode` with no args, you got a TypeError instead of "Unknown command...".
- Now the path you provide for add / remove gets a bit of purification (removing trailing spaces & trailing `/`) to avoid issues.

## [1.0.1] 14-10-2024 <!-- two releases in a day, lol -->

### Added

- Added `--version` flag to the main command.
- Added `--verbose` flag to the `clean` command. Some logs are now hidden behind this flag.
- Added `--help` flag to show basic help about the program.

### Fixed

- Fixed the app losing data from one version to another (now it uses `APPDATA/FuckingNode/*` instead of `APPDATA/FuckingNode-VERSION/*` to store data).
- Fixed some arguments being case-sensitive.

## [1.0.0] - 14-10-2024

### Added

Everything, I guess. It's the first release lol.
