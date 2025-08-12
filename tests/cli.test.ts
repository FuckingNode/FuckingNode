import { assertThrows } from "@std/assert/throws";
import { LOCAL_PLATFORM } from "../src/constants/platform.ts";
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
        const command = LOCAL_PLATFORM.SYSTEM === "windows" ? "powershell" : "echo";
        const args = LOCAL_PLATFORM.SYSTEM === "windows" ? ["echo", "hi"] : ["hi"];
        const expected = LOCAL_PLATFORM.SYSTEM === "windows" ? "hi\r\n" : "hi\n\n";

        const out1 = Commander(command, args, false);
        assertEquals(out1, { success: true, stdout: expected });
        const out2 = Commander(command, args, true);
        assertEquals(out2, { success: true });
        assertThrows(() => Commander("i don't exist", []));
    },
});
