import { bold, brightGreen, brightYellow, cyan, dim, italic, red } from "@std/fmt/colors";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import { GetBranches, GetCommittableFiles, GetCommittablenessState, GetUpstreamState, IsRepo, ReadLastCommit } from "../functions/git.ts";
import { LogStuff } from "../functions/io.ts";
import { CommittablenessState } from "../types/misc.ts";
import { pluralOrNot } from "@zakahacecosas/string-utils";

function DescribeTreeState(state: CommittablenessState): string {
    switch (state) {
        case CommittablenessState.SAFE:
            return brightGreen("clean");
        case CommittablenessState.UNSTAGED:
            return bold(brightYellow("uncommitted changes"));
        case CommittablenessState.UNTRACKED_ONLY:
            return bold(brightYellow("untracked files"));
        case CommittablenessState.STAGED:
            return cyan("staged changes");
        case CommittablenessState.STAGED_AND_DIRTY:
            return bold(brightYellow("staged and unstaged changes"));
        case CommittablenessState.BEHIND_REMOTE:
            return bold(red("behind remote"));
        default:
            return dim("unknown, somehow");
    }
}

function DescribeLastCommit(root: string): string {
    try {
        const commit = ReadLastCommit(root);
        const firstLine = commit.message.split("\n").map((line) => line.trim()).filter(Boolean)[0] ?? "(no message)";
        const message = firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine;

        return `${dim("> last commit")} ${bold(commit.hash)} ${italic(`"${message}"`)} ${dim(`by ${commit.author} on ${commit.date}`)}`;
    } catch {
        return `${dim("> last commit")} ${dim("none yet")}`;
    }
}

function GroupChangedEntries(changedEntries: string[]): string {
    const map = new Map<string, string[]>();

    for (const entry of changedEntries) {
        const [key, path] = entry.split(" ", 2);

        if (!key || !path) continue;

        if (!map.has(key)) map.set(key, [path]);
        else {
            const a = map.get(key);
            a!.push(path);
            map.set(key, a!);
        }
    }

    if (map.size === 0) return dim("> nothing here!");

    let str = "";

    for (const item of map.entries()) {
        str += `${dim("> ")}${item[0]} ${item[1].length} ${dim(pluralOrNot("file", item[1].length))}\n`;
    }

    return str;
}

function DescribeGit(root: string): string[] {
    if (!IsRepo(root)) {
        return [`${dim("> git")} ${red("not a repository")}\n`];
    }

    const branches = GetBranches(root);
    const branch = branches.current
        ? `${bold(branches.current)}${branches.all.length > 1 ? dim(` (${branches.all.length} branches)`) : ""}`
        : dim("unknown branch");

    let treeState = dim("unknown");
    let changedEntries: string[] = [];

    try {
        treeState = DescribeTreeState(GetCommittablenessState(root));
        changedEntries = GetCommittableFiles(root);
    } catch {
        // Keep the generic "unknown" state if Git fails here.
    }

    const changes = changedEntries.length > 0 ? dim(` (${changedEntries.length} ${pluralOrNot("entry", changedEntries.length)})`) : "";

    const upstream = GetUpstreamState(root);
    const upstreamState = !upstream
        ? dim("no upstream")
        : upstream.ahead === 0 && upstream.behind === 0
        ? brightGreen("up to date")
        : upstream.ahead > 0 && upstream.behind > 0
        ? brightYellow(`diverged (${upstream.ahead} ahead, ${upstream.behind} behind)`)
        : upstream.ahead > 0
        ? brightYellow(`${upstream.ahead} ahead`)
        : brightYellow(`${upstream.behind} behind`);

    return [
        `${dim("> git")} ${branch} · ${treeState}${changes} · ${upstreamState}`,
        DescribeLastCommit(root),
        dim("> git status (more specifically)"),
        GroupChangedEntries(changedEntries).trim(),
    ];
}

export default async function TheStater(params: {
    projects?: readonly string[] | undefined;
}): Promise<void> {
    const requested = params.projects?.map((project) => project.trim()).filter(Boolean) ?? [];
    const targets = requested.length > 0 ? requested : GetAllProjects();

    if (targets.length === 0) {
        LogStuff(
            "There are no projects to show state for. Add some with 'fkn add', or pass one or more project paths.",
            "moon-face",
        );
        return;
    }

    const blocks: string[] = [];

    for (const target of targets) {
        try {
            const env = await GetProjectEnvironment(target);
            const dependencies = env.mainCPF.deps.length;
            const workspaces = env.mainCPF.ws.length;

            blocks.push(
                [
                    env.names.full,
                    `${dim("> runtime")} ${bold(env.runtime)} · ${dim("manager")} ${bold(env.manager)} · ${dependencies} ${
                        pluralOrNot("dependency", dependencies)
                    } · ${workspaces} ${pluralOrNot("workspace", workspaces)}`,
                    ...DescribeGit(env.root),
                ].join("\n"),
            );
        } catch (e) {
            blocks.push(`${bold(target)}\n  ${red(e instanceof Error ? e.message : String(e))}`);
        }
    }

    LogStuff(blocks.join("\n").trim());
}
