import { assertEquals } from "@std/assert";
import { Git } from "../src/functions/git.ts";
import { APP_NAME } from "../src/constants.ts";

Deno.test({
    name: "gets git branches",
    fn: () => {
        const branches = Git.GetBranches(APP_NAME.SCOPE);
        assertEquals(
            branches,
            {
                current: "v3",
                all: [
                    "v3",
                    "v2",
                    "master",
                    "feature-audit",
                ].sort(),
            },
        );
    },
});

Deno.test({
    name: "gets git latest tag",
    fn: () => {
        const tag = Git.GetLatestTag(APP_NAME.SCOPE);
        assertEquals(
            tag,
            "2.2.1", // TODO - assuming tags use semver version, make this use the value from deno.json so we're not changing this each time for tests to pass
        );
    },
});
