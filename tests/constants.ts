import { DEFAULT_FKNODE_YAML } from "../src/constants.ts";
import { JoinPaths, ParsePath } from "../src/functions/filesystem.ts";
import type { ProjectEnvironment } from "../src/types/platform.ts";
import * as DenoJson from "../deno.json" with { type: "json" };

// CONSTANTS
export const CONSTANTS = {
    CWD: Deno.cwd(),
    ENV_PATH: JoinPaths(Deno.cwd(), "tests/environment"),
    INTEROP_PATH: JoinPaths(Deno.cwd(), "tests/interop"),
};

// (naming things is fr the hardest)
const TEST_PROJECTS: Record<string, ProjectEnvironment> = {
    ONE: {
        root: ParsePath(`${CONSTANTS.ENV_PATH}/test-one`),
        names: {
            full:
                "\x1b[92m\x1b[1muwu.js\x1b[22m\x1b[39m@\x1b[35m1.0.0\x1b[39m \x1b[2m\x1b[3mC:\\Users\\Zaka\\proyectitos\\FuckingNode\\tests\\environment\\test-one\x1b[23m\x1b[22m",
            name: "\x1b[92m\x1b[1muwu.js\x1b[22m\x1b[39m",
            nameVer: "\x1b[92m\x1b[1muwu.js\x1b[22m\x1b[39m@\x1b[35m1.0.0\x1b[39m",
            path: "\x1b[2m\x1b[3mC:\\Users\\Zaka\\proyectitos\\FuckingNode\\tests\\environment\\test-one\x1b[23m\x1b[22m",
        },
        settings: {
            ...DEFAULT_FKNODE_YAML,
            destroy: {
                intensities: [
                    "*",
                ],
                targets: [
                    "node_modules/",
                ],
            },
            flagless: {
                flaglessCommit: false,
                flaglessDestroy: true,
                flaglessLint: true,
                flaglessPretty: true,
                flaglessUpdate: true,
            },
        },
        runtimeColor: "bright-green",
        main: {
            path: ParsePath(`${CONSTANTS.ENV_PATH}/test-one/package.json`),
            name: "package.json",
            std: JSON.parse(Deno.readTextFileSync(ParsePath(`${CONSTANTS.ENV_PATH}/test-one/package.json`))),
            cpf: {
                name: "uwu.js",
                version: "1.0.0",
                rm: "npm",
                plat: { edt: null },
                deps: [
                    {
                        name: "tslib",
                        ver: "^2.0.0",
                        rel: "univ:dep",
                        src: "npm",
                    },
                ],
                ws: [
                    ParsePath(`${CONSTANTS.ENV_PATH}/test-two`),
                ],
                fknVer: DenoJson.default.version,
            },
        },
        commands: {
            base: "npm",
            dlx: ["npx"],
            clean: [
                [
                    "dedupe",
                ],
                [
                    "prune",
                ],
            ],
            update: [
                "update",
            ],
            audit: [
                "audit",
                "--json",
            ],
            file: ["node"],
            script: ["npm", "run"],
            publish: ["publish"],
            start: "start",
        },
        runtime: "node",
        manager: "npm",
        lockfile: {
            name: "package-lock.json",
            path: ParsePath(`${CONSTANTS.ENV_PATH}/test-one/package-lock.json`),
        },
        hall_of_trash: ParsePath(`${CONSTANTS.ENV_PATH}/test-one/node_modules`),
    },
};

export const TEST_ONE = TEST_PROJECTS["ONE"]!;
