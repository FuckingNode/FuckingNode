import TheLister from "../commands/list.ts";
import { IsRepo } from "../functions/git.ts";
import { AddProject, RemoveProject } from "../functions/projects.ts";

Deno.bench("lister", async () => {
    await TheLister(undefined);
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
