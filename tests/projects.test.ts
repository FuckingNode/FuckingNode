import { GetProjectEnvironment, NameProject, SpotProject, ValidateProject } from "../src/functions/projects.ts";
import { assertEquals } from "@std/assert";
import { TEST_ONE } from "./constants.ts";
import { DEFAULT_FKNODE_YAML } from "../src/constants.ts";
import { parse as parseYaml } from "@std/yaml";
import { JoinPaths } from "../src/functions/filesystem.ts";
import { APP_NAME } from "../src/constants/name.ts";

// ACTUAL TESTS
Deno.test({
    name: "reads node env",
    fn: async () => {
        const env = await GetProjectEnvironment(TEST_ONE.root);
        assertEquals(env, TEST_ONE);
    },
});

Deno.test({
    name: "names projects accordingly",
    fn: async () => {
        const toName = await SpotProject(APP_NAME.SCOPE);

        assertEquals(
            await NameProject(toName, "name-colorless"),
            APP_NAME.SCOPE,
        );
    },
});

Deno.test({
    name: "gets the right fknode.yaml",
    fn: async () => {
        const settings = (await GetProjectEnvironment(TEST_ONE.root)).settings;
        assertEquals(settings, {
            ...DEFAULT_FKNODE_YAML,
            ...(parseYaml(Deno.readTextFileSync(JoinPaths(TEST_ONE.root, "fknode.yaml"))) as any),
        });
    },
});

Deno.test({
    name: "validates projects",
    fn: async () => {
        assertEquals(await ValidateProject(".", true), true);
    },
});
