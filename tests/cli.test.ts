import { LOCAL_PLATFORM } from "../src/constants.ts";
import { Commander, CommandExists } from "../src/functions/cli.ts";
import { assertEquals } from "@std/assert";

// ACTUAL TESTS
// this test requires you to have the 3 titans (node deno and bun) and the 3 node sub-titans (npm pnpm and yarn)
// it also requires go and cargo
Deno.test({
    name: "detects all managers and runtimes",
    fn: () => {
        // TODO - one-line-ize
        const npm = CommandExists("npm");
        assertEquals(npm, true);
        const pnpm = CommandExists("pnpm");
        assertEquals(pnpm, true);
        const yarn = CommandExists("yarn");
        assertEquals(yarn, true);
        const deno = CommandExists("deno");
        assertEquals(deno, true);
        const bun = CommandExists("bun");
        assertEquals(bun, true);
        const go = CommandExists("go");
        assertEquals(go, true);
        const cargo = CommandExists("cargo");
        assertEquals(cargo, true);
    },
});

Deno.test({
    name: "commander returns output",
    fn: () => {
        // TODO - test linux too
        if (LOCAL_PLATFORM.SYSTEM === "windows") {
            const out = Commander("powershell", ["echo", "hi"], false);
            assertEquals(out, { success: true, stdout: "hi\r\n\n" });
        }
    },
});
