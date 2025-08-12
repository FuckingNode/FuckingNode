import { FWORDS } from "../constants/fwords.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetAllProjects, GetProjectEnvironment, NameProject } from "../functions/projects.ts";
import { DEBUG_LOG } from "../functions/error.ts";
import { sortAlphabetically, testFlag, UnknownString, validate } from "@zakahacecosas/string-utils";

/**
 * Lists all projects.
 *
 * @param {"limit" | "exclude" | false} ignore
 * @returns {void}
 */
function ListProjects(
    ignore: "limit" | "exclude" | false,
): void {
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
                "Man, your mfs list is empty! Ain't nobody here!",
                "moon-face",
            );
            return;
        }
    }

    const toPrint: string[] = [];
    let message: string;

    if (ignore === "limit") {
        message = `Here are the ${FWORDS.MFS} you added (and ignored) so far:\n`;
        for (const entry of list) {
            const protection = (GetProjectEnvironment(entry)).settings.divineProtection; // array
            let protectionString: string;
            if (!(Array.isArray(protection))) {
                protectionString = "ERROR: CANNOT READ SETTINGS, CHECK YOUR FKNODE.YAML!";
            } else {
                protectionString = protection.join(" and ");
            }

            toPrint.push(
                `${NameProject(entry, "all")} (${
                    ColorString(
                        protectionString,
                        "bold",
                    )
                })\n`,
            );
        }
    } else if (ignore === "exclude") {
        message = `Here are the ${FWORDS.MFS} you added (and haven't ignored) so far:\n`;
        for (const entry of list) {
            toPrint.push(NameProject(entry, "all"));
        }
    } else {
        message = `Here are the ${FWORDS.MFS} you added so far:\n`;
        for (const entry of list) {
            toPrint.push(NameProject(entry, "all"));
        }
    }

    LogStuff(message, "bulb");
    for (const entry of sortAlphabetically(toPrint)) LogStuff(entry);

    return;
}

export default function TheLister(arg: UnknownString) {
    if (!validate(arg)) {
        ListProjects(
            false,
        );
        return;
    }

    let ignoreParam: false | "limit" | "exclude" = false;
    if (testFlag(arg, "ignored")) {
        ignoreParam = "limit";
    } else if (testFlag(arg, "alive")) {
        ignoreParam = "exclude";
    }
    ListProjects(
        ignoreParam,
    );
}
