/**
 * A simple summary of our security audit.
 */
export type FkNodeSecurityAudit = {
    /**
     * Amount of answers that are positive or imply a decrease in the vulnerability's severity.
     *
     * @type {number}
     */
    positives: number;
    /**
     * Amount of answers that are negative or imply an increase in the vulnerability's severity.
     *
     * @type {number}
     */
    negatives: number;
    /**
     * Final risk factor.
     *
     * @type {number}
     */
    percentage: number;
    /**
     * Name of the audited project. For reporting purposes.
     *
     * @type {?string}
     */
    name?: string;
};

/**
 * A parsed NodeJS report, from either `npm`, `pnpm`, or `yarn`.
 */
export type ParsedNodeReport = {
    /**
     * Do the proposed fixes imply breaking changes?
     *
     * @type {boolean}
     */
    breaking: boolean;
    /**
     * All GHSA identifiers.
     *
     * @type {string[]}
     */
    advisories: string[];
    /**
     * Highest risk found.
     *
     * @type {("low" | "moderate" | "high" | "critical")}
     */
    severity: "low" | "moderate" | "high" | "critical";
    /**
     * Starter questions derived from the report.
     *
     * They contain `[IDs]` inside of the string for identifying them via `.includes()`.
     *
     * @type {string[]}
     */
    questions: string[];
};
