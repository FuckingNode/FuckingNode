import { assertEquals } from "@std/assert/equals";
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
                    "src/types/misc.ts",
                    "--args",
                ],
                type: "=",
            }, {
                msft: {
                    cmd: [
                        "powershell",
                        "-c",
                        "'echo",
                        "raw",
                        "exec'",
                    ],
                    type: "<",
                },
                posix: {
                    cmd: [
                        "bash",
                        "-c",
                        "'echo",
                        "raw",
                        "exec'",
                    ],
                    type: "<",
                },
            }, [{
                cmd: [
                    "echo",
                    "'a'",
                    ">",
                    "a.txt",
                ],
                type: "~",
            }, {
                cmd: [
                    "echo",
                    "'b'",
                    ">",
                    "b.txt",
                ],
                type: "~",
            }, {
                cmd: [
                    "echo",
                    "'c'",
                    ">",
                    "c.txt",
                ],
                type: "~",
            }, {
                cmd: [
                    "echo",
                    "'d'",
                    ">",
                    "d.txt",
                ],
                type: "~",
            }], [
                {
                    cmd: [
                        "rm",
                        "a.txt",
                    ],
                    type: "~",
                },
                {
                    cmd: [
                        "rm",
                        "b.txt",
                    ],
                    type: "~",
                },
                {
                    cmd: [
                        "rm",
                        "c.txt",
                    ],
                    type: "~",
                },
                {
                    cmd: [
                        "rm",
                        "d.txt",
                    ],
                    type: "~",
                },
            ]],
        );
    },
});

Deno.test({
    name: "cmd set runs",
    fn: async () => {
        await RunCmdSet({ env, key: "buildCmd" });
    },
});
