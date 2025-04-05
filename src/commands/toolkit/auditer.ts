// send help

import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";
import { APP_NAME, I_LIKE_JS } from "../../constants.ts";
import { Commander } from "../../functions/cli.ts";
import { ColorString, Interrogate, LogStuff } from "../../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../../functions/projects.ts";
import type {
    AnalyzedIndividualSecurityVulnerability,
    ApiFetchedIndividualSecurityVulnerability,
    FkNodeSecurityAudit,
    ParsedNodeReport,
} from "../../types/audit.ts";
import type { tURL } from "../../types/misc.ts";

/**
 * Gets a package's security vulnerabilities from OSV.dev.
 *
 * @async
 * @param {string} packageName Name of the package.
 * @returns {Promise<ApiFetchedIndividualSecurityVulnerability[]>} Array of vulnerabilities associated to the package.
 */
async function FetchVulnerability(packageName: string): Promise<ApiFetchedIndividualSecurityVulnerability[]> {
    const response = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            package: {
                name: packageName,
                ecosystem: "npm",
            },
        }),
    });

    if (!response.ok) throw new Error(`Error checking with OSV.dev: ${response.statusText}`);

    const data: { vulns: ApiFetchedIndividualSecurityVulnerability[] | undefined } = await response.json();

    return data.vulns || [];
}

const VULNERABILITY_VECTORS = {
    NETWORK: [
        "http",
        "https",
        "proxy",
        "redirect",
        "fetch",
        "request",
        "xhr",
        "XMLHttpRequest",
        "ws",
        "WebSocket",
        "api",
        "origin",
        "csrf",
        "Cross-Site Request Forgery",
        "samesite",
        "referer",
        "url",
        "headers",
        "get",
        "post",
        "put",
        "delete",
        "content-type",
        "cors",
        "Cross-Origin Resource Sharing",
        "exfiltration",
    ],
    COOKIE: [
        "cookie",
        "session",
        "set-cookie",
        "secure",
        "httponly",
        "samesite",
        "storage",
        "cache",
        "persistence",
        "expiration",
        "csrf",
        "auth-cookie",
        "token-cookie",
    ],
    CONSOLE: [
        "console",
        "terminal",
    ],
};

/**
 * Analyzes security vulnerabilities searching for keywords, returns an array of starter questions for the interrogatory. While unused, also returns the keywords (`vectors`) found.
 *
 * @param {ApiFetchedIndividualSecurityVulnerability[]} vulnerabilities
 */
function AnalyzeVulnerabilities(vulnerabilities: ApiFetchedIndividualSecurityVulnerability[]): {
    questions: string[];
    vectors: string[];
} {
    const questions: Set<string> = new Set<string>();
    const vectors: Set<string> = new Set<string>();

    function includes(target: string, substrings: string[]): boolean {
        return substrings.some((substring) => target.includes(StringUtils.normalize(substring)));
    }

    function has(vuln: ApiFetchedIndividualSecurityVulnerability, keywords: string[]): boolean {
        const details = StringUtils.normalize(vuln.details.toString());
        const summary = StringUtils.normalize(vuln.summary);
        return includes(summary, keywords) || includes(details, keywords);
    }

    for (const vulnerability of vulnerabilities) {
        if (has(vulnerability, VULNERABILITY_VECTORS.NETWORK)) {
            questions.add(
                "Does your app make HTTP requests and/or depend on networking in any way? [V:NW]",
            );
            vectors.add("network");
        }

        if (has(vulnerability, VULNERABILITY_VECTORS.COOKIE)) {
            questions.add(
                "Does your app make use of browser cookies? [V:CK]",
            );
            vectors.add("cookie");
        }

        if (has(vulnerability, VULNERABILITY_VECTORS.CONSOLE)) {
            questions.add(
                "Does your app allow access to the browser or JavaScript console?\n(Web apps obviously do; we ask for cases like Electron or ReactNative apps). [V:JSC]",
            );
            vectors.add("console");
        }
    }

    return {
        questions: Array.from(questions),
        vectors: Array.from(vectors),
    };
}

/**
 * Asks a question for the interrogatory, returns a "stringified boolean" (weird, I know, we had to pivot a little bit), depending on the response. `"true"` means the user response is something to worry about, `"false"` means it's not.
 *
 * @param {string} question Question itself.
 * @param {boolean} isFollowUp If true, question is a follow up to another question.
 * @param {boolean} isReversed If true, responding "yes" to the question means it's not a vulnerability (opposite logic).
 * @returns {"true" | "false"}
 */
