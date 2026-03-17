import { CheckForPath, GetTextIndentSize, JoinPaths } from "../functions/filesystem.ts";
import { Interrogate, LogStuff, StringifyYaml } from "../functions/io.ts";
import { ConservativelyGetProjectEnvironment, deepMerge } from "../functions/projects.ts";
import type { TheSetuperConstructedParams } from "./_interfaces.ts";
import { parse as parseYaml } from "@std/yaml";
import { parse as parseJsonc } from "@std/jsonc";
import { SETUPS, VISIBLE_SETUPS } from "./toolkit/setups.ts";
import { mergeLines, normalize, table, validate } from "@zakahacecosas/string-utils";
import { FknError } from "../functions/error.ts";
import { bold, italic, stripAnsiCode } from "@std/fmt/colors";

function isJsonFile(seek: string): boolean {
    return seek === "tsconfig.json" || seek === ".prettierrc";
}

function isYamlFile(seek: string): boolean {
    return seek === "fknode.yaml";
}

function promptUser(message: string): string | null {
    const input = prompt(message);
    return validate(input) ? input!.trim() : null;
}

const REPLACEMENTS: {
    token: string;
    resolve: (project: string) => Promise<string>;
}[] = [
    {
        token: "$fkn:ytd",
        // deno-lint-ignore require-await
        resolve: async () => new Date().getFullYear().toString(),
    },
    {
        token: "$fkn:copyHolder",
        // deno-lint-ignore require-await
        resolve: async () => {
            const value = promptUser("Enter the name of the copyright holder for the license:");
            if (!value) {
                LogStuff("Invalid... We'll add <COPYRIGHT HOLDER> instead. Up to you to change that later.", "warn");
            }
            return value ?? "<COPYRIGHT HOLDER>";
        },
    },
    {
        token: "$fkn:projName",
        resolve: async (project: string) => {
            let name: string | null = null;

            try {
                const env = await ConservativelyGetProjectEnvironment(project);
                const candidate = stripAnsiCode(env.names.name);
                if (validate(candidate)) name = candidate;
            } catch {
                // ignore, we'll ask them
            }

            if (!name) {
                name = promptUser("Enter the project's name, for the license:");
            }

            if (!name) {
                LogStuff("Invalid... We'll add <Program> instead. Up to you to change that later.", "warn");
            }

            return name ?? "<Program>";
        },
    },
];

export default async function TheSetuper(params: TheSetuperConstructedParams): Promise<void> {
    if (!validate(params.setup)) {
        LogStuff(table(VISIBLE_SETUPS));
        LogStuff(
            `You didn't provide any argument, or provided invalid ones, so up here are all possible setups.\nYou can filter setups by typing part of the name, e.g. 'setup license' to show all LICENSE setups.`,
        );
        return;
    }

    const project = validate(params.project) ? params.project : ".";

    if (!CheckForPath(project)) throw new FknError("Param__TargetInvalid", `Specified path ${params.project} doesn't exist!`);

    const desiredSetup = normalize(params.setup, { strict: true });
    const setupToUse = SETUPS.find((s) => normalize(s.name, { strict: true }) === desiredSetup);

    if (!setupToUse) {
        const matches = VISIBLE_SETUPS.filter((s) =>
            normalize(s.Name).includes(normalize(params.setup)) || normalize(s.Description).includes(normalize(params.setup))
        );
        if (matches.length === 0) {
            LogStuff(
                `You didn't provide a valid setup, and no setup matches ${bold(params.setup)}.\nRun setup with no arguments to list all setups.`,
            );
            return;
        }
        LogStuff(table(matches));
        LogStuff(`You didn't provide a valid setup. Above are all setups that match ${bold(params.setup)}.`);
        return;
    }

    const contentToUse = isJsonFile(setupToUse.seek)
        ? parseJsonc(setupToUse.content)
        : isYamlFile(setupToUse.seek)
        ? parseYaml(setupToUse.content)
        : setupToUse.content;

    const path = JoinPaths(project, setupToUse.seek);
    const status: "Over" | "Merge" | "New" = CheckForPath(path) ? setupToUse.seek === "LICENSE" ? "Over" : "Merge" : "New";

    const setupName = `${bold(setupToUse.name)} ${italic(setupToUse.seek)}`;

    const mergeWarning = bold(
        status === "Merge"
            ? `\nNote: Your existing ${setupToUse.seek} will be merged with this template. Comments won't be preserved and duplications might happen!`
            : status === "Over"
            ? "\nImportant: Your existing LICENSE file will be overwritten!"
            : "",
    );

    if (!Interrogate(`Should we add the ${setupName} file to ${bold(project)}?${mergeWarning}`)) {
        LogStuff("Alright. No changes made.", "tick");
        return;
    }

    let finalContent: string;

    if (status === "Merge") {
        const fileContent = Deno.readTextFileSync(path);

        if (isJsonFile(setupToUse.seek)) {
            finalContent = JSON.stringify(deepMerge(contentToUse, parseJsonc(fileContent)), undefined, GetTextIndentSize(fileContent));
        } else if (isYamlFile(setupToUse.seek)) {
            finalContent = StringifyYaml(deepMerge(contentToUse, parseYaml(fileContent)));
        } else {
            finalContent = mergeLines(fileContent, contentToUse);
        }
    } else {
        if (isYamlFile(setupToUse.seek)) {
            finalContent = StringifyYaml(contentToUse);
        } else if (isJsonFile(setupToUse.seek)) {
            finalContent = JSON.stringify(contentToUse, undefined, 4);
        } else {
            finalContent = (contentToUse as string).toString();
        }
    }

    for (const { token, resolve } of REPLACEMENTS) {
        if (finalContent.includes(token)) {
            finalContent = finalContent.replace(token, await resolve(project));
        }
    }

    Deno.writeTextFileSync(
        path,
        finalContent,
    );

    LogStuff("Done!", "tick");
}
