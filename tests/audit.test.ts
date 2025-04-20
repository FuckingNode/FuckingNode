import { assertEquals } from "@std/assert";
import { ParseNodeReport } from "../src/commands/toolkit/auditer.ts";
import { JoinPaths } from "../src/functions/filesystem.ts";

Deno.test({
    name: "pnpm audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/pnpm.json"),
                ),
                "pnpm",
            ),
            {
                advisories: [
                    "GHSA-29mw-wpgm-hmr9",
                    "GHSA-35jh-r3h4-6jhm",
                    "GHSA-hrpp-h998-j3pp",
                    "GHSA-rv95-896h-c2vc",
                    "GHSA-qwcr-r2fm-qrc7",
                    "GHSA-pxg6-pf52-xh8x",
                    "GHSA-m6fv-jmcg-4jfg",
                    "GHSA-cm22-4g7w-348p",
                    "GHSA-qw6h-vgh9-j6wx",
                    "GHSA-rhx6-c78j-4q9w",
                    "GHSA-9wv6-86v2-598j",
                    "GHSA-jpcq-cgw6-v4j6",
                    "GHSA-gxr4-xjj5-5px2",
                ].sort(),
                breaking: true,
                questions: [
                    "Does your project make HTTP requests and/or depend on networking in any way? [V:NTW]",
                    "Does your project allow access to any custom method via the JavaScript console? [V:JSC]",
                    "Does your project make usage of any database system? [V:INJ]",
                    "Does your project handle user authentication or session management? [V:ATH [SV:AUTH]]",
                    "Does your project handle user authentication or session management? [V:ATH [SV:PRIV]]",
                    "Does your project make use of browser cookies? [V:CKS]",
                    "Does your project allow file uploads or manage files in any way? [V:FLE]",
                ].sort(),
                severity: "high",
            },
        );
    },
});

Deno.test({
    name: "npm audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/npm.json"),
                ),
                "npm",
            ),
            {
                advisories: [
                    "GHSA-29mw-wpgm-hmr9",
                    "GHSA-35jh-r3h4-6jhm",
                    "GHSA-hrpp-h998-j3pp",
                    "GHSA-rv95-896h-c2vc",
                    "GHSA-qwcr-r2fm-qrc7",
                    "GHSA-pxg6-pf52-xh8x",
                    "GHSA-m6fv-jmcg-4jfg",
                    "GHSA-cm22-4g7w-348p",
                    "GHSA-qw6h-vgh9-j6wx",
                    "GHSA-rhx6-c78j-4q9w",
                    "GHSA-9wv6-86v2-598j",
                    "GHSA-jpcq-cgw6-v4j6",
                    "GHSA-gxr4-xjj5-5px2",
                ].sort(),
                breaking: false,
                questions: [
                    "Does your project make use of browser cookies? [V:CKS]",
                ].sort(),
                severity: "high",
            },
        );
    },
});

Deno.test({
    name: "yarn audit works",
    fn: () => {
        assertEquals(
            ParseNodeReport(
                Deno.readTextFileSync(
                    JoinPaths(Deno.cwd(), "tests/environment/test-three/audits/yarn.json.txt"),
                ),
                "yarn",
            ),
            {
                advisories: [
                    "GHSA-29mw-wpgm-hmr9",
                    "GHSA-35jh-r3h4-6jhm",
                    "GHSA-hrpp-h998-j3pp",
                    "GHSA-rv95-896h-c2vc",
                    "GHSA-qwcr-r2fm-qrc7",
                    "GHSA-pxg6-pf52-xh8x",
                    "GHSA-m6fv-jmcg-4jfg",
                    "GHSA-cm22-4g7w-348p",
                    "GHSA-qw6h-vgh9-j6wx",
                    "GHSA-rhx6-c78j-4q9w",
                    "GHSA-9wv6-86v2-598j",
                    "GHSA-jpcq-cgw6-v4j6",
                    "GHSA-gxr4-xjj5-5px2",
                ].sort(),
                breaking: true,
                questions: [
                    "Does your project make HTTP requests and/or depend on networking in any way? [V:NTW]",
                    "Does your project allow access to any custom method via the JavaScript console? [V:JSC]",
                    "Does your project make usage of any database system? [V:INJ]",
                    "Does your project handle user authentication or session management? [V:ATH [SV:AUTH]]",
                    "Does your project handle user authentication or session management? [V:ATH [SV:PRIV]]",
                    "Does your project make use of browser cookies? [V:CKS]",
                    "Does your project allow file uploads or manage files in any way? [V:FLE]",
                ].sort(),
                severity: "high",
            },
        );
    },
});
