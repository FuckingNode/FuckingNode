import type { UnknownString } from "@zakahacecosas/string-utils";
import { LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import { NameProject } from "../functions/projects.ts";
import type { FnCPF } from "../types/platform.ts";
import { RecommendedCommunityStandards } from "./toolkit/rcs.ts";
import { ColorString } from "../functions/color.ts";

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

export default async function TheStatistics(target: UnknownString): Promise<void> {
    const env = await GetProjectEnvironment(target);
    const name = await NameProject(env.root, "all");

    LogStuff(
        `${name} · ${ColorString(env.runtime, "bold")} runtime · ${ColorString(env.manager, "bold")} pkg manager`,
    );

    const maxDeps = 3;

    const realDeps = env.main.cpf.deps;
    const deps: string = realDeps
        .toSorted()
        .slice(0, maxDeps)
        .map((dep) =>
            `${ColorString(dep.name, "bold")}@${ColorString(dep.ver, "italic")} ${env.manager === "deno" ? `> ${dep.src}` : ""} # ${
                ColorString(StringifyDependencyRelationship(dep.rel), "italic", "half-opaque")
            }`
        )
        .join("\n");

    if (!deps || deps.length === 0) LogStuff("No dependencies found (impressive).");
    else {
        LogStuff(`\nDepends on ${ColorString(realDeps.length, "bold")} motherfuckers:`);
        LogStuff(
            deps,
        );
        LogStuff(
            realDeps.length >= maxDeps ? `...and ${realDeps.length - maxDeps} more.\n` : "\n",
        );
    }

    if (env.manager === "go" || env.manager === "cargo") return;

    LogStuff("This is how your project compares to the Recommended Community Standards.", "chart");

    RecommendedCommunityStandards(env);
}
