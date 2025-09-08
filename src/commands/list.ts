import { LogStuff } from "../functions/io.ts";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import { DEBUG_LOG } from "../functions/error.ts";
import { sortAlphabetically, testFlag, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { ColorString } from "../functions/color.ts";

/**
 * Lists all projects.
 *
 * @param {"limit" | "exclude" | false} ignore
 */
async function ListProjects(
    ignore: "limit" | "exclude" | false,
): Promise<void> {
    const list = GetAllProjects(ignore);
    DEBUG_LOG("FULL PROJECT LIST", list);
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
        ? `Here are the motherfuckers you added (and ignored) so far:\n`
        : ignore === "exclude"
        ? `Here are the motherfuckers you added (and haven't ignored) so far:\n`
        : `Here are the motherfuckers you added so far:\n`;
    const promises = await Promise.all(
        list.map((entry) => GetProjectEnvironment(entry)),
    );
    const toPrint = promises.map((env) => {
        if (ignore === "limit") {
            return `${env.names.full} (${
                ColorString(
                    Array.isArray(env.settings.divineProtection) ? env.settings.divineProtection.join(" and ") : "Everything!",
                    "bold",
                )
            })\n`;
        }
        return env.names.full;
    });

    LogStuff(message, "bulb");
    LogStuff(sortAlphabetically(toPrint).join("\n"));

    return;
}

export default async function TheLister(arg: UnknownString): Promise<void> {
    if (!validate(arg)) {
        await ListProjects(
            false,
        );
        return;
    }

    let ignoreParam: false | "limit" | "exclude" = false;
    if (testFlag(arg, "ignored")) ignoreParam = "limit";
    else if (testFlag(arg, "alive")) ignoreParam = "exclude";
    await ListProjects(
        ignoreParam,
    );
}
