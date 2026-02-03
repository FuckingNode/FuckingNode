import { LogStuff } from "../functions/io.ts";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import { sortAlphabetically, testFlag, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { bold } from "@std/fmt/colors";

/**
 * Lists all projects.
 *
 * @param {"limit" | "exclude" | false} ignore
 */
async function ListProjects(
    ignore: "limit" | "exclude" | false,
): Promise<void> {
    const list = GetAllProjects(ignore);
    if (list.length === 0) {
        if (ignore === "limit") {
            LogStuff(
                "Huh, you didn't ignore anything! Good to see you care about all your projects.",
                "moon-face",
            );
            return;
        } else if (ignore === "exclude") {
            LogStuff(
                "Huh, you ignored all of your projects! What did you download this CLI for?",
                "moon-face",
            );
            return;
        } else {
            LogStuff(
                "Man, your motherfuckers list is empty! Ain't nobody here!",
                "moon-face",
            );
            return;
        }
    }

    const message: string = ignore === "limit"
        ? `Here are the motherfuckers you added (and ignored) so far:\n\n`
        : ignore === "exclude"
        ? `Here are the motherfuckers you added (and haven't ignored) so far:\n\n`
        : `Here are the motherfuckers you added so far:\n\n`;
    const toPrint = (await Promise.all(
        list.map((entry) => GetProjectEnvironment(entry)),
    )).map((env) => {
        const str = `${env.names.full} ${bold(`[${env.runtime}+${env.manager}]${env.settings.projectEnvOverride ? "(overridden!)" : ""}`)}`;
        if (ignore !== "limit") return str;
        return `${env.names.full} [${env.runtime}] (${
            bold(
                Array.isArray(env.settings.divineProtection) ? env.settings.divineProtection.join(" and ") : "Everything!",
            )
        })\n`;
    });

    LogStuff(message + sortAlphabetically(toPrint).join("\n"), "bulb");

    return;
}

export default async function TheLister(arg: UnknownString): Promise<void> {
    await ListProjects(
        validate(arg) ? (testFlag(arg, "ignored") ? "limit" : testFlag(arg, "alive") ? "exclude" : false) : false,
    );
    return;
}
