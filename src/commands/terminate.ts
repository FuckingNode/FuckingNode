import { validateAgainst } from "@zakahacecosas/string-utils";
import { reveal } from "@zakahacecosas/string-utils/cli";
import type { TheTerminatorConstructedParams } from "./_interfaces.ts";
import { FknError } from "../functions/error.ts";
import { Interrogate, LogStuff, Notification } from "../functions/io.ts";
import { bold, brightGreen, italic } from "@std/fmt/colors";
import { LOCAL_PLATFORM } from "../platform.ts";
import { Get } from "../functions/embed.ts";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import { BulkRemove } from "../functions/filesystem.ts";

export default async function TheTerminator(params: TheTerminatorConstructedParams): Promise<void> {
    if (!validateAgainst(params.runtime, ["node", "deno", "bun", "rust", "go"])) {
        throw new FknError(
            "Param__WhateverUnprovided",
            `No valid runtime to terminate provided. Provide a runtime, either 'node', 'deno', 'bun', 'rust', or 'go'.`,
        );
    }

    await reveal("HOLD UP!");

    await reveal(
        "This feature makes it more efficient to remove a runtime from your local system (by taking care of leftovers and caches for you).",
        5,
    );
    await reveal(
        "HOWEVER YOU BETTER BE SURE YOU'RE NOT RUNNING THIS BY ACCIDENT.\nGoing through runtime installation again is slow (specially Rust and Node (and when talking about Node, it's painful too)).",
        10,
    );
    await reveal(
        "These warnings are running a bit slow, to give you time to think and ensure you're certain about this.\nDon't worry, this process still runs faster than manually uninstalling ;).",
        5,
    );

    if (
        !Interrogate(
            `Are you ${bold("100% sure")} we should ${bold("entirely remove")} the ${bold(italic(params.runtime))} runtime from this machine?`,
        )
    ) {
        LogStuff(brightGreen("Got it. No action taken."), "tick");
        return;
    }

    const projects = (await Promise.all(GetAllProjects().map((p) => GetProjectEnvironment(p)))).filter((proj) =>
        proj.runtime === params.runtime
    );

    if (params.projectsToo) {
        if (
            !Interrogate(
                bold(
                    `YOU'VE SPECIFIED TO REMOVE ALL PROJECTS THAT USE THIS RUNTIME/LANGUAGE TOO!\nWe're talking of\n\n${
                        projects.map((p) => p.names.full).join("\n")
                    }\n\nTHESE WILL BE ENTIRELY REMOVED FROM YOUR LOCAL MACHINE, YOU WON'T BE ABLE TO UNDO THAT!\nPlease confirm you wish to proceed.`,
                ),
                "warn",
            )
        ) {
            LogStuff(brightGreen("Got it. No action taken."), "tick");
            return;
        }
        LogStuff("You chose it.", "warn");
    }

    await reveal("3, 2, 1.", 400);

    LogStuff(`STEP 1: Uninstalling the program.\n${italic("Prompts for UAC on Windows.")}`, "working");

    const file = Deno.makeTempFileSync({
        suffix: LOCAL_PLATFORM.SSS,
    });

    Deno.writeTextFileSync(file, Get(`${params.runtime}.${LOCAL_PLATFORM.SSS}`, "/terminators"));

    const output = await new Deno.Command(LOCAL_PLATFORM.SHELL, { args: [file] }).spawn().output();

    if (output.success) LogStuff(brightGreen(`Done! No more ${params.runtime} programming I guess.`), "tick");
    else {
        LogStuff("Something went wrong. Check above.", "error");
        Deno.exit(1);
    }

    if (!params.projectsToo) return;

    LogStuff("Now, onto removing your projects...", "warn");
    await Notification("Last chance to stop project removal", "You should be 101% sure you pushed your code, or really sure you want it gone.");
    await reveal("7, 6, 5, 4, 3, 2, 1.", 400);

    LogStuff("STEP 2: Removing the projects", "working");

    await BulkRemove(projects.map((p) => p.root));

    LogStuff(brightGreen("Done."), "tick");
}
