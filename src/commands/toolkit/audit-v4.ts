/**
 * @file audit-v4.ts
 * @author ZakaHaceCosas
 *
 * This file contains the new, JSON-based, npm / pnpm / yarn compatible audit module.
 *
 * (send help)
 */

import { StringUtils } from "@zakahacecosas/string-utils";
import type { MANAGER_NODE } from "../../types/platform.ts";
import { ColorString, Interrogate, LogStuff } from "../../functions/io.ts";
import { FkNodeSecurityAudit, ParsedNodeReport } from "../../types/audit.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../../functions/projects.ts";
import { Commander } from "../../functions/cli.ts";
import { APP_NAME, I_LIKE_JS } from "../../constants.ts";
import { DEBUG_LOG } from "../../functions/error.ts";

/**
 * **NPM report.** This interface only types properties of our interest.
 */
interface NPM_REPORT {
    vulnerabilities: Record<
        string,
        {
            name: string;
            severity: "low" | "moderate" | "high" | "critical";
            isDirect: boolean;
            via: {
                name: string;
                url: `https://github.com/advisories/GHSA-${string}`;
            }[];
            /** (shouldn't this be "affects"? npm is built differently, i guess) */
            effects: string[];
            fixAvailable: {
                name: string;
                version: string;
                /** true = breaking changes */
                isSemVerMajor: boolean;
            };
        }
    >;
}

/** Individual item of a `PNPM_REPORT` */
interface PNPM_REPORT_ITEM {
    /** `findings.version` = CURRENT (affected) version */
    findings: {
        /** current, broken version the user is using */
        version: string;
    }[];
    /** nerdy text. */
    overview: string;
    /** how bad this is. */
    severity: "low" | "moderate" | "high" | "critical";
    /** github advisory identifier */
    github_advisory_id: string;
    /** what version is needed to fix this */
    patched_versions: string;
    /** name of the vulnerability */
    title: string;
}

/**
 * **PNPM report.** This interface only types properties of our interest.
 */
interface PNPM_REPORT {
    advisories: Record<
        string,
        PNPM_REPORT_ITEM
    >;
}

/**
 * **YARN report.** This interface only types properties of our interest.
 */
type YARN_STUPID_REPORT = {
    type: "auditAdvisory";
    data: {
        resolution: {
            path: string;
            dev: boolean;
        };
        advisory: {
            overview: string;
            module_name: string;
            title: string;
            vulnerable_versions: string;
            github_advisory_id: string;
            patched_versions: string;
        };
    };
}[];

/** Vulnerability vector keywords.
 *
 * - TODO: Extract to somewhere else
 * - TODO 2: Add more vectors
 * - (implicit) TODO 3: add more questions
 */
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
    COOKIES: [
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
 * Analyzes security vulnerability summaries searching for keywords, returns an array of starter questions for the interrogatory.
 *
 * @param {{ summary: string; overview: string }[]} svKeywords
 */
function AnalyzeSecurityVectorKeywords(svKeywords: { summary: string; overview: string }[]): string[] {
    const questions: Set<string> = new Set<string>();
    const vectors: Set<string> = new Set<string>();

    function includes(target: string, substrings: string[]): boolean {
        return substrings.some((substring) => target.includes(StringUtils.normalize(substring)));
    }

    function has(keywords: { summary: string; overview: string }, values: string[]): boolean {
        const details = StringUtils.validate(keywords.summary) ? StringUtils.normalize(keywords.summary) : "";
        const summary = StringUtils.validate(keywords.overview) ? StringUtils.normalize(keywords.overview) : "";
        return includes(summary, values) || includes(details, values);
    }

    for (const keywordPair of svKeywords) {
        if (has(keywordPair, VULNERABILITY_VECTORS.NETWORK)) {
            questions.add(
                "Does your app make HTTP requests and/or depend on networking in any way? [V:NTW]",
            );
            vectors.add("network");
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.COOKIES)) {
            questions.add(
                "Does your app make use of browser cookies? [V:CKS]",
            );
            vectors.add("cookie");
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.CONSOLE)) {
            questions.add(
                "Does your app allow access to any custom method via the JavaScript console? [V:JSC]",
            );
            vectors.add("console");
        }
    }

    return Array.from(questions);
}

