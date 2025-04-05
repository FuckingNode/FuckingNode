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
    { Feature: "Stats", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.p, Cargo: labels.p },
    { Feature: "Surrender", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
    { Feature: "Setup", NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.y, Cargo: labels.y },
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

const commitCompatibility = [
    { NodeJS: labels.y, Deno: labels.y, Bun: labels.y, Go: labels.p, Cargo: labels.p },
];

const releaseCompatibility = [
    { NodeJS: labels.npm, Deno: labels.jsr, Bun: labels.npm, Go: labels.n, Cargo: labels.n },
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

const overallSupport = () => {
    LogStuff("OVERALL SUPPORT ---");
    LogStuff(StringUtils.table(featureCompatibility));
    LogStuff("For specific compatibility details, run 'compat' followed by any of these: cleaner, kickstart, release, migrate, commit.");
    return;
};

export default function TheCompater(params: TheCompaterConstructedParams) {
    LogStuff(
        `${
            ColorString("This table shows feature compatibility across environments.", "bold")
        }\nMore details available at ${APP_URLs.WEBSITE}manual/cross-runtime`,
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
            LogStuff(StringUtils.table([
                { "Supported IDEs": ["VSCode", "VSCodium", "Notepad++", "Sublime", "Emacs", "Atom"] },
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
        default:
            overallSupport();
            return;
    }
}
