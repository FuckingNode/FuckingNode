import { LogStuff } from "../functions/io.ts";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import { sortAlphabetically, testFlag, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { bold, dim } from "@std/fmt/colors";

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

    const message: string = `Here are the motherfuckers you added ${
        ignore === "limit" ? "(and ignored)" : ignore === "exclude" ? "(and haven't ignored)" : ""
    } so far:\n${dim("Shown as: [RT+PM] ([N] (v[V])) [R] [DP]...")}\n`;
    const toPrint = (await Promise.all(
        list.map((entry) => GetProjectEnvironment(entry)),
    )).map((env) => {
        return `${bold(`[${env.runtime}+${env.manager}]${env.settings.projectEnvOverride ? "(!)" : ""}`).padEnd(20, " ")} ${env.names.full} (${
            Array.isArray(env.settings.divineProtection) && env.settings.divineProtection.length
                ? "protected from " + bold(env.settings.divineProtection.join(" and "))
                : env.settings.divineProtection === "*"
                ? bold("protected from everything!")
                : "clear"
        })`;
    });

    LogStuff(
        message + sortAlphabetically(toPrint).join("\n") + "\n"
            + dim("...where RT is Runtime, PM is PackageManager, N is Name, V is Version, R is Root, and DP is DivineProtection"),
        "bulb",
    );

    return;
}

export default async function TheLister(arg: UnknownString): Promise<void> {
    await ListProjects(
        validate(arg) ? (testFlag(arg, "ignored") ? "limit" : testFlag(arg, "alive") ? "exclude" : false) : false,
    );
    return;
}