/**
 * Parses a NodeJS report, using JSON format.
 *
 * Notes:
 * - npm and pnpm offer statistics, but yarn doesn't; only reason we don't offer vulnerability count
 * - overall yarn JSON is a f\*\*king piece of sh\*t that makes the entire code of this function worse (please deprecate yarn and use pnpm)
 *
 * @param {string} jsonString Report string (JSON PLEASE).
 * @param {MANAGER_NODE} platform Package manager used for the report.
 */
export function ParseNodeReport(jsonString: string, platform: MANAGER_NODE): ParsedNodeReport {
    /**
     * `yarn audit --json` returns something like THIS:
     * ```json
     * {"jsonThing": "hi"}
     * {"otherJsonThing": "uhh"}
     * // ...
     * ```
     * which is stupid, BECAUSE THAT IS _NOT_ VALID JSON! therefore the name of the variable
     */
    const yarnStupidJsonFormat = StringUtils.softlyNormalizeArray(jsonString.split("\n")).filter((s) => s.includes('{"type":"auditAdvisory"'))
        .map((
            s,
        ) => JSON.parse(s));

    const parsedJson = platform === "yarn" ? yarnStupidJsonFormat : JSON.parse(jsonString);

    const brokenDeps: boolean[] = [false];
    const advisories: string[] = [];
    const severities: ("low" | "moderate" | "high" | "critical")[] = [];
    const initialKws: { summary: string; overview: string }[] = [];

    if (platform === "yarn") {
        // * STUPID YARN IMPLEMENTATION * //
        const report = parsedJson as YARN_STUPID_REPORT;
        console.debug(report);
        for (const _entry of report) {
            const entry = _entry.data;
            entry.advisory;
        }
    } else if (platform === "npm") {
        // * STUPIDN'T NPM IMPLEMENTATION * //
        const report = parsedJson as NPM_REPORT;

        for (const entry of Object.values(report.vulnerabilities)) {
            /** Compares major SemVer version of current version and fixed version. */
            const impliesBreakingChanges = entry.fixAvailable.isSemVerMajor;

            const filteredAdvisories = entry.via
                .filter((e) => e.url)
                .map((e) => e.url.split("https://github.com/advisories/")[1])
                .filter((v) => v !== undefined);

            advisories.push(...filteredAdvisories);
            severities.push(entry.severity);
            brokenDeps.push(impliesBreakingChanges);
            initialKws.push(...entry.via.map((e) => {
                // npm reports do not include a detailed description, so we gotta live with this
                return {
                    summary: e.name,
                    overview: e.name,
                };
            }));
        }
    } else {
        // * STUPIDN'T PNPM IMPLEMENTATION * //
        const report = parsedJson as PNPM_REPORT;

        for (const entry of Object.values(report.advisories)) {
            /** Compares major SemVer version of current version and fixed version. */
            const impliesBreakingChanges = entry.findings[0]?.version.split(".")[0] ===
                entry.patched_versions.replaceAll(">", "").replaceAll("<", "").replaceAll("=", "").split(".")[0];

            advisories.push(entry.github_advisory_id);
            severities.push(entry.severity);
            brokenDeps.push(impliesBreakingChanges);
            initialKws.push({
                summary: entry.title,
                overview: entry.overview,
            });
        }
    }

    const questions = AnalyzeSecurityVectorKeywords(initialKws);
    let severity: "low" | "moderate" | "high" | "critical";

    if (severities.includes("critical")) {
        severity = "critical";
    } else if (severities.includes("high")) {
        severity = "high";
    } else if (severities.includes("moderate")) {
        severity = "moderate";
    } else {
        severity = "low";
    }

    const breaking = brokenDeps.includes(true);

    return {
        advisories,
        severity,
        breaking,
        questions,
    };
}

