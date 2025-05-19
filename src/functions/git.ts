import { Commander } from "../functions/cli.ts";
import { CheckForPath, JoinPaths, ParsePath } from "../functions/filesystem.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { FULL_NAME } from "../constants.ts";
import { normalize, normalizeArray, StringArray, validate } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import { GIT_FILES } from "../types/misc.ts";

function __isRepo(path: string): boolean {
    try {
        const resolvedPath = SpotProject(path);

        // make sure we're in a repo
        const output = Commander(
            "git",
            [
                "-C",
                resolvedPath,
                "rev-parse",
                "--is-inside-work-tree",
            ],
            false,
        );
        if (
            !output.success ||
            normalize(output.stdout ?? "", { strict: true, removeCliColors: true }) !== "true"
        ) return false; // anything unsuccessful means uncommitted changes

        return true;
    } catch (e) {
        new FknError(
            "Git__IsRepoError",
            `An error happened validating if ${ParsePath(path)} is a Git repo: ${e}`,
        );
        return false;
    }
}

export const Git = {
    /**
     * Checks if a given project is a Git repository.
     *
     * @export
     * @param {string} path Path to the repo, or project name.
     * @returns {boolean}
     */
    IsRepo: (path: string): boolean => {
        return __isRepo(path);
    },
    /**
     * Checks if a local repository has uncommitted changes or not. Returns `true` if you CAN commit (there are no uncommitted changes) and `false` if otherwise.
     *
     * @export
     * @param {string} path Path to the repo, or project name.
     * @returns {boolean | "nonAdded"}
     */
    CanCommit: (path: string): boolean | "nonAdded" => {
        try {
            const resolvedPath = SpotProject(path);

            // make sure we're in a repo
            if (!__isRepo(path)) return false;

            // check for uncommitted changes
            const localChanges = Commander(
                "git",
                [
                    "-C",
                    resolvedPath,
                    "status",
                    // "--porcelain" - this gave issues because of a stupid "\n"
                ],
                false,
            );

            if (
                (/nothing added to to commit but untracked files present|no changes added to commit/.test(localChanges.stdout ?? ""))
            ) return "nonAdded";

            if (
                (/nothing to commit|working tree clean/.test(localChanges.stdout ?? "")) ||
                !localChanges.success // anything that isn't 0 means something is in the tree
            ) return false; // if anything happens we assume the tree isn't clean, just in case.

            // check if the local branch is behind the remote
            const remoteStatus = Commander(
                "git",
                [
                    "-C",
                    resolvedPath,
                    "rev-list",
                    "--count",
                    "--left-only",
                    "@{u}...HEAD",
                ],
                false,
            );
            if (
                remoteStatus.success &&
                parseInt(remoteStatus.stdout!.trim(), 10) > 0
            ) return false; // local branch is behind the remote, so we shouldn't change stuff

            return true; // clean working tree and up to date with remote, we can do whatever we want
        } catch (e) {
            LogStuff(`An error happened validating the Git working tree: ${e}`, "error");
            return false;
        }
    },
    Commit: (project: string, message: string, add: string[] | "all" | "none", avoid: string[]): 0 | 1 => {
        try {
            const path = SpotProject(project);
            const toAdd = Array.isArray(add) ? add : add === "none" ? [] : add === "all" ? ["."] : [];

            if (toAdd.length > 0) {
                const addOutput = Commander(
                    "git",
                    [
                        "-C",
                        path,
                        "add",
                        ...toAdd,
                    ],
                    false,
                );
                if (!addOutput.success) throw new Error(addOutput.stdout);
            }

            if (avoid.length > 0) {
                const restoreOutput = Commander(
                    "git",
                    [
                        "-C",
                        path,
                        "restore",
                        "--staged",
                        ...avoid,
                    ],
                    false,
                );
                if (!restoreOutput.success) throw new Error(restoreOutput.stdout);
            }

            const commitOutput = Commander(
                "git",
                [
                    "-C",
                    path,
                    "commit",
                    "-m",
                    message.trim(),
                ],
                false,
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
    },
    Push: (project: string, branch: string | false): 0 | 1 => {
        try {
            const path = SpotProject(project);

            const pushToBranch = branch === false ? [] : ["origin", branch.trim()];

            const pushOutput = Commander(
                "git",
                [
                    "-C",
                    path,
                    "push",
                    ...pushToBranch,
                ],
                false,
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
    },
    /**
     * Make sure to `Git.Commit()` changes to `.gitignore`.
     */
    Ignore: (project: string, toBeIgnored: string): 0 | 1 => {
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
                `# auto-added by ${FULL_NAME} release command\n${toBeIgnored}`,
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
    },
    Tag: (project: string, tag: string, push: boolean): 0 | 1 => {
        try {
            const path = SpotProject(project);
            const tagOutput = Commander(
                "git",
                [
                    "-C",
                    path,
                    "tag",
                    tag.trim(),
                ],
                false,
            );
            if (!tagOutput.success) {
                throw new Error(tagOutput.stdout);
            }
            if (push) {
                const pushOutput = Commander(
                    "git",
                    [
                        "-C",
                        path,
                        "push",
                        "origin",
                        "--tags",
                    ],
                    false,
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
    },
    /**
     * Gets the latest tag for a project.
     *
     * @param project Project path. **Assumes it's parsed & spotted.**
     * @returns A string with the tag name, or `undefined` if an error happens.
     */
    GetLatestTag: (project: string): string | undefined => {
        try {
            const getTagOutput = Commander(
                "git",
                [
                    "-C",
                    project,
                    "describe",
                    "--tags",
                    "--abbrev=0",
                ],
                false,
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
    },
    GetFilesReadyForCommit: (project: string): string[] => {
        try {
            const path = SpotProject(project);
            const getFilesOutput = Commander(
                "git",
                [
                    "-C",
                    path,
                    "status",
                    "-s",
                    "--porcelain",
                ],
                false,
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
    },
    GetFilesAvailableForCommit: (project: string): string[] => {
        try {
            const path = SpotProject(project);
            const getFilesOutput = Commander(
                "git",
                [
                    "-C",
                    path,
                    "status",
                    "-s",
                    "--porcelain",
                ],
                false,
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
    },
    /**
     * Gets all Git branches for a project.
     *
     * @param project Project path. **Assumes it's parsed & spotted.**
     * @returns An object with the current branch and an array with all branch names.
     */
    GetBranches: (project: string): { current: string; all: string[] } => {
        try {
            const getBranchesOutput = Commander(
                "git",
                [
                    "-C",
                    project,
                    "branch",
                ],
                false,
            );
            if (!getBranchesOutput.success) {
                throw new Error(getBranchesOutput.stdout);
            }
            if (!validate(getBranchesOutput.stdout)) {
                // fallback to status
                // this is an edge case for newly made repositories
                const statusOutput = Commander(
                    "git",
                    [
                        "-C",
                        project,
                        "status",
                    ],
                    false,
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
                    .sortAlphabetically().normalize("soft"),
            };
        } catch (e) {
            LogStuff(
                `Error - could not get branches at ${ColorString(project, "bold")} because of error: ${e}`,
                "error",
            );

            return { current: "__ERROR", all: [] };
        }
    },
    Clone: (repoUrl: string, clonePath: string): boolean => {
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
    },
    /**
     * Stages files for a Git repo.
     *
     * @param project Project path. **Assumes it's parsed & spotted.**
     * @returns
     */
    AddFiles: (project: string, files: GIT_FILES): "ok" | "nothingToStage" | "error" => {
        try {
            if (files === "A") {
                const stageAllOutput = Commander(
                    "git",
                    [
                        "-C",
                        project,
                        "add",
                        "-A",
                    ],
                    false,
                );
                if (!stageAllOutput.success) throw new Error(stageAllOutput.stdout);
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

            const stageFilesOutput = Commander(
                "git",
                [
                    "-C",
                    project,
                    "add",
                    ...filesToStage,
                ],
                false,
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
    },
};
