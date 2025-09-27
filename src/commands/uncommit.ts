import { Interrogate, LogStuff } from "../functions/io.ts";
import { GetStagedFiles, IsRepo, ReadLastCommit, StageFiles, UndoCommit } from "../functions/git.ts";
import { bold, italic } from "@std/fmt/colors";
import TheCommitter from "./commit.ts";

export default async function TheUncommitter(): Promise<void> {
    const project = Deno.cwd();

    if (!IsRepo(project)) {
        LogStuff(
            "Are you serious right now? Unmaking a commit without being on a Git repo...\nThis project isn't a Git repository. We can't uncommit to it.",
            "error",
        );
        return;
    }

    const data = ReadLastCommit(project);

    Interrogate(
        `We will unstage all currently staged files (if any), and immediately undo commit ${data.hash}.\nIf you terminate the program you won't recover it, it's us who handle remaking it. Proceed?`,
    );

    const prevStaged = GetStagedFiles(project);
    StageFiles(project, "!A");
    UndoCommit(project);

    LogStuff(
        `Undid commit ${data.hash} (${bold(data.message)}, by ${
            italic(data.author)
        } at ${data.date})\n\nMake any modifications to the existing files now.\nUse regular git commands (git add / git remove) to stage/unstage files.\nOnce done, come to this terminal and hit 'Y',\n    we'll run your commitCmd (if any) and re-make the commit with the same message and files (unless changed) as before.\n    (you may hit 'n' as well, result will be the same)\n`,
    );
    confirm("waiting for you to hit 'Y'");

    StageFiles(project, prevStaged);
    await TheCommitter({
        message: data.message.trim(),
        keepStagedFiles: true,
        y: true,
        files: "S",
        push: false,
    });

    // no success message bc TheCommitter alr has one

    return;
}