function askQuestion(question: string, isFollowUp: boolean, isReversed: boolean): "true" | "false" {
    const formattedQuestion = ColorString(question, isFollowUp ? "bright-blue" : "bright-yellow", "italic");
    if (Interrogate(formattedQuestion)) return isReversed ? "false" : "true";
    return isReversed ? "true" : "false";
}

/**
 * Interrogates a vulnerability, based on base questions (obtained from `AnalyzeVulnerabilities()`) and asking more in-depth questions based on user response.
 *
 * @async
 * @param {string[]} questions Base questions.
 * @returns {Promise<FkNodeSecurityAudit>}
 */
async function InterrogateVulnerability(questions: string[]): Promise<FkNodeSecurityAudit> {
    const responses: ("true" | "false")[] = [];

    // I REMADE BOOLEANS AS STRINGS IN PURPOSE
    // ! DON'T QUESTION IT
    async function handleAskQuestion(q: string, f: boolean, r: boolean): Promise<"true" | "false"> {
        const qu = await askQuestion(q, f, r);
        responses.push(qu);
        return qu;
    }

    for (const question of questions) {
        const response = await handleAskQuestion(question, false, false);

        // specific follow-up questions based on user responses
        // to further interrogate da vulnerability
        // im the king of naming functions fr fr
        if (response === "true" && question.includes("V:CK")) {
            await handleAskQuestion(
                "Are cookies being set with the 'Secure' and 'HttpOnly' flags?",
                true,
                true,
            );
            await handleAskQuestion(
                "Are your cookies being shared across domains?",
                true,
                false,
            );
            const followUpThree = await handleAskQuestion(
                "Are you using cookies to store user sensitive data (such as their login)?",
                true,
                false,
            );
            if (followUpThree === "true") {
                await handleAskQuestion(
                    "Do these cookies store sensitive data directly (e.g., a user token that grants automatic access), or is there an additional layer of protection for their content?",
                    true,
                    false,
                );
            }
        }

        if (response === "true" && question.includes("V:NW")) {
            await handleAskQuestion(
                "Does any of that HTTP requests include any sensitive data? Such as login credentials, user data, etc...",
                true,
                false,
            );
            await handleAskQuestion(
                "Do you use Secure HTTP (HTTPS) for some or all requests?",
                true,
                true,
            );
            const followUpThree = await handleAskQuestion(
                "Does your app use WebSockets or similar persistent connections?",
                true,
                false,
            );
            if (followUpThree === "true") {
                LogStuff(
                    "We'll use the word 'WebSockets', however these questions apply for any other kind of persistent connection, like WebRTC.",
                    undefined,
                    "italic",
                );
                await handleAskQuestion(
                    "Do you use Secure WebSockets (WSS) for some or all connections?",
                    true,
                    true,
                );
                await handleAskQuestion(
                    "WebSockets are used for real-time communication in your app. In your app, is it possible for a user to access sensitive data or perform administrative actions from another client without additional authorization? For example, in a real-time document editing app, changing permissions or seeing emails from other users?",
                    true,
                    false,
                );
            }
        }

        if (question.includes("V:JSC")) {
            if (response === "true") {
                const followUpOne = await handleAskQuestion(
                    "Do you have any method and/or API exposed that can be used from the console?",
                    true,
                    false,
                );
                if (followUpOne === "true") {
                    await handleAskQuestion(
                        "Does that include risky methods? For example, in Discord you can get an account's token from the JS console (risky method).",
                        true,
                        false,
                    );
                }
            } else if (response === "false") {
                const followUpOne = await handleAskQuestion(
                    "You said your app doesn't allow access to the console. Is there, still, any way of executing JS commands within your app that you're aware of?",
                    true,
                    false,
                );
                if (followUpOne === "true") {
                    await handleAskQuestion(
                        "Do you have control over it? So you can disable certain methods, and/or disable it entirely.",
                        true,
                        true,
                    );
                }
            }
        }
    }

    const { positives, negatives } = responses.reduce(
        (acc, value) => {
            if (value === "true") {
                acc.positives += 1;
            } else if (value === "false") {
                acc.negatives += 1;
            }
            return acc;
        },
        { positives: 0, negatives: 0 },
    );

    const total = positives + negatives;
    const percentage = Math.abs((positives / total) * 100);

    return {
        positives,
        negatives,
        percentage,
    };
}

/**
 * Formats and displays the audit results.
 *
 * @param {number} percentage Percentage result.
 * @returns {void}
 */
