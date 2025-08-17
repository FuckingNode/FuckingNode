import { normalize } from "@zakahacecosas/string-utils";
import { Commander } from "./cli.ts";
import { LogStuff } from "./io.ts";
import { DebugFknErr, FknError } from "./error.ts";
import { ColorString } from "./color.ts";

export function RunBuildCmds(commands: string[]) {
    for (const command of commands) {
        const cmd = command.split(" ");
        if (!cmd[0]) {
            LogStuff(`Command "${command}" is empty? Skipping...`, "warn", "bright-yellow");
            continue;
        }
        const cmdIndex = commands.indexOf(command) + 1;
        LogStuff(`Running command ${cmdIndex}/${commands.length} | ${ColorString(command, "half-opaque", "italic")}`, undefined, "bold");
        try {
            const out = Commander(
                cmd[0],
                [
                    ...cmd.slice(1),
                ],
            );
            if (!out.success) {
                LogStuff(out.stdout ?? "(No stdout/stderr was written by the command)");
                DebugFknErr(
                    "Task__Build",
                    `Command "${command}" has failed (command #${cmdIndex} in your 'buildCmd' sequence). We've halted execution.`,
                    out.stdout,
                    false,
                );
            }
            if (normalize(out.stdout).length === 0) LogStuff("No output received.", undefined, ["half-opaque", "italic"]);
            else LogStuff(out.stdout);
            LogStuff("Done!", undefined, "bold");
        } catch (error) {
            LogStuff((error as FknError).message, "danger", "red");
            // halt execution, especially to avoid releases
            Deno.exit(1);
        }
    }
}
