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

Deno.bench("remover", async (b) => {
    await AddProject(".");
    b.start();
    await RemoveProject(".");
    b.end();
});

Deno.bench("adder", async (b) => {
    await RemoveProject(".");
    b.start();
    await AddProject(".");
    b.end();
});

Deno.bench("bulk adder", async (b) => {
    const path = GetAppPath("MOTHERFKRS");
    const prev = Deno.readTextFileSync(path);
    try {
        Deno.writeTextFileSync(path, "");
        b.start();
        // TODO(@ZakaHaceCosas): add more test projects
        await AddProject("./tests/environment/*");
        b.end();
    } finally {
        Deno.writeTextFileSync(path, prev);
    }
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
