import { generateManPage } from "@optique/man";
import { LogStuff } from "./io.ts";
import { FuckingNode, FuckingNodeMeta } from "../main.ts";
import { join } from "@std/path/join";

export function SetupUnixMan(): void {
    LogStuff("Installing local man page...", "working");

    const homeDir = Deno.env.get("HOME");
    if (!homeDir) {
        LogStuff("Could not find HOME directory. Skipping man installation.", "error");
        return;
    }

    const manPath = join(homeDir, ".local", "share", "man", "man1");

    try {
        Deno.mkdirSync(manPath, { recursive: true });

        const filePath = join(manPath, "fkn.1");
        Deno.writeTextFileSync(
            filePath,
            generateManPage(FuckingNode, { section: 1, ...FuckingNodeMeta, date: new Date() }),
        );

        new Deno.Command("mandb", {
            args: ["-u"],
            stdout: "null",
            stderr: "null",
        }).outputSync();

        LogStuff("Man page automatically linked! Type 'man fkn' to test.", "tick");
    } catch (err) {
        LogStuff(`Failed to automatically install man page: ${String(err)}`, "error");
    }
}
