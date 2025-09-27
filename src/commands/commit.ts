import { Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import type { TheCommitterConstructedParams } from "./_interfaces.ts";
import { CanCommit, Commit, GetBranches, GetCommittableFiles, GetStagedFiles, IsRepo, Push, StageFiles } from "../functions/git.ts";
import { normalize, pluralOrNot, testFlag, validate } from "@zakahacecosas/string-utils";
import type { GIT_FILES } from "../types/misc.ts";
import { CheckForPath } from "../functions/filesystem.ts";
import { FknError } from "../functions/error.ts";
import { ColorString } from "../functions/color.ts";
import { RunCmdSet, ValidateCmdSet } from "../functions/cmd-set.ts";

const NOT_COMMITTABLE = [".env", ".env.local", ".sqlite", ".db", "node_modules", ".bak"];

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
        Array.isArray(files) && files[0] !== "-A" && files.filter(validate).filter(CheckForPath).length === 0
        && !testFlag(files[0] ?? "a", "keep", { allowNonExactString: true, allowQuickFlag: true, allowSingleDash: true })
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

export default async function TheCommitter(params: TheCommitterConstructedParams): Promise<void> {
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

    const env = await GetProjectEnvironment(project);
    const prevStaged = GetStagedFiles(project);

    if (!params.keepStagedFiles) StageFiles(project, "!A");
    if (params.files[0] === "-A") StageFiles(project, "A");
    const staging = StagingHandler(project, params.files);
    if (staging === "abort") Deno.exit(1);
    if (params.keepStagedFiles) {
        LogStuff(`Keeping ${prevStaged.length} previously staged ${pluralOrNot("file", prevStaged.length)} for committing.`, "warn");
    }

    const staged = GetStagedFiles(project);
    for (const f of staged) {
        if (NOT_COMMITTABLE.some((s) => f.includes(s))) {
            throw new FknError(
                "Git__Forbidden",
                `Forbidden file detected! '${f}' cannot be committed.`,
            );
        }
    }

    LogStuff(
        `Staged${params.files[0] === "-A" ? " all files, totalling" : ""} ${staged.length} ${pluralOrNot("file", staged.length)} for commit:\n${
            staged
                .slice(0, 7)
                .map((file) => `${ColorString("- " + file, "bold", "white")}${prevStaged.includes(file) ? " (prev. staged, kept)" : ""}`)
                .join("\n")
        }${staged.length > 7 ? `\nand ${staged.length - 7} more` : ""}`,
        "tick",
        ["bold", "bright-green"],
    );

    const commitCmd = ValidateCmdSet({ env, key: "commitCmd" });

    const branches = GetBranches(project);

    const gitProps = {
        fileCount: staged.length,
        branch: (params.branch && !testFlag(params.branch, "push", { allowQuickFlag: true, allowSingleDash: true }))
            ? branches.all.includes(normalize(params.branch)) ? params.branch : false
            : branches.current,
    };

    if (!gitProps.branch || !validate(gitProps.branch)) {
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
        actions.push(
            `Run your 'commitCmd' (${commitCmd.length} cmds)`,
        );
    }

    const fBold = ColorString(gitProps.fileCount, "bold");
    const bBold = ColorString(gitProps.branch, "bold");
    const mBold = ColorString(params.message.trim(), "bold", "italic");
    const fCount = pluralOrNot("file", gitProps.fileCount);

    actions.push(`Commit ${fBold} ${fCount} to branch ${bBold} with message "${mBold}"`);

    if (params.push) {
        actions.push(
            "Push all commits to remote",
        );
    }

    if (
        !params.y && !Interrogate(
            `Heads up! We're about to take the following actions:\n\n${actions.join("\n")}\n\n- all of this at ${env.names.full}\n`,
        )
    ) {
        LogStuff("Aborting commit.", "bruh");
        return;
    }

    // hear me out
    // 1. UNSTAGE their files (they probably won't even realize) so we can modify them
    const out = StageFiles(project, "!A");
    if (out !== "ok") throw `No files to stage? This is likely an error somewhere.`;

    // 2. run their commitCmd over UNSTAGED, MODIFIABLE files
    try {
        await RunCmdSet({
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
    StageFiles(project, staged);

    // and now, commit :D
    Commit(
        project,
        params.message,
        "none",
        [],
    );

    if (params.push) Push(project, gitProps.branch);

    LogStuff(`That worked out! Commit "${params.message}" should be ${params.push ? "done and live" : "done"} now.`, "tick", [
        "bold",
        "bright-green",
    ]);
    return;
}
