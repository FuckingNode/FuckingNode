import { StringUtils } from "@zakahacecosas/string-utils";
import { ColorString, LogStuff } from "../functions/io.ts";
import type { TheCompaterConstructedParams } from "./constructors/command.ts";
import { APP_URLs } from "../constants.ts";

const labels = {
    y: ColorString("Yes", "bright-green"),
    n: ColorString("No", "red"),
    p: ColorString("Partial", "bright-yellow"),
    npm: ColorString("npm", "bright-green"),
    jsr: ColorString("jsr", "bright-green"),
};

const featureCompatibility = [
    { Feature: "Cleanup", NodeJS: labels.y, Deno: labels.p, Bun: labels.p, Go: labels.p, Cargo: labels.p },
    { Feature: "Kickstart", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Feature: "Commit", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.p, Cargo: labels.p },
    { Feature: "Release", NodeJS: labels.npm, Deno: labels.jsr, Bun: labels.npm, Go: labels.n, Cargo: labels.n },
    { Feature: "Stats", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.p, Cargo: labels.y },
    { Feature: "Surrender", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Feature: "Setup", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Feature: "Audit", NodeJS: labels.y, Deno: labels.n, Bun: labels.n, Go: labels.n, Cargo: labels.n },
    { Feature: "Launch", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
];

const advancedFeatureCompatibility = [
    { Option: "Lint", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Option: "Pretty", NodeJS: labels.y, Deno: labels.p, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Option: "Destroy", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Option: "Update", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
];

const kickstartCompatibility = [
    { NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
];

const launchCompatibility = [
    { NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
];

const commitCompatibility = [
    { NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.p, Cargo: labels.p },
];

const releaseCompatibility = [
    { NodeJS: labels.npm, Deno: labels.jsr, Bun: labels.npm, Go: labels.n, Cargo: labels.n },
];

const auditCompatibility = [
    { NodeJS: labels.y, Deno: labels.n, Bun: labels.n, Go: labels.n, Cargo: labels.n },
];

const migrateCompatibility = [
    { From: "NodeJS", To: "Deno", Supported: labels.y },
    { From: "NodeJS", To: "Bun", Supported: labels.y },
    { From: "Deno", To: "NodeJS", Supported: labels.y },
    { From: "Bun", To: "NodeJS", Supported: labels.y },
    { From: "---", To: "---", Supported: "---" },
    { From: "NodeJS / npm", To: "pnpm / yarn", Supported: labels.y },
    { From: "NodeJS / pnpm", To: "npm / yarn", Supported: labels.y },
    { From: "NodeJS / yarn", To: "npm / pnpm", Supported: labels.y },
];

function overallSupport() {
    LogStuff("OVERALL SUPPORT ---");
    LogStuff(StringUtils.table(featureCompatibility));
    LogStuff(
        "For specific compatibility details, run 'compat' followed by any of these: cleaner, kickstart, release, migrate, commit, audit, launch.",
    );
    return;
}

export default function TheCompater(params: TheCompaterConstructedParams) {
    LogStuff(
        `${
            ColorString("This table shows feature compatibility across environments.", "bold")
        }\nMore details available at ${APP_URLs.WEBSITE}crossruntime`,
        "bulb",
    );

    if (!StringUtils.validate(params.target)) {
        overallSupport();
        return;
    }

    switch (StringUtils.normalize(params.target, { strict: true })) {
        case "cleaner":
        case "advanced":
            LogStuff("ADVANCED CLEANER FEATURES SUPPORT ---");
            LogStuff(StringUtils.table(advancedFeatureCompatibility));
            return;
        case "kickstart":
            LogStuff("KICKSTART FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(kickstartCompatibility));
            // IDEs too, this is simple so i ain't extracting to a constant
            LogStuff(`Supported IDEs: ${["VSCode", "VSCodium", "Notepad++", "Sublime", "Emacs", "Atom"].join(", ")}`);
            // git clients too, this is simple too so i ain't extracting to a constant
            LogStuff("Supported Git client aliases:");
            LogStuff(StringUtils.table([
                { "Alias": "gh", "Points to": "GitHub", "That means": "github.com/USER/REPO" },
                { "Alias": "gl", "Points to": "GitLab", "That means": "gitlab.com/USER/REPO" },
                { "Alias": "bb", "Points to": "Bitbucket", "That means": "bitbucket.org/USER/REPO" },
                { "Alias": "sr", "Points to": "SourceForge", "That means": "sourceforge.net/p/USER/REPO" },
                { "Alias": "bbp", "Points to": "Bitbucket Pipelines", "That means": "bitbucket.org/USER/REPO/pipelines" },
                { "Alias": "gist", "Points to": "GitHub Gist", "That means": "gist.github.com/USER/REPO" },
                { "Alias": "gb", "Points to": "Codeberg", "That means": "codeberg.org/USER/REPO" },
                { "Alias": "gt", "Points to": "Gitee", "That means": "gitee.com/USER/REPO" },
                { "Alias": "fg", "Points to": "Framagit", "That means": "framagit.org/USER/REPO" },
                { "Alias": "op", "Points to": "OpenPrivacy Git", "That means": "git.openprivacy.ca/USER/REPO" },
            ]));
            return;
        case "commit":
            LogStuff("COMMIT FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(commitCompatibility));
            return;
        case "migrate":
            LogStuff("MIGRATE FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(migrateCompatibility));
            return;
        case "release":
            LogStuff("RELEASE FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(releaseCompatibility));
            return;
        case "audit":
            LogStuff("AUDIT FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(auditCompatibility));
            return;
        case "launch":
            LogStuff("LAUNCH FEATURE SUPPORT ---");
            LogStuff(StringUtils.table(launchCompatibility));
            // IDEs too, this is simple so i ain't extracting to a constant
            LogStuff(`Supported IDEs: ${["VSCode", "VSCodium", "Notepad++", "Sublime", "Emacs", "Atom"].join(", ")}`);
            return;
        default:
            overallSupport();
            return;
    }
}
