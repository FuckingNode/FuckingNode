import TheLister from "../commands/list.ts";
import { IsRepo } from "../functions/git.ts";
import { AddProject, RemoveProject } from "../functions/projects.ts";

Deno.bench("lister", () => {
    TheLister(undefined);
});

Deno.bench("adder", (b) => {
    RemoveProject(".");
    b.start();
    AddProject(".");
    b.end();
});

Deno.bench("remover", (b) => {
    AddProject(".");
    b.start();
    RemoveProject(".");
    b.end();
});

Deno.bench("git check for repo", () => {
    IsRepo(".");
});