/** Possible responses of an interrogatory question. */
type InterrogatoryResponse = "true+1" | "true+2" | "false+1" | "false+2";

/**
 * Asks a question for the interrogatory, returns a "stringified boolean" (weird, I know, we had to pivot a little bit), depending on the response. `"true"` means the user response is something to worry about, `"false"` means it's not.
 *
 * @param {string} question Question itself.
 * @param {boolean} isFollowUp If true, question is a follow up to another question.
 * @param {boolean} isReversed If true, responding "yes" to the question means it's not a vulnerability (opposite logic).
 * @param {1 | 2} worth What is the question worth? +1 to pos/neg or +2?
 * @returns {"true" | "false"}
 */
function askQuestion(question: string, isFollowUp: boolean, isReversed: boolean, worth: 1 | 2): InterrogatoryResponse {
    const formattedQuestion = ColorString(question, isFollowUp ? "bright-blue" : "bright-yellow", "italic");
    if (Interrogate(formattedQuestion)) return isReversed ? (worth === 2 ? "false+1" : "false+2") : (worth === 2 ? "true+1" : "true+2");
    return isReversed ? (worth === 2 ? "true+1" : "true+2") : (worth === 2 ? "false+1" : "false+2");
}

/**
 * Interrogates a vulnerability, based on base questions (obtained from `AnalyzeVulnerabilities()`) and asking more in-depth questions based on user response.
 *
 * @param {string[]} questions Base questions.
 * @returns {FkNodeSecurityAudit}
 */
export function InterrogateVulnerableProject(questions: string[]): Omit<
    FkNodeSecurityAudit,
    "percentage"
