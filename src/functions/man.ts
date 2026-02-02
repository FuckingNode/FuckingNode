import { LOCAL_PLATFORM } from "../platform.ts";
import { Get } from "./embed.ts";
import { ParsePath } from "./filesystem.ts";
import { LogStuff } from "./io.ts";

export function SetupUnixMan(): void {
    LogStuff("Setting man up...", "working");
    const manPath = `${LOCAL_PLATFORM.APPDATA}../.local/share/man/man1`;
    Deno.mkdirSync(manPath, { recursive: true });
    Deno.writeTextFileSync(
        ParsePath(`${manPath}/fuckingnode.1`),
        Get("man.1", "/manpage"),
    );
    new Deno.Command(
        "sudo",
        {
            args: ["mandb"],
        },
    ).outputSync();
    LogStuff("Done.", "tick");
    LogStuff('Please add this to your shell config:\nexport MANPATH="$HOME/.local/share/man:$MANPATH"', "bulb");
}