function DisplayAudit(percentage: number): void {
    let color: "bright-yellow" | "red" | "bright-green";
    let message: string;
    if (percentage < 20) {
        color = "bright-green";
        message =
            `Seems like we're okay, one ${I_LIKE_JS.MFN} project less to take care of!\nNever forget the best risk is no risk - we still encourage you to fix the vulnerabilities if you can.`;
    } else if (percentage >= 20 && percentage < 50) {
        color = "bright-yellow";
        message = `${ColorString("There is a potential risk", "bold")} of these vulnerabilities causing you a headache.\nWhile you ${
            ColorString("might", "italic")
        } be able to live with them, you should fix them.`;
    } else {
        color = "red";
        message = `${
            ColorString(`Oh ${I_LIKE_JS.FK}`, "bold")
        }. This project really should get all vulnerabilities fixed.\nBreaking changes can hurt, but your app security's breaking hurts a lot more. ${
            ColorString("Please, fix this issue.", "bold")
        }`;
    }
    console.log("");
    const percentageString = ColorString(
        `${percentage.toFixed(2)}%`,
        color,
        "bold",
    );
    LogStuff(
        `We've evaluated your responses and concluded a risk factor of ${percentageString}.`,
    );
    LogStuff(message);
    console.log("");
}

function GetHighestSeverity(severities: string[]): "low" | "moderate" | "high" | "critical" {
    if (severities.includes("critical")) {
        return "critical";
    } else if (severities.includes("high")) {
        return "high";
    } else if (severities.includes("moderate")) {
        return "moderate";
    } else if (severities.includes("low")) {
        return "low";
    } else {
        // 1. rare edge case, we should have detected a severity already
        // 2. just in case, default to moderate instead of low (as we don't really know what's up)
        return "moderate";
    }
}
const validSeverity = (s: UnknownString): s is "low" | "moderate" | "high" | "critical" => {
    return StringUtils.validate(s) && ["low", "moderate", "high", "critical"].includes(s);
};
const validUrl = (s: UnknownString): s is tURL => {
    return StringUtils.validate(s) && StringUtils.normalize(s).startsWith("https://");
};

/**
 * Takes the output of npm audit command and parses it to get what we care about.
 *
 * _Don't tell me about npm audit --json, I know that exists, we parse bare output by design, not by mistake._
 *
 * TODO - forgetting the stupid message above and migrating to JSON based reports
 * ! - see "audit-v4.ts" in this folder
 *
 * @export
 * @param {string} report
 * @returns {ParsedNodeReport}
 */
export function ParseNpmReport(report: string): ParsedNodeReport {
    const vulnerablePackages: AnalyzedIndividualSecurityVulnerability[] = [];
    const directlyAffectedDependencies: string[] = [];
    const indirectlyAffectedDependencies: string[] = [];
    const severities: string[] = [];
    let breakingChanges = false;
    let nonBreakingChanges = false;

    const lines = StringUtils.normalizeArray(report.split("\n"));

    const installations: Record<string, string> = {}; // "packageName": "installed version"
    let currentPackage: string = "";

    lines.forEach((line) => {
        if (!line.startsWith("#") && lines[lines.indexOf(line) + 1]?.includes("severity")) {
            currentPackage = line.split(" ")[0]!;
        }

        const installMatch = line.match(/will\s+install\s+\S+@([^\s]+)/i);
        if (currentPackage && installMatch && installMatch[1]) {
            installations[currentPackage] = installMatch[1].replace(",", "");
        }
    });

    lines.forEach((line) => {
        if (
            !line.startsWith("#") &&
            (lines[lines.indexOf(line) + 2] || lines[lines.indexOf(line) + 3] || "").includes("severity") &&
            (lines[lines.indexOf(line) + 2] || lines[lines.indexOf(line) + 3] || "").includes("fix available")
        ) {
            const match = line.split(" ");
            const i = lines.indexOf(line);
            const sev = lines[i + 1]?.split(" ")[1];
            const advUrl = lines[i + 2]?.split(" - ")[1]?.trim();
            if (match[0] && match[1] && validSeverity(sev)) {
                const entry: AnalyzedIndividualSecurityVulnerability = {
                    packageName: match[0],
                    vulnerableVersions: match.slice(1).join("").replace("-", ","),
                    severity: sev,
                    advisoryUrl: validUrl(advUrl) ? advUrl : undefined,
                    patchedVersions: installations[match[0]] || "UNKNOWN",
                };
                vulnerablePackages.push(entry);
            }
        } else if (line.includes("fix available via") && line.includes("--force")) {
            // fix (breaking)
            breakingChanges = true;
        } else if (line.includes("fix available via") && !line.includes("--force")) {
            // fix (non breaking)
            nonBreakingChanges = true;
        } else if (line.startsWith("node_modules")) {
            // extract affected dependencies
            const match = line.match(/node_modules\/([\w-]+)/);
            if (match && match[1]) {
                if (line.includes("depends on vulnerable versions")) {
                    indirectlyAffectedDependencies.push(match[1]);
                } else {
                    directlyAffectedDependencies.push(match[1]);
                }
            }
        } else if (/severity:\s*(\w+)/.test(line)) {
            // get severity
            const match = line.match(/severity:\s*(\w+)/);
            if (match && match[1]) {
                severities.push(match[1]);
            }
        }
    });

    // determine the kind of change
    let changeType: "noBreak" | "break" | "both" = "noBreak";

    if (breakingChanges && nonBreakingChanges) {
        changeType = "both";
    } else if (breakingChanges) {
        changeType = "break";
    } else {
        changeType = "noBreak";
    }

    return {
        vulnerablePackages: Array.from(new Set(vulnerablePackages)).sort(), // (Set to remove duplicates)
        changeType,
        directDependencies: Array.from(new Set(directlyAffectedDependencies)).sort(),
        indirectDependencies: [...new Set(indirectlyAffectedDependencies)],
        risk: GetHighestSeverity(severities),
    };
}

