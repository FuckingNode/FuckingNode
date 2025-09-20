import { RunCmdSet } from "../functions/cmd-set.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./_interfaces.ts";

export default async function TheLauncher(params: TheLauncherConstructedParams): Promise<void> {
    const env = await GetProjectEnvironment(params.project);

    Deno.chdir(env.root);
    LaunchUserIDE();

    await RunCmdSet({ env, key: "launchCmd" });

    return;
}
