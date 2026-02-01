import { Get } from "./embed.ts";
import { LogStuff } from "./io.ts";

export function SetupUnixMan(): void {
    LogStuff("Setting man up...", "working");
    Deno.writeTextFileSync(
        "/usr/share/man/man1/fuckingnode.1",
        Get("man.1", "/manpage"),
    );
    new Deno.Command(
        "sudo",
        {
            args: ["mandb"],
        },
    ).outputSync();
    LogStuff("Done.", "tick");
}
