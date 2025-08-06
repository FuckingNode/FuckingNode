import { Commander } from "./cli.ts";
import { LogStuff } from "./io.ts";

export function RunBuildCmds(commands: string[]) {
    for (const command of commands) {
        const cmd = command.split(" ");
        if (!cmd[0]) {
            LogStuff(`Command "${command}" is empty? Skipping...`, "warn", "bright-yellow");
            continue;
        }
        LogStuff(`Running command ${commands.indexOf(command) + 1}/${commands.length}`, undefined, "bold");
        try {
            Commander(
                cmd[0],
                [
                    ...cmd.slice(1),
                ],
                true,
            );
            LogStuff("Done!", undefined, "bold");
        } catch (error) {
            LogStuff(String(error));
            LogStuff("Something went wrong...", "danger", "red");
            // halt execution, especially to avoid releases
            Deno.exit(1);
        }
    }
}
