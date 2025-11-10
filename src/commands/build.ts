import { ConservativelyGetProjectEnvironment } from "../functions/projects.ts";
import type { TheBuilderConstructedParams } from "./_interfaces.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { GetElapsedTime } from "../functions/date.ts";
import { RunCmdSet, ValidateCmdSet } from "../functions/cmd-set.ts";
import { bold, brightGreen, brightYellow, green } from "@std/fmt/colors";

export default async function TheBuilder(params: TheBuilderConstructedParams): Promise<void> {
    const env = await ConservativelyGetProjectEnvironment(params.project);

    Deno.chdir(env.root);

    const buildCmd = ValidateCmdSet({ env, key: "buildCmd" });

    if (!buildCmd) {
        LogStuff(brightYellow("No build command(s) specified!"), "warn");
        return;
    }

    const startup = new Date();

    LogStuff(green(`There we go, time to build ${env.names.name}`), "tick-clear");

    await RunCmdSet({ env, key: "buildCmd" });

    LogStuff(brightGreen(bold(`That worked out! ${env.names.name} should be built now.`)), "tick");

    Notification(
        "Build completed!",
        `Your build of ${env.mainCPF.name} succeeded! Elapsed ${GetElapsedTime(startup)}.`,
        Date.now() - startup.getTime(),
    );

    return;
}