export function ParsePnpmYarnReport(report: string, target: "pnpm" | "yarn"): ParsedNodeReport {
    const vulnerablePackages: AnalyzedIndividualSecurityVulnerability[] = [];
    const severities: string[] = [];
    // it's the stupid fact that they put the "┬" in different places what forces me to differentiate pnpm from yarn
    const stupidYarnBlock = "┌───────────────┬──────────────────────────────────────────────────────────────┐";
    const stupidPnpmBlock = "┌─────────────────────┬────────────────────────────────────────────────────────┐";
    const blocks = report.split(target === "pnpm" ? stupidPnpmBlock : stupidYarnBlock)
        .map((i) => i.replaceAll("\r\n", "\n"));

    for (const block of blocks) {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

        let severity = "";
        let packageName = "";
        let vulnerableVersions = "__unknown"; // TODO - yarn doesn't give this
        let patchedVersions = "";
        const paths: string[] = [];
        let advisoryUrl = "";

        for (const line of lines) {
            if (
                line.startsWith("│ low") || line.startsWith("│ moderate") || line.startsWith("│ high") ||
                line.startsWith("│ critical")
            ) {
                severity = line.split(" ")[1]!.trim();
                severities.push(StringUtils.normalize(severity));
                // summary = line.split("│")[2]!.trim();
            } else if (line.startsWith("│ Package")) {
                packageName = line.split("│")[2]?.trim() || "";
            } else if (line.startsWith("│ Vulnerable versions")) {
                vulnerableVersions = line?.split("│").slice(2).toString().replaceAll(",", "").trim().replace(" ", ",");
            } else if (line.startsWith("│ Patched versions") || line.startsWith("│ Patched in")) {
                patchedVersions = line?.split("│").slice(2).toString().replaceAll(",", "").trim().replace(" ", ",");
            } else if (line.startsWith("│ Paths")) {
                // NOTE - unused as of now.
                paths.push(...line.split("│").slice(2).map((a) => a.trim()).filter((b) => b !== ""));
            } else if (line.startsWith("│ More info")) {
                advisoryUrl = (line.split("│")[2] ?? "").trim();
            }
        }

        severity = StringUtils.normalize(severity);

        if (validSeverity(severity) && packageName && validUrl(advisoryUrl)) {
            vulnerablePackages.push({
                severity,
                packageName,
                vulnerableVersions,
                patchedVersions,
                advisoryUrl,
            });
        }
    }

    return {
        vulnerablePackages: Array.from(new Set(vulnerablePackages)).sort(),
        directDependencies: Array.from(new Set(vulnerablePackages.map((p) => p.packageName))).sort(), // todo
        indirectDependencies: [], // todo
        changeType: "break", // todo
        risk: GetHighestSeverity(vulnerablePackages.map((p) => p.severity)),
    };
}

/**
 * Handler function for auditing a project.
 *
 * @export
 * @async
 * @param {ParsedNodeReport} bareReport Parsed npm audit.
 * @param {boolean} strict If true, uses a slightly stricter criteria for the audit.
 * @returns {Promise<FkNodeSecurityAudit>}
 */
