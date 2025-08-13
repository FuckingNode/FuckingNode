import { LOCAL_PLATFORM } from "../src/constants/platform.ts";
import { RunBuildCmds } from "../src/functions/build.ts";

Deno.test({
    name: "build cmds run",
    fn: () => {
        const shell = LOCAL_PLATFORM.SYSTEM === "windows" ? "powershell " : "";
        RunBuildCmds([
            `${shell}echo 'test'`,
            `${shell}ls`,
            `${shell}echo 'works'`,
            `${shell}echo ''`,
        ]);
    },
});
