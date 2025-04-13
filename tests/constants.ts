import { DEFAULT_FKNODE_YAML, VERSION } from "../src/constants.ts";
import { JoinPaths, ParsePath } from "../src/functions/filesystem.ts";
import type { ProjectEnvironment } from "../src/types/platform.ts";

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
        settings: DEFAULT_FKNODE_YAML,
        runtimeColor: "green",
        main: {
            path: ParsePath(`${CONSTANTS.ENV_PATH}/test-one/package.json`),
            name: "package.json",
            stdContent: JSON.parse(await Deno.readTextFile(ParsePath(`${CONSTANTS.ENV_PATH}/test-one/package.json`))),
            cpfContent: {
                name: "uwu.js",
                version: "1.0.0",
                rm: "npm",
                perPlatProps: { cargo_edt: undefined },
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
                fknVer: VERSION,
            },
        },
        commands: {
            base: "npm",
            clean: [
                [
                    "dedupe",
                ],
                [
                    "prune",
                ],
            ],
            exec: [
                "npx",
            ],
            update: [
                "update",
            ],
            audit: [
                "audit",
                "--json",
            ],
            run: ["npm", "run"],
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
        workspaces: [ParsePath(`${CONSTANTS.ENV_PATH}/test-two`)],
    },
};

export const TEST_ONE = TEST_PROJECTS["ONE"]!;
