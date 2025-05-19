import { ColorString, Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheCommitterConstructedParams } from "./constructors/command.ts";
import { Git } from "../functions/git.ts";
import { normalize, pluralOrNot, testFlag, validate } from "@zakahacecosas/string-utils";
import { RunUserCmd, ValidateUserCmd } from "../functions/user.ts";
import { GIT_FILES } from "../types/misc.ts";
import { CheckForPath } from "../functions/filesystem.ts";

/*
 TODO for stage area
 * if you add a folder, the file count will say 1 even if you added 10 files
 * what if you add a file that's already staged?
 * "If everything above went alright, commit 1 file(s) to branch main with message "bla"" shows the wrong amount.
 * overall the Git toolkit needs reviewing
 * most important todo: TESTS. i need to manually test everything + write tests to ensure everything works.
 * when showing the "Staged files" message, we shouldn't actually stage the files until whatever commit task from the user is run.
*/

function StageFiles(path: string, files: GIT_FILES): "ok" | "abort" {
    const canCommit = Git.CanCommit(path);
    if (canCommit === false) {
        LogStuff("Nothing to commit, sir!", "tick");
        return "abort";
    }
    if (files === "S") {
        if (canCommit === "nonAdded") {
            LogStuff('There are changes, but none of them is added. Use "git add <file>" for that.', "what");
            return "abort";
        }
        return "ok"; // nothing to do, files alr staged
    }
    if (files !== "A" && files.filter(validate).filter(CheckForPath).length === 0) {
        LogStuff(
            `No files specified for committing. Specify any of the ${
                ColorString(Git.GetFilesAvailableForCommit(path).length, "bold")
            } modified files (run '${ColorString('fkcommit "message" file1 folder/file2', "bold")}').`,
            "bruh",
        );
        return "abort";
    }
    try {
        const out = Git.AddFiles(path, files);
        if (out === "nothingToStage") return "abort";
        const filtered = Array.isArray(files)
            ? files
                .filter(validate)
                .filter(CheckForPath)
            : ["(this should never appear in the cli)"];
        LogStuff(
            files === "A"
                ? "Staged all files for commit."
                : `Staged ${filtered.length} ${pluralOrNot("file", filtered.length)} for commit:\n${
                    filtered
                        .map((file) => ColorString("- " + file, "bold", "white"))
                        .join("\n")
                }`,
            "tick",
            ["bold", "bright-green"],
        );
        return "ok";
    } catch {
        LogStuff("Something went wrong while staging files. Aborting.", "error");
        return "abort";
    }
}

export default function TheCommitter(params: TheCommitterConstructedParams) {
    if (!validate(params.message)) throw new Error("No commit message specified!");

    const CWD = Deno.cwd();
    const project = SpotProject(CWD);

    if (!Git.IsRepo(project)) {
        LogStuff(
            "Are you serious right now? Making a commit without being on a Git repo...\nThis project isn't a Git repository. We can't commit to it.",
            "error",
        );
        return;
    }

    const env = GetProjectEnvironment(project);

    const staging = StageFiles(project, params.files);

    if (staging === "abort") Deno.exit(1);

    const commitCmd = ValidateUserCmd(env, "commitCmd");

    const branches = Git.GetBranches(project);

    const gitProps = {
        fileCount: Git.GetFilesReadyForCommit(project).length,
        branch: (params.branch && !testFlag(params.branch, "push", { allowQuickFlag: true, allowSingleDash: true }))
            ? branches.all.includes(normalize(params.branch)) ? params.branch : "__ERROR"
            : branches.current,
    };

    if (!validate(gitProps.branch) || gitProps.branch === "__ERROR") {
        throw new Error(
            params.branch
                ? `Given branch ${params.branch} wasn't found! These are your repo's branches:\n${
                    branches.all.toString().replaceAll(",", ", ")
                }.`
                : `For whatever reason we weren't able to identify your project's branches, so we can't commit. Sorry!`,
        );
    }

    const actions: string[] = [];

    if (commitCmd !== "disable") {
        // otherwise TS shows TypeError for whatever reason
        const typed: string[] = env.commands.run as string[];

        actions.push(
            `Run ${
                ColorString(
                    `${typed.join(" ")} ${commitCmd}`,
                    "bold",
                )
            }`,
        );
    }

    actions.push(
        `If everything above went alright, commit ${ColorString(gitProps.fileCount, "bold")} file(s) to branch ${
            ColorString(gitProps.branch, "bold")
        } with message "${ColorString(params.message.trim(), "bold", "italic")}"`,
    );

    if (params.push) {
        actions.push(
            "If everything above went alright, push all commits to GitHub",
        );
    }

    if (
        !Interrogate(
            `Heads up! We're about to take the following actions:\n${actions.join("\n")}\n\n- all of this at ${
                NameProject(
                    project,
                    "all",
                )
            }`,
        )
    ) return;

    // run their commitCmd
    RunUserCmd({
        key: "commitCmd",
        env,
    });

    // by this point we assume prev task succeeded
    Git.Commit(
        project,
        params.message,
        "none",
        [],
    );

    if (params.push) {
        // push stuff to git
        const pushOutput = Git.Push(project, gitProps.branch);
        if (pushOutput === 1) {
            throw new Error(`Git push failed unexpectedly.`);
        }
    }

    Deno.chdir(CWD);
    LogStuff(`That worked out! Commit "${params.message}" should be live now.`, "tick", ["bold", "bright-green"]);
    return;
}
