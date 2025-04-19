import { LOCAL_PLATFORM } from "../src/constants.ts";
import { Commander, CommandExists } from "../src/functions/cli.ts";
import { assertEquals } from "@std/assert";

// ACTUAL TESTS
// this test requires you to have the 3 titans (node deno and bun) and the 3 node sub-titans (npm pnpm and yarn)
// it also requires go and cargo
Deno.test({
    name: "detects all managers and runtimes",
    fn: () => {
        assertEquals(CommandExists("npm"), true);
        assertEquals(CommandExists("pnpm"), true);
        assertEquals(CommandExists("yarn"), true);
        assertEquals(CommandExists("deno"), true);
        assertEquals(CommandExists("bun"), true);
        assertEquals(CommandExists("go"), true);
        assertEquals(CommandExists("cargo"), true);
    },
});

Deno.test({
    name: "commander returns output",
    fn: () => {
        if (LOCAL_PLATFORM.SYSTEM === "windows") {
            const out = Commander("powershell", ["echo", "hi"], false);
            assertEquals(out, { success: true, stdout: "hi\r\n\n" });
        } else {
            const out = Commander("echo", ["hi"], false);
            assertEquals(out, { success: true, stdout: "hi\n\n" });
        }
    },
});
