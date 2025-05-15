import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { ColorString, Interrogate, LogStuff, StringifyYaml } from "../functions/io.ts";
import { deepMerge, GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheSetuperConstructedParams } from "./constructors/command.ts";
import { parse as parseYaml } from "@std/yaml";
import { parse as parseJsonc } from "@std/jsonc";
import { SETUPS, VISIBLE_SETUPS } from "./toolkit/setups.ts";
import { normalize, table, validate } from "@zakahacecosas/string-utils";

export default function TheSetuper(params: TheSetuperConstructedParams) {
    if (!validate(params.setup) || !validate(params.project)) {
        LogStuff(table(VISIBLE_SETUPS));
        LogStuff(
            `You didn't provide a ${params.setup ? "project" : "target setup"} or provided an invalid one, so up here are all possible setups.`,
        );
        return;
    }

    const project = SpotProject(params.project);
    const env = GetProjectEnvironment(project);
    const desiredSetup = normalize(params.setup, { strict: true });
    const setupToUse = SETUPS.find((s) => (normalize(s.name, { strict: true })) === desiredSetup);

    if (
        !setupToUse
    ) throw new Error(`Given setup ${params.setup} is not valid! Choose from the list ${SETUPS.map((s) => s.name)}.`);

    const contentToUse = (setupToUse.seek === "tsconfig.json" || setupToUse.seek === ".prettierrc")
        ? parseJsonc(setupToUse.content)
        : setupToUse.seek === "fknode.yaml"
        ? parseYaml(setupToUse.content)
        : setupToUse.content;
    const path = JoinPaths(env.root, setupToUse.seek);
    const exists = CheckForPath(path);

    const setupName = `${ColorString(setupToUse.name, "bold")} ${ColorString(setupToUse.seek, "italic")}`;

    if (
        !(Interrogate(
            `Should we add the ${setupName} file to ${NameProject(project, "name")}?${
                exists
                    ? `\nNote: Your existing ${setupToUse.seek} will be merged with this template. Comments won't be preserved and duplications might happen!`
                    : ""
            }`,
        ))
    ) {
        LogStuff("Alright. No changes made.", "tick");
        return;
    }

    let finalContent: string;

    if (exists) {
        const fileContent = Deno.readTextFileSync(path);
        if (setupToUse.seek === "tsconfig.json" || setupToUse.seek === ".prettierrc") {
            const parsedContent = parseJsonc(fileContent);
            const line = fileContent.trim().split("\n")[1] || "";
            const indentSize: number = line.length - line.trim().length || 4;
            finalContent = JSON.stringify(deepMerge(contentToUse, parsedContent), undefined, indentSize);
        } else if (setupToUse.seek === "fknode.yaml") {
            const parsedContent = parseYaml(fileContent);
            finalContent = StringifyYaml(deepMerge(contentToUse, parsedContent));
        } else {
            // (gitignore or editorconfig)
            finalContent = `${fileContent}\n${contentToUse}`;
        }
    } else {
        finalContent = setupToUse.seek === "fknode.yaml"
            ? StringifyYaml(contentToUse)
            : (setupToUse.seek === "tsconfig.json" || setupToUse.seek === ".prettierrc")
            ? JSON.stringify(contentToUse, undefined, 4)
            : (contentToUse as string).toString();
    }

    Deno.writeTextFileSync(
        path,
        finalContent,
    );

    LogStuff("Done!", "tick");
}
