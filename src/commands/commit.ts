import { ColorString, Interrogate, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheCommitterConstructedParams } from "./constructors/command.ts";
import { Git } from "../functions/git.ts";
import { StringUtils } from "@zakahacecosas/string-utils";
import { RunUserCmd, ValidateUserCmd } from "../functions/user.ts";

export default function TheCommitter(params: TheCommitterConstructedParams) {
    if (!StringUtils.validate(params.message)) throw new Error("No commit message specified!");

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

    const canCommit = Git.CanCommit(project);

    if (canCommit !== true) {
        if (canCommit === "nonAdded") {
            LogStuff('There are changes, but none of them is added. Use "git add <file>" for that.', "what");
        }
        LogStuff("Nothing to commit, sir!", "tick");
        return;
    }

    const commitCmd = ValidateUserCmd(env, "commitCmd");

    const branches = Git.GetBranches(project);

    const gitProps = {
        fileCount: Git.GetFilesReadyForCommit(project).length,
        branch: (params.branch && !StringUtils.testFlag(params.branch, "push", { allowQuickFlag: true, allowSingleDash: true }))
            ? branches.all.includes(StringUtils.normalize(params.branch)) ? params.branch : "__ERROR"
            : branches.current,
    };

    if (!StringUtils.validate(gitProps.branch) || gitProps.branch === "__ERROR") {
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
