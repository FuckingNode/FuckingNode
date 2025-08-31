import TheLister from "../commands/list.ts";
import { GetBranches, IsRepo } from "../functions/git.ts";
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

Deno.bench("get project env", async () => {
    await GetProjectEnvironment(".");
});
