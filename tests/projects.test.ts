import { GetAllProjects, GetProjectEnvironment, NameProject, SpotProject } from "../src/functions/projects.ts";
import { assertEquals } from "@std/assert";
import { TEST_ONE } from "./constants.ts";
import { mocks } from "./mocks.ts";
import { ColorString } from "../src/functions/io.ts";
import { APP_NAME } from "../src/constants.ts";

// ACTUAL TESTS
Deno.test({
    name: "reads node env",
    fn: async () => {
        const env = GetProjectEnvironment(TEST_ONE.root);
        assertEquals(env, TEST_ONE);
    },
});

Deno.test({
    name: "returns all projects",
    fn: () => {
        const originalReadTextFileSync = Deno.readTextFileSync;
        // mock readTextFile
        Deno.readTextFileSync = mocks.readTextFileSync();

        const projects = GetAllProjects();
        assertEquals(projects, [TEST_ONE.root]);

        // Restore the original method
        Deno.readTextFileSync = originalReadTextFileSync;
    },
});

Deno.test({
    name: "names projects accordingly",
    fn: async () => {
        const toName = SpotProject(APP_NAME.SCOPE);

        assertEquals(
            NameProject(toName, "name-colorless"),
            APP_NAME.SCOPE,
        );
        assertEquals(
            NameProject(toName, "name"),
            ColorString(APP_NAME.SCOPE, "bold"),
        );
    },
});
