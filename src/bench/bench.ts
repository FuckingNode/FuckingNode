import type { RESULT } from "../commands/clean.ts";
import TheLister from "../commands/list.ts";
import { ShowReport } from "../commands/toolkit/cleaner.ts";
import { GetAppPath } from "../functions/config.ts";
import { GetBranches, GetLatestTag, IsRepo } from "../functions/git.ts";
import { AddProject, GetProjectEnvironment, RemoveProject } from "../functions/projects.ts";

Deno.bench({
    name: "lister",
    warmup: 350,
    fn: async () => {
        await TheLister(undefined);
    },
});

Deno.bench({
    name: "lister (ignored)",
    warmup: 350,
    fn: async () => {
        await TheLister("ignored");
    },
});

Deno.bench({
    name: "remover",
    warmup: 350,
    fn: async (b) => {
        await AddProject(".");
        b.start();
        await RemoveProject(".");
        b.end();
    },
});

Deno.bench({
    name: "adder",
    warmup: 350,
    fn: async (b) => {
        await RemoveProject(".");
        b.start();
        await AddProject(".");
        b.end();
    },
});

// TODO(@ZakaHaceCosas) this kinda fucks the project file up
Deno.bench({
    name: "bulk adder",
    warmup: 350,
    fn: async (b) => {
        const path = GetAppPath("MOTHERFKRS");
        const prev = Deno.readTextFileSync(path);
        try {
            Deno.writeTextFileSync(path, "");
            b.start();
            await AddProject("./tests/environment/*");
            b.end();
        } finally {
            Deno.writeTextFileSync(path, prev);
        }
    },
});

Deno.bench({
    name: "git check for repo",
    warmup: 350,
    fn: () => {
        IsRepo(".");
    },
});

Deno.bench({
    name: "git get branches",
    warmup: 350,
    fn: () => {
        GetBranches(".");
    },
});

Deno.bench({
    name: "git get latest tag",
    warmup: 350,
    fn: () => {
        GetLatestTag(".");
    },
});

Deno.bench({
    name: "get project env",
    warmup: 350,
    fn: async () => {
        await GetProjectEnvironment(".");
    },
});

Deno.bench({
    name: "report",
    warmup: 350,
    fn: (b) => {
        const entries: RESULT[] = [];
        for (let index = 0; index < 100; index++) {
            entries.push({
                name: "some-name",
                status: "Success",
                elapsedTime: "69",
                extras: undefined,
            });
        }
        b.start();
        ShowReport(entries);
        b.end();
    },
});

/* (does not work bc it requires user input) Deno.bench({
    name: "audit",
    warmup: 350,
    fn: async () => {
        await TheAuditer({
            project: "./tests/environment/test-one",
        });
    },
}); */
