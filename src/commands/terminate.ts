import { reveal, validateAgainst } from "@zakahacecosas/string-utils";
import type { TheTerminatorConstructedParams } from "./_interfaces.ts";
import { FknError } from "../functions/error.ts";
import { Interrogate, LogStuff } from "../functions/io.ts";
import { bold, italic } from "@std/fmt/colors";
import { LOCAL_PLATFORM } from "../platform.ts";
import { Get } from "../functions/embed.ts";

export default async function TheTerminator(params: TheTerminatorConstructedParams): Promise<void> {
    if (!validateAgainst(params.runtime, ["node", "deno", "bun", "rust", "go"])) {
        throw new FknError(
            "Param__WhateverUnprovided",
            `No valid runtime to terminate provided. Provide a runtime, either 'node', 'deno', 'bun', 'rust', or 'go'.`,
        );
    }

    await reveal("HOLD UP!");

    await reveal(
        "This feature makes it more efficient to remove an runtime from your local system (by taking care of leftovers and caches for you).",
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
        LogStuff("Got it. No action taken.", "tick-clear", ["bright-green"]);
        return;
    }

    await reveal("3 2 1.", 500);

    LogStuff(`STEP 1: Uninstalling the program.\n${italic("Prompts for UAC on Windows.")}`, "working");

    const file = Deno.makeTempFileSync({
        suffix: LOCAL_PLATFORM.SSS,
    });

    Deno.writeTextFileSync(file, Get(`${params.runtime}.${LOCAL_PLATFORM.SSS}`, "/terminators"));

    const output = await new Deno.Command(LOCAL_PLATFORM.SHELL, { args: [file] }).spawn().output();

    if (output.success) LogStuff(`Done! No more ${params.runtime} programming I guess.`, "tick");
    LogStuff("Something went wrong. Check above.", "error");
}
