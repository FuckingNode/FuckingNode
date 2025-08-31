import { Commander } from "../functions/cli.ts";
import { CheckForPath, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { FULL_NAME } from "../constants.ts";
import { normalize, normalizeArray, StringArray, validate } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import { GIT_FILES } from "../types/misc.ts";
import { ColorString } from "./color.ts";

/** Runs a Git command with any args. ASSUMES AN ALREADY SPOTTED PATH. */
function g(path: string, args: string[]) {
    return Commander("git", ["-C", path, ...args]);
}

/**
 * Checks if a given project is a Git repository.
 *
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
        throw new FknError(
            "Git__IsRepo",
            `Can't validate if ${ParsePath(path)} is a Git repo: ${e}`,
        );
    }
}

/**
 * Checks if a local repository has uncommitted changes or not. Returns `true` if you CAN commit (there are no uncommitted changes) and `false` if otherwise.
 *
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
            parseInt(remoteStatus.stdout, 10) > 0
        ) return false; // local branch is behind the remote, so we shouldn't change stuff

        return true; // clean working tree and up to date with remote, we can do whatever we want
    } catch (e) {
        throw new FknError("Git__CanCommit", `An error happened validating the Git working tree: ${e}`);
    }
}
export function Commit(project: string, message: string, add: string[] | "all" | "none", avoid: string[]): void {
    try {
        const path = SpotProject(project);
        const toAdd = Array.isArray(add) ? add : add === "none" ? [] : add === "all" ? ["."] : [];

        if (toAdd.length > 0) {
            const addOutput = g(path, [
                "add",
                ...toAdd,
            ]);
            if (!addOutput.success) throw `(git add): ${addOutput.stdout}`;
        }

        if (avoid.length > 0) {
            const restoreOutput = g(path, [
                "restore",
                "--staged",
                ...avoid,
            ]);
            if (!restoreOutput.success) throw `(git restore): ${restoreOutput.stdout}`;
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
            if (/nothing to commit|working tree clean/.test(commitOutput.stdout ?? "")) return;
            throw `(git commit): ${commitOutput.stdout}`;
        }
        return;
    } catch (e) {
        throw new FknError(
            "Git__Commit",
            `Couldn't create commit ${ColorString(message, "bold")} at ${ColorString(project, "bold")}: ${e}`,
        );
    }
}
export function Push(project: string, branch: string | false): void {
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
        if (!pushOutput.success) throw `(git push) ${pushOutput.stdout}`;
        return;
    } catch (e) {
        throw new FknError(
            "Git__Push",
            `Couldn't push at ${ColorString(project, "bold")}: ${e}`,
        );
    }
}
/**
 * Make sure to `Commit()` changes to `.gitignore`.
 */
export function AddToGitIgnore(project: string, toBeIgnored: string): void {
    try {
        const path = SpotProject(project);
        const env = GetProjectEnvironment(path);
        const gitIgnoreFile = JoinPaths(env.root, ".gitignore");
        if (!CheckForPath(gitIgnoreFile)) {
            Deno.writeTextFileSync(gitIgnoreFile, "");
            return;
        }
        const gitIgnoreContent = Deno.readTextFileSync(gitIgnoreFile);

        if (gitIgnoreContent.includes(toBeIgnored)) return;

        Deno.writeTextFileSync(
            gitIgnoreFile,
            `${gitIgnoreContent.endsWith("\n") ? "" : "\n"}# auto-added by ${FULL_NAME} release command\n${toBeIgnored}`,
            {
                append: true,
            },
        );

        return;
    } catch (e) {
        throw new FknError(
            "Git__Ignore",
            `Couldn't gitignore file ${toBeIgnored} at ${ColorString(project, "bold")}: ${e}`,
        );
    }
}

export function Tag(project: string, tag: string, push: boolean): void {
    try {
        const path = SpotProject(project);
        const tagOutput = g(path, [
            "tag",
            tag.trim(),
        ]);
        if (!tagOutput.success) throw `(git tag) ${tagOutput.stdout}`;
        if (push) {
            const pushOutput = g(
                path,
                [
                    "push",
                    "origin",
                    "--tags",
                ],
            );
            if (!pushOutput.success) throw `(git push) ${pushOutput.stdout}`;
        }
        return;
    } catch (e) {
        throw new FknError(
            "Git__MkTag",
            `Couldn't create tag ${tag} at ${ColorString(project, "bold")}: ${e}`,
        );
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
            if (getTagOutput.stdout.includes("cannot describe anything")) return undefined;
            throw `(git describe --tags --abbrev=0) ${getTagOutput.stdout}`;
        }
        return getTagOutput.stdout; // describe --tags --abbrev=0 should return a string with nothing but the latest tag, so this will do
    } catch (e) {
        throw new FknError(
            "Git__GLTag",
            `Couldn't get latest tag at ${ColorString(project, "bold")} because of error: ${e}`,
        );
    }
}
/**
 * Get all files that are staged.
 *
 * @export
 * @param {string} project
 * @returns {string[]}
 */
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
        if (!getFilesOutput.success) throw `(git diff --cached --name-only) ${getFilesOutput.stdout}`;
        if (!validate(getFilesOutput.stdout)) return [];
        return normalizeArray(getFilesOutput.stdout.split("\n"), "soft");
    } catch (e) {
        throw new FknError(
            "Git__GStaged",
            `Couldn't get files ready for commit (staged) at ${ColorString(project, "bold")}: ${e}`,
        );
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
        if (!getFilesOutput.success) throw `(git status -s --porcelain) ${getFilesOutput.stdout}`;
        // empty string = no files
        if (!validate(getFilesOutput.stdout)) return [];
        return normalizeArray(getFilesOutput.stdout.split("\n"), "soft");
    } catch (e) {
        throw new FknError(
            "Git__GCommittable",
            `Couldn't get modified (committable) files at ${ColorString(project, "bold")}: ${e}`,
        );
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
        if (!getBranchesOutput.success) throw `(git branch) ${getBranchesOutput.stdout}`;
        if (!validate(getBranchesOutput.stdout)) {
            // fallback to status
            // this is an edge case for newly made repositories
            const statusOutput = g(
                project,
                [
                    "status",
                ],
            );
            if (!statusOutput.success) throw `(git status) ${statusOutput.stdout}`;
            const currentBranch = statusOutput.stdout?.split("\n")[0]?.split(" ")[2]?.trim();
            if (!currentBranch) throw `(unable to get current branch from output of 'git branch') ${statusOutput.stdout}`;
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
        new FknError("Git__GBranches", `Couldn't get branches at ${ColorString(project, "bold")}.`).debug(String(e), true);
        return { current: "__ERROR", all: [] };
    }
}
export function Clone(repoUrl: string, clonePath: string): void {
    try {
        const cloneOutput = Commander(
            "git",
            [
                "clone",
                repoUrl,
                clonePath,
            ],
        );
        if (!cloneOutput.success) throw `(git clone) ${cloneOutput.stdout}`;
        return;
    } catch (e) {
        throw new FknError(
            "Git__Clone",
            `Couldn't clone ${ColorString(repoUrl, "bold")} to ${ColorString(clonePath, "bold")}: ${e}`,
        );
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
export function StageFiles(project: string, files: GIT_FILES): "ok" | "nothingToStage" {
    try {
        if (files === "A") {
            const stageAllOutput = g(
                project,
                [
                    "add",
                    "-A",
                ],
            );
            if (!stageAllOutput.success) throw `(git add -A) ${stageAllOutput.stdout}`;
            return "ok";
        }
        if (files === "!A") {
            const unstageAllOutput = g(
                project,
                [
                    "reset",
                ],
            );
            if (!unstageAllOutput.success) throw `(git reset) ${unstageAllOutput.stdout}`;
            return "ok";
        }
        if (files === "S") return "ok";

        const filesToStage = files
            .filter((file) => validate(file))
            .filter(CheckForPath);

        if (filesToStage.length === 0) return "nothingToStage";

        const stageOutput = g(
            project,
            [
                "add",
                ...filesToStage,
            ],
        );
        if (!stageOutput.success) throw `(git add) ${stageOutput.stdout}`;
        return "ok";
    } catch (e) {
        throw new FknError(
            "Git__Stage",
            `Couldn't stage files at ${ColorString(project, "bold")}: ${e}`,
        );
    }
}