> {
    const responses: InterrogatoryResponse[] = [];

    function handleQuestion(params: {
        /** QUESTION ITSELF */
        q: string;
        /** IS IT A FOLLOW UP? */
        f: boolean;
        /** IF TRUE, RESPONDING "Y" SUMS TO NEGATIVES, ELSE TO POSITIVES */
        r: boolean;
        /** SUM 1 OR 2? */
        w: 1 | 2;
    }): InterrogatoryResponse {
        const { q, f, r, w } = params;
        const qu = askQuestion(q, f, r, w);
        responses.push(qu);
        return qu;
    }

    const isTrue = (s: InterrogatoryResponse): boolean => StringUtils.validateAgainst(s, ["true+2", "true+1"]);

    for (const question of questions) {
        const response = handleQuestion({ q: question, f: false, r: false, w: 1 });

        // specific follow-up questions based on user responses
        // to further interrogate da vulnerability
        // im the king of naming functions fr fr
        if (!isTrue(response) && question.includes("V:CKS")) {
            handleQuestion(
                { q: "Are cookies being set with the 'Secure' and 'HttpOnly' flags?", f: true, r: false, w: 1 },
            );
            handleQuestion(
                { q: "Are your cookies being shared across domains?", f: true, r: true, w: 1 },
            );
            const followUp = handleQuestion(
                { q: "Are you using cookies to store sensitive data (such as user login)?", f: true, r: true, w: 2 },
            );
            if (!isTrue(followUp)) {
                handleQuestion(
                    {
                        q: "Do these cookies store sensitive data directly (e.g., a user token that grants automatic access) without an additional layer of protection for their content?",
                        f: true,
                        r: true,
                        w: 1,
                    },
                );
            }
        }

        if (isTrue(response) && question.includes("V:NTW")) {
            handleQuestion(
                {
                    q: "Does any of that HTTP requests include any sensitive data? Such as login credentials, user data, etc...",
                    f: true,
                    r: true,
                    w: 2,
                },
            );
            handleQuestion(
                { q: "Do you use HTTP Secure (HTTPS) for all requests?", f: true, r: false, w: 2 },
            );
            const followUp = handleQuestion(
                { q: "Does your app use WebSockets or similar persistent connections?", f: true, r: true, w: 2 },
            );
            if (!isTrue(followUp)) {
                LogStuff(
                    "We'll use the word 'WebSockets', however these questions apply for any other kind of persistent connection, like WebRTC.",
                    undefined,
                    "italic",
                );
                handleQuestion(
                    { q: "Do you use Secure WebSockets (WSS) for some or all connections?", f: true, r: false, w: 2 },
                );
                handleQuestion(
                    {
                        q: "WebSockets are used for real-time communication in your app. In your app, is it possible for a user to access sensitive data or perform administrative actions from another client without additional authorization? For example, in a real-time document editing app, changing permissions or seeing emails from other users?",
                        f: true,
                        r: true,
                        w: 2,
                    },
                );
            }
        }

        if (isTrue(response) && question.includes("V:JSC")) {
            handleQuestion(
                {
                    q: "Does that include risky methods? For example, in Discord you can get an account's token from the JS console (risky method).",
                    f: true,
                    r: true,
                    w: 2,
                },
            );
        }
    }

    const { positives, negatives } = responses.reduce(
        (acc, value) => {
            if (value === "true+1") acc.positives += 1;
            else if (value === "true+2") acc.positives += 2;
            else if (value === "false+1") acc.negatives += 1;
            else acc.negatives += 2;
            return acc;
        },
        { positives: 0, negatives: 0 },
    );

    DEBUG_LOG(
        "P",
        positives,
        "N",
        negatives,
    );

    return {
        positives,
        negatives,
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
}

/**
 * Handler function for auditing a project.
 *
 * @export
 * @param {ParsedNodeReport} bareReport Parsed npm audit.
 * @returns {FkNodeSecurityAudit}
 */
export function AuditProject(bareReport: ParsedNodeReport): FkNodeSecurityAudit {
    const { advisories, questions, severity } = bareReport;

    const totalAdvisories: number = advisories.length;

    LogStuff(
        `\n===        FOUND VULNERABILITIES (${totalAdvisories.toString().padStart(3, "0")})        ===\n${
            ColorString(advisories.join(" & "), "bold")
        }\n===    STARTING ${APP_NAME.STYLED} SECURITY AUDIT    ===`,
    );

    console.log("");
    LogStuff("Please answer these questions. We'll use your responses to evaluate this vulnerability:", "bulb");
    console.log("");

    const audit = InterrogateVulnerableProject(questions);
    const { negatives, positives } = audit;

    const severityDeBump = severity === "critical" ? 0.25 : severity === "high" ? 0.5 : severity === "moderate" ? 0.75 : 1;
    const severityBump = severity === "critical" ? 2 : severity === "high" ? 2.75 : severity === "moderate" ? 1.5 : 1.25;

    const total = positives + (negatives * severityDeBump);
    const percentage = total === 0 ? 0 : Math.min(100, Math.max(0, ((negatives * severityBump) / total) * 100));

    // neg += riskBump;
    // LEGACY IMPLEMENTATIONS
    // const classicPercentage = (positives + negatives) > 0 ? (positives / (positives + negatives)) * 100 : 0;

    // const revampedStrictPercentage = (classicPercentage + (severityBump * 100)) / 2;

    // ATTEMPTS OF IMPROVEMENT THAT NEVER WORKED OUT :(
    // const tweakedPercentage = (neg === 0) ? 0 : Math.abs(((pos + riskBump) / (pos + neg)) * 100);
    // const strictPercentage = Math.abs(pos - neg) !== 0 ? ((pos / (pos + neg)) + (riskBump / (riskBump + neg - pos))) * 100 : 0;
    DisplayAudit(percentage);
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
 * @param {string} project Path to project to be audited.
 * @returns {FkNodeSecurityAudit | 0 | 1}
 */
export function PerformAuditing(project: string): FkNodeSecurityAudit | 0 | 1 {
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

    if (!res.stdout || res.stdout?.trim() === "") {
        LogStuff(
            `An error occurred at ${name} and we weren't able to get the stdout. Unable to audit.`,
            "error",
        );
        return 1;
    }

    const bareReport = ParseNodeReport(res.stdout, env.manager);

    const audit = AuditProject(bareReport);

    Deno.chdir(current);

    return audit;
}
