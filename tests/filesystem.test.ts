import { assertEquals } from "@std/assert";
import { CheckForDir, CheckForPath, JoinPaths, ParsePath, ParsePathList } from "../src/functions/filesystem.ts";

Deno.test({
    name: "paths are parsed correctly",
    fn: () => {
        assertEquals(
            ParsePath("."),
            Deno.cwd(),
        );
    },
});

Deno.test({
    name: "path list is parsed correctly",
    fn: () => {
        assertEquals(
            ParsePathList(`${Deno.cwd()}\n${JoinPaths(Deno.cwd(), "test")}\n`),
            [
                Deno.cwd(),
                JoinPaths(Deno.cwd(), "test"),
            ],
        );
    },
});

Deno.test({
    name: "checks for paths and DIRs correctly",
    fn: () => {
        assertEquals(
            CheckForPath(JoinPaths(Deno.cwd(), "fknode.yaml")),
            true,
        );

        assertEquals(
            CheckForPath("non-existing-path"),
            false,
        );

        assertEquals(
            CheckForDir(Deno.cwd()),
            "ValidButNotEmpty",
        );

        assertEquals(
            CheckForPath(Deno.cwd()),
            true,
        );
    },
});
