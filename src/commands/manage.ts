import { FWORDS } from "../constants.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { AddProject, GetAllProjects, GetProjectEnvironment, NameProject, RemoveProject } from "../functions/projects.ts";
import TheHelper from "./help.ts";
import { DEBUG_LOG } from "../functions/error.ts";
import { StringUtils } from "@zakahacecosas/string-utils";

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
                "Huh, you didn't ignore anything! Good to see you care about all your projects (not for long, I can bet).",
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
    for (const entry of StringUtils.sortAlphabetically(toPrint)) LogStuff(entry);

    return;
}

export default function TheManager(args: string[]) {
    if (!args || args.length === 0) {
        TheHelper({ query: "manager" });
        Deno.exit(1);
    }

    const command = args[1];
    const secondArg = args[2] ? args[2].trim() : null;

    if (!command) {
        TheHelper({ query: "manager" });
        return;
    }

    switch (command.toLowerCase()) {
        case "add":
            AddProject(secondArg);
            break;
        case "remove":
            RemoveProject(secondArg);
            break;
        case "list":
            if (secondArg) {
                let ignoreParam: false | "limit" | "exclude" = false;
                if (StringUtils.testFlag(secondArg, "ignored")) {
                    ignoreParam = "limit";
                } else if (StringUtils.testFlag(secondArg, "alive")) {
                    ignoreParam = "exclude";
                }
                ListProjects(
                    ignoreParam,
                );
            } else {
                ListProjects(
                    false,
                );
            }
            break;
        case "cleanup":
            LogStuff(
                "We removed the need to manually cleanup your projects - each time you run the CLI we auto-clean them for you.\nEnjoy!",
                "comrade",
            );
            break;
        default:
            TheHelper({ query: "manager" });
    }
}
