import { assertEquals } from "@std/assert";
import { ParseNodeReport } from "../src/commands/toolkit/auditer.ts";
import type { ParsedNodeReport } from "../src/types/audit.ts";
import { JoinPaths } from "../src/functions/filesystem.ts";

// UHM YEAH i'm lazy to do this, I test in production and it works so yeah
const expected: ParsedNodeReport = {
    breaking: true,
    advisories: [],
    severity: "critical",
    questions: [""],
};

Deno.test({
    name: "pnpm audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/audit-pnpm.txt"),
                ),
                "pnpm",
            ),
            expected,
        );
    },
});

Deno.test({
    name: "npm audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/audit-npm.txt"),
                ),
                "npm",
            ),
            expected,
        );
    },
});

Deno.test({
    name: "yarn audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/audit-yarn.txt"),
                ),
                "yarn",
            ),
            expected,
        );
    },
});
