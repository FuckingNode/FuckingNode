import { assertEquals, assertThrows } from "@std/assert";
import { GenerateGitUrl } from "../src/commands/toolkit/git-url.ts";
import {
    AddToGitIgnore,
    Commit,
    g,
    GetBranches,
    GetCommittableFiles,
    GetCommittablenessState,
    GetLatestTag,
    GetRepoRoot,
    GetStagedFiles,
    IsRepo,
    ReadLastCommit,
    StageFiles,
    Tag,
    UndoCommit,
} from "../src/functions/git.ts";
import { CommittablenessState } from "../src/types/misc.ts";

async function makeRepo(): Promise<string> {
    const path = await Deno.makeTempDir({ prefix: "fkn-git-test-" });

    g(path, ["init"]);
    g(path, ["config", "user.email", "john@node.com"]);
    g(path, ["config", "user.name", "John Node"]);
    return path;
}

async function makeRepoWithCommit(): Promise<string> {
    const path = await makeRepo();
    await Deno.writeTextFile(`${path}/README.md`, "# test lmao");
    g(path, ["add", "."]);
    g(path, ["commit", "-m", "initial commit i guess"]);
    return path;
}

async function cleanup(path: string): Promise<void> {
    await Deno.remove(path, { recursive: true });
}

Deno.test({
    name: "properly generates git urls",
    fn: () => {
        assertEquals(GenerateGitUrl("https://github.com/user/repo.git").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("https://github.com/jonathan/my-framework.gi").full, "https://github.com/jonathan/my-framework.git");
        assertEquals(GenerateGitUrl("https://github.com/user/repo..").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("https://gitlab.com/user/dots...git").full, "https://gitlab.com/user/dots.git");
        assertEquals(GenerateGitUrl("https://github.com/user/dots...tig").full, "https://github.com/user/dots.git");
        assertEquals(GenerateGitUrl("https://github.com/user/repo.test").full, "https://github.com/user/repo.test.git");

        assertEquals(GenerateGitUrl("gh:user/repo").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("gh:user/repo/").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("gh:user/repo.").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("bb:user/repo").full, "https://bitbucket.org/user/repo.git");
        assertEquals(GenerateGitUrl("gl:me/code...").full, "https://gitlab.com/me/code.git");

        assertEquals(GenerateGitUrl("gh:user/cool-repo").name, "cool-repo");
        assertEquals(GenerateGitUrl("https://github.com/user/cool-repo..git").name, "cool-repo");
    },
});

