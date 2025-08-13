import { Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject } from "../functions/projects.ts";
import type { TheCommitterConstructedParams } from "./constructors/command.ts";
import { CanCommit, Commit, GetBranches, GetCommittableFiles, GetStagedFiles, IsRepo, Push, StageFiles } from "../functions/git.ts";
import { normalize, pluralOrNot, testFlag, validate } from "@zakahacecosas/string-utils";
import { RunUserCmd, ValidateUserCmd } from "../functions/user.ts";
import { GIT_FILES } from "../types/misc.ts";
import { CheckForPath } from "../functions/filesystem.ts";
import { FknError } from "../functions/error.ts";
import { ColorString } from "../functions/color.ts";

function StagingHandler(path: string, files: GIT_FILES): "ok" | "abort" {
    const canCommit = CanCommit(path);
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
    if (
        Array.isArray(files) && files[0] !== "-A" && files.filter(validate).filter(CheckForPath).length === 0 &&
        !testFlag(files[0] ?? "a", "keep", { allowNonExactString: true, allowQuickFlag: true, allowSingleDash: true })
    ) {
        LogStuff(
            `No files specified for committing. Specify any of the ${
                ColorString(GetCommittableFiles(path).length, "bold")
            } modified files (run '${ColorString('fkcommit "message" file1 folder/file2', "bold")}').`,
            "bruh",
        );
        return "abort";
    }
    try {
        const out = GetCommittableFiles(path);
        if (out.length === 0) return "abort";
        const filtered = Array.isArray(files)
            ? files
                .filter(validate)
                .filter(CheckForPath)
            : ["(this should never appear in the cli)"];
        // stage them early
        StageFiles(path, (files === "A" || files[0] === "-A") ? "A" : filtered);
        return "ok";
    } catch {
        LogStuff("Something went wrong while staging files. Aborting.", "error");
        return "abort";
    }
}

export default function TheCommitter(params: TheCommitterConstructedParams) {
    if (!validate(params.message)) {
        throw new FknError(
            "Param__WhateverUnprovided",
            "No commit message specified!",
        );
    }

    const project = Deno.cwd();

    if (!IsRepo(project)) {
        LogStuff(
            "Are you serious right now? Making a commit without being on a Git repo...\nThis project isn't a Git repository. We can't commit to it.",
            "error",
        );
        return;
    }

    const env = GetProjectEnvironment(project);
    const prevStaged = GetStagedFiles(project);

    if (!params.keepStagedFiles) StageFiles(project, "!A");
    if (params.files[0] === "-A") StageFiles(project, "A");
    const staging = StagingHandler(project, params.files);
    if (staging === "abort") Deno.exit(1);
    if (params.keepStagedFiles) {
        LogStuff(`Keeping ${prevStaged.length} previously staged ${pluralOrNot("file", prevStaged.length)} for committing.`, "warn");
    }
    const staged = GetStagedFiles(project);
    LogStuff(
        `Staged${params.files[0] === "-A" ? " all files, totalling" : ""} ${staged.length} ${pluralOrNot("file", staged.length)} for commit:\n${
            staged
                .slice(0, 7)
                .map((file) => `${ColorString("- " + file, "bold", "white")}${prevStaged.includes(file) ? " (prev. staged, kept)" : ""}`)
                .join("\n")
        }${staged.length > 7 ? `\nand ${staged.length} more` : ""}`,
        "tick",
        ["bold", "bright-green"],
    );

    const commitCmd = ValidateUserCmd(env, "commitCmd");

    const branches = GetBranches(project);

    const gitProps = {
        fileCount: GetStagedFiles(project).length,
        branch: (params.branch && !testFlag(params.branch, "push", { allowQuickFlag: true, allowSingleDash: true }))
            ? branches.all.includes(normalize(params.branch)) ? params.branch : "__ERROR"
            : branches.current,
    };

    if (!validate(gitProps.branch) || gitProps.branch === "__ERROR") {
        throw new FknError(
            params.branch ? "Git__NoBranch" : "Git__NoBranchAA",
            params.branch
                ? `Given branch ${params.branch} wasn't found! These are your repo's branches:\n${
                    branches.all.toString().replaceAll(",", ", ")
                }.`
                : `For whatever reason we weren't able to identify your project's branches, so we can't commit. Sorry!`,
        );
    }

    const actions: string[] = [];

    if (commitCmd !== null) {
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

    const fBold = ColorString(gitProps.fileCount, "bold");
    const bBold = ColorString(gitProps.branch, "bold");
    const mBold = ColorString(params.message.trim(), "bold", "italic");
    const fCount = pluralOrNot("file", gitProps.fileCount);

    actions.push(
        actions.length === 0
            ? `Commit ${fBold} ${fCount} to branch ${bBold} with message "${mBold}"`
            : `If everything above went alright, commit ${fBold} ${fCount} to branch ${bBold} with message "${mBold}"`,
    );

    if (params.push) {
        actions.push(
            "If everything above went alright, push all commits to GitHub",
        );
    }

    if (
        !params.y && !Interrogate(
            `Heads up! We're about to take the following actions:\n\n${actions.join("\n")}\n\n- all of this at ${
                NameProject(
                    project,
                    "all",
                )
            }\n`,
        )
    ) {
        LogStuff("Aborting commit.", "bruh");
        return;
    }

    // hear me out
    // 1. UNSTAGE their files (they probably won't even realize) so we can modify them
    const toReStage = GetStagedFiles(project);
    const out = StageFiles(project, "!A");
    if (out !== "ok") {
        throw `Not OK code for staging handler.`;
    }

    // 2. run their commitCmd over UNSTAGED, MODIFIABLE files
    try {
        RunUserCmd({
            key: "commitCmd",
            env,
        });
    } catch {
        LogStuff(
            `${
                ColorString("Your commitCmd failed. For your safety, we've aborted the commit.", "bold")
            }\nCheck above for your test suite's (or whatever your commitCmd is) output.`,
            "error",
        );
        return;
    }

    // by this point we assume prev task succeeded
    // 3. RESTAGE the files like nothing happened
    // i'm genius developer fr fr

    StageFiles(project, toReStage);

    // and now, commit :D
    Commit(
        project,
        params.message,
        "none",
        [],
    );

    if (params.push) {
        // push stuff to git
        const pushOutput = Push(project, gitProps.branch);
        if (pushOutput === 1) {
            throw new FknError("Git__UE", `Git push failed unexpectedly.`);
        }
    }

    LogStuff(`That worked out! Commit "${params.message}" should be live now.`, "tick", ["bold", "bright-green"]);
    return;
}
