import { Commander, CommanderOutput } from "../functions/cli.ts";
import { CheckForPath, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { FULL_NAME } from "../constants.ts";
import { normalize, normalizeArray, StringArray, validate } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import { GIT_FILES } from "../types/misc.ts";

// * NOTE
// * in this file, use Error instead of FknError, then capture all errors and return 1
// * it's designed that way

/** Runs a Git command with any args. ASSUMES AN ALREADY SPOTTED PATH. */
function g(path: string, args: string[]): CommanderOutput {
    return Commander("git", ["-C", path, ...args], false);
}

/**
 * Checks if a given project is a Git repository.
 *
 * @export
 * @param {string} path Path to the repo, or project name.
 * @returns {boolean}
 */
export function IsRepo(path: string): boolean {
    try {
        const resolvedPath = SpotProject(path);

        // make sure we're in a repo
        const output = g(
            resolvedPath,
            [
                "rev-parse",
                "--is-inside-work-tree",
            ],
        );
        if (
            !output.success ||
            normalize(output.stdout ?? "", { strict: true, removeCliColors: true }) !== "true"
        ) return false; // anything unsuccessful means uncommitted changes

        return true;
    } catch (e) {
        new FknError(
            "Git__UE__IsRepo",
            `An error happened validating if ${ParsePath(path)} is a Git repo: ${e}`,
        );
        return false;
    }
}

/**
 * Checks if a local repository has uncommitted changes or not. Returns `true` if you CAN commit (there are no uncommitted changes) and `false` if otherwise.
 *
 * @export
 * @param {string} path Path to the repo, or project name.
 * @returns {boolean | "nonAdded"}
 */
export function CanCommit(path: string): boolean | "nonAdded" {
    try {
        const resolvedPath = SpotProject(path);

        // make sure we're in a repo
        if (!IsRepo(resolvedPath)) return false;

        // check for uncommitted changes
        const localChanges = g(resolvedPath, ["status"]);

        if (
            (/nothing added to to commit but untracked files present|no changes added to commit/.test(localChanges.stdout ?? ""))
        ) return "nonAdded";

        if (
            (/nothing to commit|working tree clean/.test(localChanges.stdout ?? "")) ||
            !localChanges.success // anything that isn't 0 means something is in the tree
        ) return false; // if anything happens we assume the tree isn't clean, just in case.

        // check if the local branch is behind the remote
        const remoteStatus = g(resolvedPath, [
            "rev-list",
            "--count",
            "--left-only",
            "@{u}...HEAD",
        ]);
        if (!remoteStatus.stdout) return false; // if we can't get the remote status, we assume it's not clean
        if (
            remoteStatus.success &&
            parseInt(remoteStatus.stdout.trim(), 10) > 0
        ) return false; // local branch is behind the remote, so we shouldn't change stuff

        return true; // clean working tree and up to date with remote, we can do whatever we want
    } catch (e) {
        LogStuff(`An error happened validating the Git working tree: ${e}`, "error");
        return false;
    }
}
export function Commit(project: string, message: string, add: string[] | "all" | "none", avoid: string[]): 0 | 1 {
    try {
        const path = SpotProject(project);
        const toAdd = Array.isArray(add) ? add : add === "none" ? [] : add === "all" ? ["."] : [];

        if (toAdd.length > 0) {
            const addOutput = g(path, [
                "add",
                ...toAdd,
            ]);
            if (!addOutput.success) throw new Error(addOutput.stdout);
        }

        if (avoid.length > 0) {
            const restoreOutput = g(path, [
                "restore",
                "--staged",
                ...avoid,
            ]);
            if (!restoreOutput.success) throw new Error(restoreOutput.stdout);
        }

        const commitOutput = g(
            path,
            [
                "commit",
                "-m",
                message.trim(),
            ],
        );
        if (!commitOutput.success) {
            if (/nothing to commit|working tree clean/.test(commitOutput.stdout ?? "")) return 0;
            throw new Error(commitOutput.stdout);
        }
        return 0;
    } catch (e) {
        LogStuff(
            `Error - could not create commit ${ColorString(message, "bold")} at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );
        return 1;
    }
}
export function Push(project: string, branch: string | false): 0 | 1 {
    try {
        const path = SpotProject(project);

        const pushToBranch = branch === false ? [] : ["origin", branch.trim()];

        const pushOutput = g(
            path,
            [
                "push",
                ...pushToBranch,
            ],
        );
        if (!pushOutput.success) {
            throw new Error(pushOutput.stdout);
        }
        return 0;
    } catch (e) {
        LogStuff(
            `Error - could not push at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );
        return 1;
    }
}
/**
 * Make sure to `Commit()` changes to `.gitignore`.
 */
export function AddToGitIgnore(project: string, toBeIgnored: string): 0 | 1 {
    try {
        const path = SpotProject(project);
        const env = GetProjectEnvironment(path);
        const gitIgnoreFile = JoinPaths(env.root, ".gitignore");
        if (!CheckForPath(gitIgnoreFile)) {
            Deno.writeTextFileSync(gitIgnoreFile, "");
            LogStuff(
                `Ignored ${toBeIgnored} successfully`,
                "tick",
            );

            return 0;
        }
        const gitIgnoreContent = Deno.readTextFileSync(gitIgnoreFile);

        if (gitIgnoreContent.includes(toBeIgnored)) return 0;

        Deno.writeTextFileSync(
            gitIgnoreFile,
            `${gitIgnoreContent.endsWith("\n") ? "" : "\n"}# auto-added by ${FULL_NAME} release command\n${toBeIgnored}`,
            {
                append: true,
            },
        );

        LogStuff(
            `Ignored ${toBeIgnored} successfully`,
            "tick",
        );

        return 0;
    } catch (e) {
        LogStuff(
            `Error - could not ignore file ${toBeIgnored} at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );

        return 1;
    }
}
export function Tag(project: string, tag: string, push: boolean): 0 | 1 {
    try {
        const path = SpotProject(project);
        const tagOutput = g(path, [
            "tag",
            tag.trim(),
        ]);
        if (!tagOutput.success) {
            throw new Error(tagOutput.stdout);
        }
        if (push) {
            const pushOutput = g(
                path,
                [
                    "push",
                    "origin",
                    "--tags",
                ],
            );
            if (!pushOutput.success) {
                throw new Error(pushOutput.stdout);
            }
        }
        return 0;
    } catch (e) {
        LogStuff(
            `Error - could not create tag ${tag} at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );

        return 1;
    }
}
/**
 * Gets the latest tag for a project.
 *
 * @param project Project path. **Assumes it's parsed & spotted.**
 * @returns A string with the tag name, or `undefined` if an error happens.
 */
export function GetLatestTag(project: string): string | undefined {
    try {
        const path = SpotProject(project);
        const getTagOutput = g(
            path,
            [
                "describe",
                "--tags",
                "--abbrev=0",
            ],
        );
        if (!getTagOutput.success) {
            throw new Error(getTagOutput.stdout);
        }
        if (!getTagOutput.stdout) {
            throw new Error(`git describe --tags --abbrev=0 returned an undefined output for ${project}`);
        }
        return getTagOutput.stdout.trim(); // describe --tags --abbrev=0 should return a string with nothing but the latest tag, so this will do
    } catch (e) {
        LogStuff(
            `Error - could not get latest tag at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );
        return undefined;
    }
}
export function GetStagedFiles(project: string): string[] {
    try {
        const path = SpotProject(project);
        const getFilesOutput = g(
            path,
            [
                "diff",
                "--cached",
                "--name-only",
            ],
        );
        if (!getFilesOutput.success) throw new Error(getFilesOutput.stdout);
        if (!validate(getFilesOutput.stdout)) return [];
        return normalizeArray(getFilesOutput.stdout.split("\n"), "soft");
    } catch (e) {
        LogStuff(
            `Error - could not get files ready for commit (staged) at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );
        return [];
    }
}
export function GetCommittableFiles(project: string): string[] {
    try {
        const path = SpotProject(project);
        const getFilesOutput = g(
            path,
            [
                "status",
                "-s",
                "--porcelain",
            ],
        );
        if (!getFilesOutput.success) throw new Error(getFilesOutput.stdout);
        if (!validate(getFilesOutput.stdout)) return [];
        return normalizeArray(getFilesOutput.stdout.split("\n"), "soft");
    } catch (e) {
        LogStuff(
            `Error - could not get files available for commit (created, deleted, or modified) at ${
                ColorString(project, "bold")
            } because of error: ${e}`,
            "error",
        );
        return [];
    }
}
/**
 * Gets all Git branches for a project.
 *
 * @param project Project path. **Assumes it's parsed & spotted.**
 * @returns An object with the current branch and an array with all branch names.
 */
export function GetBranches(project: string): { current: string; all: string[] } {
    try {
        const getBranchesOutput = g(
            project,
            [
                "branch",
            ],
        );
        if (!getBranchesOutput.success) {
            throw new Error(getBranchesOutput.stdout);
        }
        if (!validate(getBranchesOutput.stdout)) {
            // fallback to status
            // this is an edge case for newly made repositories
            const statusOutput = g(
                project,
                [
                    "status",
                ],
            );
            if (!statusOutput.success) throw new Error(`${statusOutput.stdout}`);
            const currentBranch = statusOutput.stdout?.split("\n")[0]?.split(" ")[2]?.trim();
            if (!currentBranch) throw new Error("unable to get branch");
            return {
                current: currentBranch,
                all: [currentBranch],
            };
        }
        const current = getBranchesOutput.stdout.match(/^\* (.+)$/m)![1]!;
        return {
            current,
            all: new StringArray(getBranchesOutput.stdout.replace("*", "").split("\n"))
                .sortAlphabetically().normalize("soft").arr(),
        };
    } catch (e) {
        LogStuff(
            `Error - could not get branches at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );

        return { current: "__ERROR", all: [] };
    }
}
export function Clone(repoUrl: string, clonePath: string): boolean {
    try {
        const cloneOutput = Commander(
            "git",
            [
                "clone",
                repoUrl,
                clonePath,
            ],
            false,
        );
        if (!cloneOutput.success) throw new Error(cloneOutput.stdout);
        return true;
    } catch (e) {
        LogStuff(
            `Error - could not clone ${ColorString(repoUrl, "bold")} to ${ColorString(clonePath, "bold")} because of error: ${e}`,
            "error",
        );
        return false;
    }
}
/**
 * Stages files for a Git repo. Takes an array of strings (file paths) or a special string to:
 *
 * - `"A"`: stage all files.
 * - `"!A"`: unstage all files.
 * - `"S"`: stage all files that are staged, but not committed (this is a no-op).
 *
 * @param project Project path. **Assumes it's parsed & spotted.**
 * @param files An array of files to stage, or a special string.
 * @returns
 */
export function StageFiles(project: string, files: GIT_FILES): "ok" | "nothingToStage" | "error" {
    try {
        if (files === "A") {
            const stageAllOutput = g(
                project,
                [
                    "add",
                    "-A",
                ],
            );
            if (!stageAllOutput.success) throw new Error(stageAllOutput.stdout);
            return "ok";
        }
        if (files === "!A") {
            const unstageAllOutput = g(
                project,
                [
                    "reset",
                ],
            );
            if (!unstageAllOutput.success) throw new Error(unstageAllOutput.stdout);
            return "ok";
        }
        if (files === "S") return "ok";

        const filesToStage = files
            .filter((file) => validate(file))
            .filter(CheckForPath);

        if (filesToStage.length === 0) {
            LogStuff(
                `No files to stage at ${ColorString(project, "bold")}`,
                "warn",
                ["bold", "bright-yellow"],
            );
            return "nothingToStage";
        }

        const stageFilesOutput = g(
            project,
            [
                "add",
                ...filesToStage,
            ],
        );
        if (!stageFilesOutput.success) throw new Error(stageFilesOutput.stdout);
        return "ok";
    } catch (e) {
        LogStuff(
            `Error - could not stage files at ${ColorString(project, "bold")} because of error: ${e}`,
            "error",
        );
        return "error";
    }
}
