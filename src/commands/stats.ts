import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";
import { I_LIKE_JS } from "../constants.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { NameProject } from "../functions/projects.ts";
import type { FnCPF } from "../types/platform.ts";

function StringifyDependencyRelationship(rel: FnCPF["deps"][0]["rel"]): string {
    return rel === "univ:dep"
        ? "Dependency"
        : rel === "univ:devD"
        ? "Dev Dependency"
        : rel === "js:peer"
        ? "JS Peer Dependency"
        : rel === "go:ind"
        ? "Indirect Dependency"
        : rel === "rst:buildD"
        ? "Rust Build Dependency"
        : "Dependency...?";
}

export default function TheStatistics(target: UnknownString) {
    const project = SpotProject(target);
    const env = GetProjectEnvironment(project);
    const name = NameProject(project, "all");

    LogStuff(
        `${name} · ${ColorString(env.runtime, "bold")} runtime · ${ColorString(env.manager, "bold")} pkg manager`,
    );

    const maxDeps = 3;

    const realDeps = env.main.cpfContent.deps;
    const deps: string = realDeps
        .toSorted()
        .slice(0, maxDeps)
        .map((dep) =>
            `${ColorString(dep.name, "bold")}@${ColorString(dep.ver, "italic")} ${env.manager === "deno" ? `> ${dep.src}` : ""} # ${
                ColorString(StringifyDependencyRelationship(dep.rel), "italic", "half-opaque")
            }`
        )
        .join("\n");

    if (!deps || deps.length === 0) {
        LogStuff("No dependencies found (impressive).");
    } else {
        LogStuff(`\nDepends on ${ColorString(realDeps.length, "bold")} ${I_LIKE_JS.MFS}:`);
        LogStuff(
            deps,
        );
        LogStuff(
            realDeps.length >= maxDeps ? `...and ${realDeps.length - maxDeps} more.\n` : "\n",
        );
    }

    if (env.manager === "go" || env.manager === "cargo") return;

    LogStuff("This is how your project compares to the Recommended Community Standards.", "chart");

    // deno-lint-ignore no-explicit-any
    const content = env.main.stdContent as any;

    if (StringUtils.validateAgainst(env.runtime, ["node", "bun"])) {
        const { private: p, license: l, author: a, contributors: c, description: d, repository: r, bugs: b, type: t } = content;

        LogStuff(
            p ? "This is a private project. Running generic checks." : "This is a public project. Running additional package checks.",
            "bulb",
        );

        LogStuff(l ? `${l} license, good.` : "No license found. You should specify it!", l ? "tick" : "error");
        if (!p || a) {
            LogStuff(
                a ? `Made by ${typeof a === "string" ? a : a.name}, nice.` : "No author found. Who made this 'great' code?",
                a ? "tick" : "error",
            );
        }
        LogStuff(
            c
                ? `So we've got ${c.length} contributor(s), great.`
                : "No contributors found. If none, that's fine, but if someone helps, mention them.",
            c ? "tick" : "bruh",
        );
        LogStuff(
            d ? `${ColorString(d, "italic")}, neat description.` : "No description found. What does your code even do?",
            d ? "tick" : "error",
        );
        if (!p) {
            LogStuff(r ? `Known repo URL, awesome.` : "You didn't specify a repository, why?", r ? "tick" : "error");
            LogStuff(
                b ? `Known bug-report URL, incredible.` : "You didn't specify where to report bugs. Don't be lazy and accept feedback!",
                b ? "tick" : "error",
            );
        }

        LogStuff(
            t === "module"
                ? "This is an ESM project, lovely."
                : `Using CommonJS is not 'wrong', but not ideal. Consider switching to ESM.${
                    t ? "" : "\nNote: The 'type' field was not specified, so Node assumes CJS. If you use ESM, specify type='module'."
                }`,
            t ? "tick" : "bruh",
        );
    } else {
        // this is very basic tbh, a deno.json doesn't have much
        const { lint, fmt, lock } = content;

        LogStuff(
            lint ? `Found lint configurations. That's good!` : "No lint configurations found.",
            lint ? "tick" : "bruh",
        );
        LogStuff(
            fmt ? `Found formatting configurations. That's good!` : "No formatting configurations found.",
            fmt ? "tick" : "bruh",
        );
        LogStuff(
            lock ? `Found lockfile configurations. That's good!` : "Why did you disable the lockfile???",
            lock ? "tick" : "bruh",
        );
    }
}
