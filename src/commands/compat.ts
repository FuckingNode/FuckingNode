import { normalize, table, validate } from "@zakahacecosas/string-utils";
import { LogStuff } from "../functions/io.ts";
import type { TheCompaterConstructedParams } from "./_interfaces.ts";
import { bold, brightBlue, brightGreen, brightRed, brightYellow } from "@std/fmt/colors";

const y = brightGreen("Yes");
const n = brightRed("No");
const p = brightYellow("Partial");
const a = brightBlue("(Agnostic)");

const featureCompatibility = [
    { Feature: "Cleanup", NodeJS: y, Deno: p, Bun: p, Go: p, Cargo: p },
    { Feature: "Kickstart", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
    { Feature: "Commit", NodeJS: a, Deno: a, Bun: a, Go: a, Cargo: a },
    { Feature: "Uncommit", NodeJS: a, Deno: a, Bun: a, Go: a, Cargo: a },
    { Feature: "Release", NodeJS: y, Deno: y, Bun: y, Go: n, Cargo: y },
    { Feature: "Stats", NodeJS: y, Deno: y, Bun: y, Go: p, Cargo: y },
    { Feature: "Surrender", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
    { Feature: "Setup", NodeJS: a, Deno: a, Bun: a, Go: a, Cargo: a },
    { Feature: "Audit", NodeJS: y, Deno: y, Bun: y, Go: n, Cargo: n },
    { Feature: "Launch", NodeJS: a, Deno: a, Bun: a, Go: a, Cargo: a },
    { Feature: "Terminate", NodeJS: p, Deno: p, Bun: p, Go: y, Cargo: y },
];

const advancedFeatureCompatibility = [
    { Option: "Lint", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
    { Option: "Pretty", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
    { Option: "Destroy", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
    { Option: "Update", NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
];

const kickstartCompatibility = [
    { NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
];

const launchCompatibility = [
    { NodeJS: y, Deno: y, Bun: y, Go: y, Cargo: y },
];

const commitCompatibility = [
    { NodeJS: y, Deno: y, Bun: y, Go: p, Cargo: p },
];

const releaseCompatibility = [
    { NodeJS: y, Deno: y, Bun: y, Go: n, Cargo: n },
];

const migrateCompatibility = [
    { From: "NodeJS", To: "Deno", Supported: y },
    { From: "NodeJS", To: "Bun", Supported: y },
    { From: "Deno", To: "NodeJS", Supported: y },
    { From: "Bun", To: "NodeJS", Supported: y },
    { From: "---", To: "---", Supported: "---" },
    { From: "NodeJS / npm", To: "pnpm / yarn", Supported: y },
    { From: "NodeJS / pnpm", To: "npm / yarn", Supported: y },
    { From: "NodeJS / yarn", To: "npm / pnpm", Supported: y },
];

function overallSupport(): void {
    LogStuff("OVERALL SUPPORT ---");
    LogStuff(table(featureCompatibility));
    LogStuff(
        "'Yes', 'No', 'Partial' indicate the obvious.\n'(Agnostic)' indicates that the feature runs anywhere, even if not listed here.\n\nFor specific compatibility details, run 'compat' followed by any of these:\ncleaner, kickstart, release, migrate, commit, launch.",
    );
    return;
}

export default function TheCompater(params: TheCompaterConstructedParams): void {
    LogStuff(
        `${
            bold("This table shows feature compatibility across environments.")
        }\nMore details available at https://fuckingnode.github.io/crossruntime`,
        "bulb",
    );

    if (!validate(params.target)) {
        overallSupport();
        return;
    }

    switch (normalize(params.target, { strict: true })) {
        case "cleaner":
        case "advanced":
            LogStuff("ADVANCED CLEANER FEATURES SUPPORT ---");
            LogStuff(table(advancedFeatureCompatibility));
            return;
        case "kickstart":
            LogStuff("KICKSTART FEATURE SUPPORT ---");
            LogStuff(table(kickstartCompatibility));
            // IDEs too, this is simple so i ain't extracting to a constant
            LogStuff(`Supported IDEs: ${["VSCode", "VSCodium", "Notepad++", "Sublime", "Emacs", "Atom"].join(", ")}`);
            // git clients too, this is simple too so i ain't extracting to a constant
            LogStuff("Supported Git client aliases:");
            LogStuff(table([
                { "Alias": "gh", "Points to": "GitHub", "That means": "github.com/USER/REPO" },
                { "Alias": "gl", "Points to": "GitLab", "That means": "gitlab.com/USER/REPO" },
                { "Alias": "bb", "Points to": "Bitbucket", "That means": "bitbucket.org/USER/REPO" },
                { "Alias": "sr", "Points to": "SourceForge", "That means": "sourceforge.net/p/USER/REPO" },
                { "Alias": "bbp", "Points to": "Bitbucket Pipelines", "That means": "bitbucket.org/USER/REPO/pipelines" },
                { "Alias": "gist", "Points to": "GitHub Gist", "That means": "gist.github.com/USER/REPO" },
                { "Alias": "cb", "Points to": "Codeberg", "That means": "codeberg.org/USER/REPO" },
                { "Alias": "gt", "Points to": "Gitee", "That means": "gitee.com/USER/REPO" },
                { "Alias": "fg", "Points to": "Framagit", "That means": "framagit.org/USER/REPO" },
                { "Alias": "op", "Points to": "OpenPrivacy Git", "That means": "git.openprivacy.ca/USER/REPO" },
            ]));
            return;
        case "commit":
            LogStuff("COMMIT FEATURE SUPPORT ---");
            LogStuff(table(commitCompatibility));
            return;
        case "migrate":
            LogStuff("MIGRATE FEATURE SUPPORT ---");
            LogStuff(table(migrateCompatibility));
            return;
        case "release":
            LogStuff("RELEASE FEATURE SUPPORT ---");
            LogStuff(table(releaseCompatibility));
            return;
        case "launch":
            LogStuff("LAUNCH FEATURE SUPPORT ---");
            LogStuff(table(launchCompatibility));
            // IDEs too, this is simple so i ain't extracting to a constant
            LogStuff(`Supported IDEs: ${["VSCode", "VSCodium", "Notepad++", "Sublime", "Emacs", "Atom"].join(", ")}`);
            return;
        default:
            overallSupport();
            return;
    }
}
