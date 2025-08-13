import { normalize } from "@zakahacecosas/string-utils";
import { Commander } from "./cli.ts";
import { LogStuff } from "./io.ts";
import { FknError } from "./error.ts";

export function RunBuildCmds(commands: string[]) {
    for (const command of commands) {
        const cmd = command.split(" ");
        if (!cmd[0]) {
            LogStuff(`Command "${command}" is empty? Skipping...`, "warn", "bright-yellow");
            continue;
        }
        const cmdIndex = commands.indexOf(command) + 1;
        LogStuff(`Running command ${cmdIndex}/${commands.length}`, undefined, "bold");
        try {
            const out = Commander(
                cmd[0],
                [
                    ...cmd.slice(1),
                ],
            );
            if (!out.success) {
                throw new FknError(
                    "Task__Build",
                    `Command "${command}" has failed (command #${cmdIndex} in your 'buildCmd' sequence). We've halted execution. Scroll up, as output of this command (if any) should appear in this terminal session.`,
                );
            }
            if (normalize(out.stdout).length === 0) LogStuff("No output received.", undefined, ["half-opaque", "italic"]);
            else LogStuff(out.stdout);
            LogStuff("Done!", undefined, "bold");
        } catch (error) {
            LogStuff(String(error));
            LogStuff("Something went wrong...", "danger", "red");
            // halt execution, especially to avoid releases
            Deno.exit(1);
        }
    }
}
