import { assertEquals } from "@std/assert/equals";
// import { LOCAL_PLATFORM } from "../src/constants/platform.ts";
import { RunCmdSet, ValidateCmdSet } from "../src/functions/cmd-set.ts";
import { ProjectEnvironment } from "../src/types/platform.ts";
import { GetProjectEnvironment } from "../src/functions/projects.ts";

const env: ProjectEnvironment = await GetProjectEnvironment(".");

Deno.test({
    name: "cmd set is properly parsed",
    fn: () => {
        assertEquals(
            ValidateCmdSet({ env, key: "buildCmd" }),
            [{
                msft: {
                    cmd: [
                        "Write-Host",
                        "'Running",
                        "from",
                        "Windows!'",
                    ],
                    type: "~",
                },
                posix: {
                    cmd: [
                        "echo",
                        "'Running",
                        "from",
                        "Linux!'",
                    ],
                    type: "~",
                },
            }, {
                cmd: [
                    "echo",
                    "'test'",
                ],
                type: "~",
            }, {
                cmd: [
                    "echo",
                    "''",
                ],
                type: "~",
            }, {
                cmd: [
                    "ls",
                ],
                type: "~",
            }, {
                cmd: [
                    "good",
                ],
                type: "$",
            }, {
                cmd: [
                    "src/types/misc.ts",
                    "--args",
                ],
                type: "=",
            }, {
                cmd: [
                    "powershell",
                    "-c",
                    "'echo",
                    "raw",
                    "exec'",
                ],
                type: "<",
            }],
        );
    },
});

Deno.test({
    name: "cmd set runs",
    fn: () => {
        RunCmdSet({ env, key: "buildCmd" });
    },
});
