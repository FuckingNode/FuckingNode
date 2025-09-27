import { CheckForPath, GetTextIndentSize, JoinPaths } from "../functions/filesystem.ts";
import { Interrogate, LogStuff, StringifyYaml } from "../functions/io.ts";
import { deepMerge } from "../functions/projects.ts";
import type { TheSetuperConstructedParams } from "./_interfaces.ts";
import { parse as parseYaml } from "@std/yaml";
import { parse as parseJsonc } from "@std/jsonc";
import { SETUPS, VISIBLE_SETUPS } from "./toolkit/setups.ts";
import { mergeLines, normalize, table, validate } from "@zakahacecosas/string-utils";
import { FknError } from "../functions/error.ts";
import { ColorString } from "../functions/color.ts";
import { bold } from "@std/fmt/colors";

export default function TheSetuper(params: TheSetuperConstructedParams): void {
    if (!validate(params.setup)) {
        LogStuff(table(VISIBLE_SETUPS));
        LogStuff(
            `You didn't provide any argument, or provided invalid ones, so up here are all possible setups.\nYou can filter setups by typing part of the name, e.g. 'setup license' to show all LICENSE setups.`,
        );
        return;
    }

    const project = validate(params.project) ? params.project : ".";

    if (!(CheckForPath(project))) throw new FknError("Param__TargetInvalid", `Specified path ${params.project} doesn't exist!`);

    const desiredSetup = normalize(params.setup, { strict: true });
    const setupToUse = SETUPS.find((s) => (normalize(s.name, { strict: true })) === desiredSetup);

    if (
        !setupToUse
    ) {
        const matches = VISIBLE_SETUPS.filter((s) =>
            normalize(s.Name).includes(normalize(params.setup)) || normalize(s.Description).includes(normalize(params.setup))
        );
        if (matches.length === 0) {
            LogStuff(
                `You didn't provide a valid setup, and no setup matches ${bold(params.setup)}.\nRun setup with no arguments to list all setups.`,
            );
            return;
        }
        LogStuff(
            table(matches),
        );
        LogStuff(`You didn't provide a valid setup. Above are all setups that match ${bold(params.setup)}.`);
        return;
    }

    const contentToUse = (setupToUse.seek === "tsconfig.json" || setupToUse.seek === ".prettierrc")
        ? parseJsonc(setupToUse.content)
        : setupToUse.seek === "fknode.yaml"
        ? parseYaml(setupToUse.content)
        : setupToUse.content;
    const path = JoinPaths(project, setupToUse.seek);
    const status = CheckForPath(path) ? (setupToUse.seek === "LICENSE" ? "Over" : "Merge") : "New";

    const setupName = `${ColorString(setupToUse.name, "bold")} ${ColorString(setupToUse.seek, "italic")}`;

    if (
        !(Interrogate(
            `Should we add the ${setupName} file to ${bold(project)}?${
                status === "New"
                    ? ""
                    : status === "Merge"
                    ? `\nNote: Your existing ${setupToUse.seek} will be merged with this template. Comments won't be preserved and duplications might happen!`
                    : "\nImportant: Your existing LICENSE file will be overwritten!"
            }`,
        ))
    ) {
        LogStuff("Alright. No changes made.", "tick");
        return;
    }

    let finalContent: string;

    if (status === "Merge") {
        const fileContent = Deno.readTextFileSync(path);
        if (setupToUse.seek === "tsconfig.json" || setupToUse.seek === ".prettierrc") {
            finalContent = JSON.stringify(deepMerge(contentToUse, parseJsonc(fileContent)), undefined, GetTextIndentSize(fileContent));
        } else if (setupToUse.seek === "fknode.yaml") {
            finalContent = StringifyYaml(deepMerge(contentToUse, parseYaml(fileContent)));
        } else {
            finalContent = mergeLines(fileContent, contentToUse as string);
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
    if (setupToUse.seek === "LICENSE" && (setupToUse.name.includes("mit") || setupToUse.name.includes("bsd"))) {
        LogStuff(
            `Check your LICENSE file at the top of the file!\nYou need to update the template to show a valid year and author/copyright holder.`,
        );
    }
}
