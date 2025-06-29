import { GetAllProjects, GetProjectEnvironment, NameProject, SpotProject } from "../src/functions/projects.ts";
import { assertEquals } from "@std/assert";
import { TEST_ONE } from "./constants.ts";
import { mocks } from "./mocks.ts";
import { APP_NAME, DEFAULT_FKNODE_YAML } from "../src/constants.ts";
import { parse as parseYaml } from "@std/yaml";
import { JoinPaths } from "../src/functions/filesystem.ts";

// ACTUAL TESTS
Deno.test({
    name: "reads node env",
    fn: () => {
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
    fn: () => {
        const toName = SpotProject(APP_NAME.SCOPE);

        assertEquals(
            NameProject(toName, "name-colorless"),
            APP_NAME.SCOPE,
        );
    },
});

// ! this test is failing as of now
// this is new info, maybe the ctx mismatch comes from here instead?
Deno.test({
    name: "gets the right fknode.yaml",
    fn: () => {
        const settings = GetProjectEnvironment(TEST_ONE.root).settings;
        assertEquals(settings, {
            ...DEFAULT_FKNODE_YAML,
            ...(parseYaml(Deno.readTextFileSync(JoinPaths(TEST_ONE.root, "fknode.yaml"))) as any),
        });
    },
});