Deno.test({
    name: "IsRepo returns true for a valid git repo",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertEquals(IsRepo(path), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "IsRepo returns false for a non-git directory",
    fn: async () => {
        const path = await Deno.makeTempDir({ prefix: "john-deno" });
        try {
            assertEquals(IsRepo(path), false);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns UNKNOWN for a non-git directory",
    fn: async () => {
        const path = await Deno.makeTempDir({ prefix: "fkn-non-git-" });
        try {
            assertThrows(() => GetCommittablenessState(path));
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns CLEAN for an empty repo with no commits",
    fn: async () => {
        const path = await makeRepo();
        try {
            assertEquals(GetCommittablenessState(path), CommittablenessState.SAFE);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns CLEAN for a clean working tree",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertEquals(GetCommittablenessState(path), CommittablenessState.SAFE);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns UNTRACKED_ONLY for untracked files only",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/untracked.txt`, "untracked");
            assertEquals(GetCommittablenessState(path), CommittablenessState.UNTRACKED_ONLY);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns UNSTAGED for modified tracked files not staged",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/README.md`, "modified");
            assertEquals(GetCommittablenessState(path), CommittablenessState.UNSTAGED);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns STAGED when there are staged changes only",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/file.txt`, "hello");
            g(path, ["add", "."]);
            assertEquals(GetCommittablenessState(path), CommittablenessState.STAGED);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittablenessState returns STAGED_AND_DIRTY when staged and unstaged changes coexist",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/file.txt`, "first write");
            g(path, ["add", "."]);
            await Deno.writeTextFile(`${path}/file.txt`, "second write, not staged");
            assertEquals(GetCommittablenessState(path), CommittablenessState.STAGED_AND_DIRTY);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "Commit creates a commit with 'all' add mode",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/new.txt`, "new file");
            Commit(path, "test commit", "all", []);
            const log = g(path, ["log", "--oneline"]).stdout;
            assertEquals(log.includes("test commit"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "Commit creates a commit with specific files",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/a.txt`, "a");
            await Deno.writeTextFile(`${path}/b.txt`, "b");
            Commit(path, "only a", ["a.txt"], []);
            const staged = g(path, ["status", "--porcelain"]).stdout;
            // b.txt should still be untracked
            assertEquals(staged.includes("b.txt"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "Commit respects the avoid list",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/keep.txt`, "keep");
            await Deno.writeTextFile(`${path}/avoid.txt`, "avoid");
            Commit(path, "avoid test", "all", ["avoid.txt"]);
            const log = g(path, ["show", "--name-only", "--format="]).stdout;
            assertEquals(log.includes("keep.txt"), true);
            assertEquals(log.includes("avoid.txt"), false);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "Commit throws on nothing to commit",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertThrows(() => Commit(path, "empty", "none", []));
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "AddToGitIgnore appends entry to .gitignore",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/.gitignore`, "node_modules\n");
            g(path, ["add", "."]);
            g(path, ["commit", "-m", "add gitignore"]);

            AddToGitIgnore(path, "dist");
            const content = await Deno.readTextFile(`${path}/.gitignore`);
            assertEquals(content.includes("dist"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "AddToGitIgnore does not duplicate an existing entry",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/.gitignore`, "dist\n");
            g(path, ["add", "."]);
            g(path, ["commit", "-m", "add gitignore"]);

            AddToGitIgnore(path, "dist");
            const content = await Deno.readTextFile(`${path}/.gitignore`);
            assertEquals(content.indexOf("dist"), content.lastIndexOf("dist"));
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "Tag creates a tag and GetLatestTag retrieves it",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            Tag(path, "v1.0.0", false);
            const latest = GetLatestTag(path);
            assertEquals(latest.trim(), "v1.0.0");
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetLatestTag throws on repo with no tags",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertThrows(() => GetLatestTag(path));
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetStagedFiles returns empty array when nothing staged",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertEquals(GetStagedFiles(path), []);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetStagedFiles returns staged file names",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/staged.txt`, "staged");
            g(path, ["add", "staged.txt"]);
            const staged = GetStagedFiles(path);
            assertEquals(staged.includes("staged.txt"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "UndoCommit moves last commit back to staged",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/undo.txt`, "undo me");
            g(path, ["add", "."]);
            g(path, ["commit", "-m", "to undo"]);

            UndoCommit(path);

            const staged = GetStagedFiles(path);
            assertEquals(staged.includes("undo.txt"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "ReadLastCommit returns correct commit data",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            const commit = ReadLastCommit(path);
            assertEquals(typeof commit.message, "string");
            assertEquals(typeof commit.hash, "string");
            assertEquals(typeof commit.author, "string");
            assertEquals(typeof commit.date, "string");
            assertEquals(commit.author, "John Node");
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittableFiles returns empty on clean tree",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            assertEquals(GetCommittableFiles(path), []);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetCommittableFiles returns modified files",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/README.md`, "modified");
            const files = GetCommittableFiles(path);
            assertEquals(files.length > 0, true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetBranches returns current branch on fresh repo",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            const { current, all } = GetBranches(path);
            assertEquals(typeof current, "string");
            assertEquals(all.length > 0, true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetBranches reflects newly created branch",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            g(path, ["branch", "feature"]);
            const { all } = GetBranches(path);
            assertEquals(all.includes("feature"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "StageFiles stages all files with 'A'",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/new.txt`, "new");
            const result = StageFiles(path, "A");
            assertEquals(result, "ok");
            const staged = GetStagedFiles(path);
            assertEquals(staged.includes("new.txt"), true);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "StageFiles unstages all files with '!A'",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/new.txt`, "new");
            g(path, ["add", "."]);
            const result = StageFiles(path, "!A");
            assertEquals(result, "ok");
            assertEquals(GetStagedFiles(path), []);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "StageFiles returns 'nothingToStage' for empty array",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            const result = StageFiles(path, []);
            assertEquals(result, "nothingToStage");
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "StageFiles stages specific files",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            await Deno.writeTextFile(`${path}/a.txt`, "a");
            await Deno.writeTextFile(`${path}/b.txt`, "b");
            StageFiles(path, ["a.txt"]);
            const staged = GetStagedFiles(path);
            assertEquals(staged.includes("a.txt"), true);
            assertEquals(staged.includes("b.txt"), false);
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetRepoRoot returns the root of the repo from root itself",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            const root = GetRepoRoot(path);
            assertEquals(
                root.replace(/\\/g, "/").toLowerCase(),
                path.replace(/\\/g, "/").toLowerCase(),
            );
        } finally {
            await cleanup(path);
        }
    },
});

Deno.test({
    name: "GetRepoRoot returns root when called from a subdirectory",
    fn: async () => {
        const path = await makeRepoWithCommit();
        try {
            const subdir = `${path}/subdir`;
            await Deno.mkdir(subdir);
            const root = GetRepoRoot(subdir);
            assertEquals(
                root.replace(/\\/g, "/").toLowerCase(),
                path.replace(/\\/g, "/").toLowerCase(),
            );
        } finally {
            await cleanup(path);
        }
    },
});
