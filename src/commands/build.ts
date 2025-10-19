import { GetProjectEnvironment } from "../functions/projects.ts";
import type { TheBuilderConstructedParams } from "./_interfaces.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { GetElapsedTime } from "../functions/date.ts";
import { RunCmdSet, ValidateCmdSet } from "../functions/cmd-set.ts";

export default async function TheBuilder(params: TheBuilderConstructedParams): Promise<void> {
    const env = await GetProjectEnvironment(params.project);

    Deno.chdir(env.root);

    const buildCmd = ValidateCmdSet({ env, key: "buildCmd" });

    if (!buildCmd) {
        LogStuff("No build command(s) specified!", "warn", "bright-yellow");
        return;
    }

    const startup = new Date();

    LogStuff(`There we go, time to build ${env.names.name}`, "tick-clear", "green");

    await RunCmdSet({ env, key: "buildCmd" });

    LogStuff(`That worked out! ${env.names.name} should be built now.`, "tick", ["bold", "bright-green"]);

    Notification(
        "Build completed!",
        `Your build of ${env.mainCPF.name} succeeded! Elapsed ${GetElapsedTime(startup)}.`,
        Date.now() - startup.getTime(),
    );

    return;
}
