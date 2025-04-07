import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { ColorString, Interrogate, LogStuff, StringifyYaml } from "../functions/io.ts";
import { deepMerge, GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheSetuperConstructedParams } from "./constructors/command.ts";
import { StringUtils } from "@zakahacecosas/string-utils";
import { parse as parseYaml } from "@std/yaml";
import { parse as parseJsonc } from "@std/jsonc";
import { SETUPS, VISIBLE_SETUPS } from "./toolkit/setups.ts";

export default function TheSetuper(params: TheSetuperConstructedParams) {
    if (!StringUtils.validate(params.setup) || !StringUtils.validate(params.project)) {
        LogStuff(StringUtils.table(VISIBLE_SETUPS));
        LogStuff(
            `You didn't provide a ${params.setup ? "project" : "target setup"} or provided an invalid one, so up here are all possible setups.`,
        );
        return;
    }

    const project = SpotProject(params.project);
    const env = GetProjectEnvironment(project);
    const desiredSetup = StringUtils.normalize(params.setup, { strict: true });
    const setupToUse = SETUPS.find((s) => (StringUtils.normalize(s.name, { strict: true })) === desiredSetup);

    if (
        !setupToUse
    ) throw new Error(`Given setup ${params.setup} is not valid! Choose from the list ${SETUPS.map((s) => s.name)}.`);

    const contentToUse = setupToUse.seek === "tsconfig.json"
        ? JSON.parse(setupToUse.content)
        : setupToUse.seek === "fknode.yaml"
        ? parseYaml(setupToUse.content)
        : setupToUse.content;
    const path = JoinPaths(env.root, setupToUse.seek);
    const exists = CheckForPath(path);

    if (
        !(Interrogate(
            `Should we add the ${ColorString(setupToUse.name, "bold")} ${ColorString(setupToUse.seek, "italic")} file to ${
                NameProject(
                    project,
                    "name-ver",
                )
            }?${
                exists
                    ? setupToUse.seek === "tsconfig.json"
                        ? "\nNote: Your existing tsconfig.json will be merged with this template. Comments won't be preserved!"
                        : `\nNote: Your existing ${setupToUse.seek} will be merged with this template. Duplications may happen.`
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
        if (setupToUse.seek === "tsconfig.json") {
            const parsedContent = parseJsonc(fileContent);
            finalContent = JSON.stringify(deepMerge(contentToUse, parsedContent), undefined, 4);
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
            : setupToUse.seek === "tsconfig.json"
            ? JSON.stringify(contentToUse, undefined, 4)
            : contentToUse.toString();
    }

    Deno.writeTextFileSync(
        path,
        finalContent,
    );

    LogStuff("Done!", "tick");
}
