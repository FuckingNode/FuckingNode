/**
 * @file auditer.ts
 * @author ZakaHaceCosas
 *
 * This file contains the npm / pnpm / yarn compatible audit module (V4).
 *
 * (send help)
 */

import { normalize, normalizeArray, stripCliColors, validate, validateAgainst } from "@zakahacecosas/string-utils";
import type { MANAGER_NODE } from "../../types/platform.ts";
import { ColorString, Interrogate, LogStuff } from "../../functions/io.ts";
import { FkNodeSecurityAudit, ParsedNodeReport } from "../../types/audit.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../../functions/projects.ts";
import { Commander } from "../../functions/cli.ts";
import { APP_NAME, FWORDS } from "../../constants.ts";
import { DEBUG_LOG } from "../../functions/error.ts";
import { VULNERABILITY_VECTORS } from "./vectors.ts";

/**
 * **NPM report.** This interface only types properties of our interest.
 */
interface NPM_REPORT {
    vulnerabilities: Record<
        string,
        {
            severity: "low" | "moderate" | "high" | "critical";
            via: {
                name: string;
                url: `https://github.com/advisories/GHSA-${string}`;
            }[];
            fixAvailable: {
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
 * **BUN report.** This "interface" only types properties of our interest.
 */
type BUN_REPORT = Record<
    string,
    {
        url: string;
        severity: "low" | "moderate" | "high" | "critical";
        vulnerable_versions: string;
        title: string;
    }[]
>;

/**
 * **YARN report.** This interface only types properties of our interest.
 */
type YARN_STUPID_REPORT = {
    type: "auditAdvisory";
    data: {
        advisory: {
            overview: string;
            title: string;
            severity: "low" | "moderate" | "high" | "critical";
            vulnerable_versions: string;
            github_advisory_id: string;
            patched_versions: string;
        };
    };
}[];

type SV_KEYWORDS = { summary: string; overview: string };

/**
 * Analyzes security vulnerability summaries searching for keywords, returns an array of starter questions for the interrogatory.
 *
 * @param {SV_KEYWORDS[]} svKeywords
 */
function AnalyzeSecurityVectorKeywords(svKeywords: SV_KEYWORDS[]): string[] {
    const questions: Set<string> = new Set<string>();

    function includes(target: string, substrings: string[]): boolean {
        return substrings.some((substring) => target.includes(normalize(substring)));
    }

    function has(keywords: SV_KEYWORDS, values: string[]): boolean {
        const details = validate(keywords.summary) ? normalize(keywords.summary) : "";
        const summary = validate(keywords.overview) ? normalize(keywords.overview) : "";
        return includes(summary, values) || includes(details, values);
    }

    for (const keywordPair of svKeywords) {
        if (has(keywordPair, VULNERABILITY_VECTORS.NETWORK)) {
            questions.add(
                "Does your project make HTTP requests and/or depend on networking in any way? [V:NTW]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.COOKIES)) {
            questions.add(
                "Does your project make use of browser cookies? [V:CKS]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.CONSOLE)) {
            questions.add(
                "Does your project allow access to any custom method via the JavaScript console? [V:JSC]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.INJECTION)) {
            questions.add(
                "Does your project make usage of any database system? [V:INJ]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.AUTHENTICATION)) {
            questions.add(
                "Does your project handle user authentication or session management? [V:ATH [SV:AUTH]]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.PRIVILEGES)) {
            questions.add(
                "Does your project handle user authentication or session management? [V:ATH [SV:PRIV]]",
            );
        }

        if (has(keywordPair, VULNERABILITY_VECTORS.FILES)) {
            questions.add(
                "Does your project allow file uploads or manage files in any way? [V:FLE]",
            );
        }
    }

    return ((Array.from(questions)).sort());
}

/** quickly parse semver */
const qps = (s: string): string => s.replaceAll(">", "").replaceAll("<", "").replaceAll("=", "").split(".")[0]!;

/**
 * Parses a NodeJS report, using JSON format.
 *
 * Notes:
 * - npm and pnpm offer statistics, but yarn doesn't; only reason we don't offer vulnerability count (update: it does, but in a separate JSON, so they're hard to gather)
 * - overall yarn JSON is a f\*\*king piece of sh\*t that makes the entire code of this function worse (please deprecate yarn and migrate everyone to pnpm)
 *
 * @param {string} jsonString Report string (JSON PLEASE).
 * @param {MANAGER_NODE} platform Package manager used for the report.
 */
export function ParseNodeBunReport(jsonString: string, platform: MANAGER_NODE | "bun"): ParsedNodeReport {
    /**
     * `yarn audit --json` returns something like THIS:
     * ```json
     * {"jsonThing": "hi"}
     * {"otherJsonThing": "uhh"}
     * // ...
     * ```
     * which is stupid, BECAUSE THAT IS _NOT_ VALID JSON! therefore the name of the variable
     */
    const yarnStupidJsonFormat = normalizeArray(jsonString.split("\n"), "soft").filter((s) => s.includes('{"type":"auditAdvisory"'))
        .map((
            s,
        ) => JSON.parse(s));

    const halfCleanJsonString = stripCliColors(jsonString).split("\n");
    const ib = halfCleanJsonString.findIndex((s) => s.includes("audit v"));
    const cleanJsonString = halfCleanJsonString.filter((s) => s.trim() !== halfCleanJsonString[ib]).filter(validate).join("\n");

    const parsedJson = platform === "yarn" ? yarnStupidJsonFormat : JSON.parse(
        cleanJsonString,
    );

    const brokenDeps: boolean[] = [false];
    const advisories: string[] = [];
    const severities: ("low" | "moderate" | "high" | "critical")[] = [];
    const initialKws: SV_KEYWORDS[] = [];

    if (platform === "yarn") {
        // * STUPID YARN IMPLEMENTATION * //
        const report = parsedJson as YARN_STUPID_REPORT;

        for (const _entry of report) {
            const entry = _entry.data.advisory;
            /** Compares major SemVer version of current version and fixed version. */
            const impliesBreakingChanges = qps(entry.patched_versions) ===
                qps(entry.vulnerable_versions);

            brokenDeps.push(impliesBreakingChanges);
            severities.push(entry.severity);
            advisories.push(entry.github_advisory_id);
            initialKws.push({
                summary: entry.title,
                overview: entry.overview,
            });
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
    } else if (platform === "bun") {
        // * STUPIDN'T BUN IMPLEMENTATION * //
        // (kind of, it is a bit stupid to not copy the npm one... but it is what it is)
        const report = parsedJson as BUN_REPORT;

        for (const _entry of Object.values(report)) {
            for (const entry of _entry) {
                const advisory = entry.url
                    .split("https://github.com/advisories/")[1];

                if (advisory) advisories.push(advisory);
                severities.push(entry.severity);
                // ! this is technically wrong
                // but since we can't tell, we say it is true, for safety
                brokenDeps.push(true);
                // bun reports do not include a detailed description, so we gotta live with this
                initialKws.push({ summary: entry.title, overview: entry.title });
            }
        }
    } else {
        // * STUPIDN'T PNPM IMPLEMENTATION * //
        const report = parsedJson as PNPM_REPORT;

        for (const entry of Object.values(report.advisories)) {
            /** Compares major SemVer version of current version and fixed version. */
            const impliesBreakingChanges = qps(entry.findings[0]!.version) ===
                qps(entry.patched_versions);

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
        advisories: Array.from(new Set(advisories)).sort(),
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
 * @returns {InterrogatoryResponse} An `InterrogatoryResponse`
 */
function askQuestion(
    question: string,
    isFollowUp: boolean,
    isReversed: boolean,
    worth: 1 | 2,
): InterrogatoryResponse {
    const formattedQuestion = ColorString(question, isFollowUp ? "bright-blue" : "bright-yellow", "italic");
    const answered = Interrogate(formattedQuestion);
    const truthValue = isReversed ? !answered : answered;
    const value = worth === 1 ? "+1" : "+2";

    return `${truthValue ? "true" : "false"}${value}`;
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

    const isTrue = (s: InterrogatoryResponse): boolean => validateAgainst(s, ["true+2", "true+1"]);

    // TODO - add detailed questions for new vectors
    for (const question of questions) {
        const response = handleQuestion({ q: question, f: false, r: true, w: 1 });

        // specific follow-up questions based on user responses
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
        if (!isTrue(response) && question.includes("V:NTW")) {
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
        if (!isTrue(response) && question.includes("V:JSC")) {
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
            `Seems like we're okay, one ${FWORDS.MFN} project less to take care of!\nNever forget the best risk is no risk - we still encourage you to fix the vulnerabilities if you can.`;
    } else if (percentage >= 20 && percentage < 50) {
        color = "bright-yellow";
        message = `${ColorString("There is a potential risk", "bold")} of these vulnerabilities causing you a headache.\nWhile you ${
            ColorString("might", "italic")
        } be able to live with them, you should fix them.`;
    } else {
        color = "red";
        message = `${
            ColorString(`Oh ${FWORDS.FK}`, "bold")
        }. This project really should get all vulnerabilities fixed.\nBreaking changes can hurt, but your app security's breaking hurts a lot more. ${
            ColorString("Please, fix this issue.", "bold")
        }`;
    }
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
        }\n===    STARTING ${APP_NAME.CASED} SECURITY AUDIT    ===\n`,
    );

    LogStuff("Please answer these questions. We'll use your responses to evaluate this vulnerability:\n", "bulb");

    const audit = InterrogateVulnerableProject(questions);
    const { negatives, positives } = audit;

    const severityDeBump = severity === "critical" ? 0.25 : severity === "high" ? 0.5 : severity === "moderate" ? 0.75 : 1;
    const severityBump = severity === "critical" ? 2 : severity === "high" ? 2.75 : severity === "moderate" ? 1.5 : 1.25;

    const total = positives + (negatives * severityDeBump);
    const percentage = ((positives + negatives) === 0 || negatives === 0)
        ? 0
        : Math.min(100, Math.max(0, ((negatives * severityBump) / total) * 100));

    DEBUG_LOG("RF", percentage, "N", negatives, "P", positives, "SB", severityBump, "SDB", severityDeBump);

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
        env.commands.audit === "__UNSUPPORTED" || env.manager === "deno" || env.manager === "cargo" ||
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

    const audit = AuditProject(ParseNodeBunReport(res.stdout, env.manager));

    Deno.chdir(current);

    return audit;
}
