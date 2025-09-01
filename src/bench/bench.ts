import TheLister from "../commands/list.ts";
import { GetAppPath } from "../functions/config.ts";
import { GetBranches, GetLatestTag, IsRepo } from "../functions/git.ts";
import { AddProject, GetProjectEnvironment, RemoveProject } from "../functions/projects.ts";

Deno.bench("lister", async () => {
    await TheLister(undefined);
});

Deno.bench("lister (ignored)", async () => {
    await TheLister("ignored");
});

Deno.bench("adder", async (b) => {
    await RemoveProject(".");
    b.start();
    await AddProject(".");
    b.end();
});

// TODO(@ZakaHaceCosas):
// make it use projects in /tests/ so everyone can run it
// make it not wipe your real project list
Deno.bench("bulk adder", async (b) => {
    Deno.writeTextFileSync(GetAppPath("MOTHERFKRS"), "");
    b.start();
    await AddProject("../proyectitos/*");
    b.end();
});

Deno.bench("remover", async (b) => {
    await AddProject(".");
    b.start();
    await RemoveProject(".");
    b.end();
});

Deno.bench("git check for repo", () => {
    IsRepo(".");
});

Deno.bench("git get branches", () => {
    GetBranches(".");
});

Deno.bench("git get latest tag", () => {
    GetLatestTag(".");
});

Deno.bench("git get branches", () => {
    GetLatestTag(".");
});

Deno.bench("get project env", async () => {
    await GetProjectEnvironment(".");
});