export async function AuditProject(bareReport: ParsedNodeReport, strict: boolean): Promise<FkNodeSecurityAudit> {
    const { vulnerablePackages, risk } = bareReport;

    const vulnerabilities: ApiFetchedIndividualSecurityVulnerability[] = [];

    for (const dependency of vulnerablePackages) {
        const res = await FetchVulnerability(dependency.packageName);
        vulnerabilities.push(...res);
    }

    const totalVulnerabilities: number = vulnerabilities.length;

    LogStuff(
        `\n===        FOUND VULNERABILITIES (${totalVulnerabilities.toString().padStart(3, "0")})        ===\n${
            ColorString(vulnerabilities.map((vuln) => vuln.id).join(" & "), "bold")
        }\n===    STARTING ${APP_NAME.STYLED} SECURITY AUDIT    ===`,
    );

    console.log("");
    LogStuff("Please answer these questions. We'll use your responses to evaluate this vulnerability:", "bulb");
    console.log("");

    const { questions } = AnalyzeVulnerabilities(vulnerabilities);

    const audit = await InterrogateVulnerability(questions);
    const { negatives, positives } = audit;

    const riskBump = risk === "critical" ? 1 : risk === "high" ? 0.75 : risk === "moderate" ? 0.5 : 0.25;

    // neg += riskBump;
    // LEGACY IMPLEMENTATION
    const classicPercentage = (positives + negatives) > 0 ? (positives / (positives + negatives)) * 100 : 0;

    const revampedStrictPercentage = (classicPercentage + (riskBump * 100)) / 2;

    const percentage = strict ? revampedStrictPercentage : classicPercentage;

    // ATTEMPTS OF IMPROVEMENT THAT NEVER WORKED OUT :(
    // const tweakedPercentage = (neg === 0) ? 0 : Math.abs(((pos + riskBump) / (pos + neg)) * 100);
    // const strictPercentage = Math.abs(pos - neg) !== 0 ? ((pos / (pos + neg)) + (riskBump / (riskBump + neg - pos))) * 100 : 0;
    await DisplayAudit(percentage);
    return {
        negatives,
        positives,
        percentage,
    };
}

/**
 * Audits a project for security vulnerabilities. Returns 0 if no vulnerabilities are found, 1 if the project manager doesn't support auditing, or the audit results.
 *
 * @export
 * @async
 * @param {string} project Path to project to be audited.
 * @param {boolean} strict If true, uses a slightly stricter criteria for the audit.
 * @returns {Promise<
 *     | FkNodeSecurityAudit
 *     | 0
 *     | 1
 * >}
 */
export async function PerformAuditing(project: string, strict: boolean): Promise<
    | FkNodeSecurityAudit
    | 0
    | 1
> {
    const workingPath = SpotProject(project);
    const env = GetProjectEnvironment(workingPath);
    const name = NameProject(env.root, "name-ver");
    const current = Deno.cwd();
    // === "__UNSUPPORTED" already does the job, but typescript wants me to specify
    if (
        env.commands.audit === "__UNSUPPORTED" || env.manager === "deno" || env.manager === "bun" || env.manager === "cargo" ||
        env.manager === "go"
    ) {
        LogStuff(
            `Audit is unsupported for ${env.manager.toUpperCase()} (${project}).`,
            "prohibited",
        );
        return 1;
    }
    Deno.chdir(env.root);

    LogStuff(`Auditing ${name} [${ColorString(env.commands.audit.join(" "), "italic", "half-opaque")}]`, "working");
    const res = Commander(
        env.commands.base,
        env.commands.audit,
        false,
    );

    if (res.success) {
        LogStuff(
            `Clear! There aren't any known vulnerabilities affecting ${name}.`,
            "tick",
        );
        return 0;
    }

    const bareReport = (env.manager === "npm") ? ParseNpmReport(res.stdout ?? "") : ParsePnpmYarnReport(res.stdout ?? "", env.manager);

    if (bareReport.vulnerablePackages.length === 0) {
        if (!res.stdout || res.stdout?.trim() === "") {
            LogStuff(
                `An error occurred at ${name} and we weren't able to get the stdout. Unable to audit.`,
                "error",
            );
            return 1;
        }
        LogStuff(
            `Clear! There aren't any known vulnerabilities affecting ${name}.`,
            "tick",
        );
        return 0;
    }

    const audit = await AuditProject(bareReport, strict);

    Deno.chdir(current);

    return audit;
}
