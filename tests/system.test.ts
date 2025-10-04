import { assertThrows } from "@std/assert/throws";
import { LOCAL_PLATFORM } from "../src/platform.ts";
import { Commander, ManagerExists } from "../src/functions/cli.ts";
import { assertEquals } from "@std/assert";
import { CheckForDir, CheckForPath, JoinPaths, ParsePath, ParsePathList } from "../src/functions/filesystem.ts";
import { Notification } from "../src/functions/io.ts";
import { LaunchWebsite } from "../src/functions/http.ts";

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
            ParsePathList(`${Deno.cwd()}\n\n\n${JoinPaths(Deno.cwd(), "test")}\n\n`),
            [
                Deno.cwd(),
                JoinPaths(Deno.cwd(), "test"),
            ],
        );
    },
});

Deno.test({
    name: "checks for paths and DIRs correctly",
    fn: async () => {
        assertEquals(
            CheckForPath(JoinPaths(Deno.cwd(), "fknode.yaml")),
            true,
        );

        assertEquals(
            CheckForPath("non-existing-path"),
            false,
        );

        assertEquals(
            await CheckForDir(Deno.cwd()),
            "ValidButNotEmpty",
        );

        assertEquals(
            CheckForPath("."),
            true,
        );
    },
});

Deno.test({
    name: "detects all managers and runtimes",
    fn: () => {
        assertEquals(ManagerExists("npm"), true);
        assertEquals(ManagerExists("pnpm"), true);
        assertEquals(ManagerExists("yarn"), true);
        assertEquals(ManagerExists("deno"), true);
        assertEquals(ManagerExists("bun"), true);
        assertEquals(ManagerExists("go"), true);
        assertEquals(ManagerExists("cargo"), true);
    },
});

Deno.test({
    name: "commander returns output",
    fn: () => {
        const out = Commander(LOCAL_PLATFORM.SHELL, ["echo", "hi"]);
        assertEquals(out, { success: true, stdout: "hi" });
        assertThrows(() => Commander("i don't exist", []));
    },
});

Deno.test({
    name: "notifications show up",
    fn: () => {
        Notification(
            "I'm a test!",
            "The chaos of maintaining JavaScript projects ends here.",
        );
    },
});

Deno.test({
    name: "websites launch",
    fn: () => {
        LaunchWebsite("https://fuckingnode.github.io/");
    },
});
