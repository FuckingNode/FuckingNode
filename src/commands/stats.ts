import type { UnknownString } from "@zakahacecosas/string-utils";
import { LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import type { FnCPF } from "../types/platform.ts";
import { RecommendedCommunityStandards } from "./toolkit/rcs.ts";
import { bold, dim, italic } from "@std/fmt/colors";

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

    LogStuff(
        `${env.names.full}\n${bold(env.runtime)} runtime · ${bold(env.manager)} pkg manager`,
    );

    const maxDeps = 3;

    const realDeps = env.mainCPF.deps;
    const deps: string = realDeps
        .toSorted()
        .slice(0, maxDeps)
        .map((dep) =>
            `${bold(dep.name)}@${italic(dep.ver)} ${env.manager === "deno" ? `> ${dep.src}` : ""} # ${
                italic(dim(StringifyDependencyRelationship(dep.rel)))
            }`
        )
        .join("\n");

    if (!deps || deps.length === 0) LogStuff("No dependencies found (impressive).");
    else {
        LogStuff(`\nDepends on ${bold(realDeps.length.toString())} motherfuckers:`);
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
