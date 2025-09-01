import { GetProjectEnvironment } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";

export default async function TheLauncher(params: TheLauncherConstructedParams): Promise<void> {
    const env = await GetProjectEnvironment(params.project);

    Deno.chdir(env.root);
    LaunchUserIDE();

    if (env.settings.launchWithUpdate) FkNodeInterop.Features.Update(env);
    await FkNodeInterop.Features.Launch(env);
}
