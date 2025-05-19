import { LOCAL_PLATFORM } from "../src/constants.ts";
import { Commander, ManagerExists } from "../src/functions/cli.ts";
import { assertEquals } from "@std/assert";

// ACTUAL TESTS
// this test requires you to have the 3 titans (node deno and bun) and the 3 node sub-titans (npm pnpm and yarn)
// it also requires go and cargo
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
        if (LOCAL_PLATFORM.SYSTEM === "windows") {
            const out = Commander("powershell", ["echo", "hi"], false);
            assertEquals(out, { success: true, stdout: "hi\r\n\n" });
        } else {
            const out = Commander("echo", ["hi"], false);
            assertEquals(out, { success: true, stdout: "hi\n\n" });
        }
    },
});
