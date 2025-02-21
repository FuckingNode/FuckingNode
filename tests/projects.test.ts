import { GetAllProjects, GetProjectEnvironment, NameProject, SpotProject } from "../src/functions/projects.ts";
import { assertEquals } from "@std/assert";
import { TEST_ONE } from "./constants.ts";
import { mocks } from "./mocks.ts";
import { ColorString } from "../src/functions/io.ts";

// ACTUAL TESTS
Deno.test({
    name: "reads node env",
    fn: async () => {
        const env = await GetProjectEnvironment(TEST_ONE.root);
        assertEquals(env, TEST_ONE);
    },
});

Deno.test({
    name: "returns all projects",
    fn: async () => {
        const originalReadTextFile = Deno.readTextFile;
        // mock readTextFile
        Deno.readTextFile = mocks.readTextFile();

        const projects = await GetAllProjects();
        assertEquals(projects, [TEST_ONE.root]);

        // Restore the original method
        Deno.readTextFile = originalReadTextFile;
    },
});

Deno.test({
    name: "names projects accordingly",
    fn: async () => {
        const toName = await SpotProject("@zakahacecosas/fuckingnode");

        assertEquals(
            await NameProject(toName, "name-colorless"),
            "@zakahacecosas/fuckingnode",
        );
        assertEquals(
            await NameProject(toName, "name"),
            ColorString("@zakahacecosas/fuckingnode", "bold"),
        );
    },
});
