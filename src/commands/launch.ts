import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";

export default async function TheLauncher(params: TheLauncherConstructedParams): Promise<void> {
    const path = await SpotProject(params.project ?? Deno.cwd());
    const env = await GetProjectEnvironment(path);

    Deno.chdir(path);
    LaunchUserIDE();

    if (env.settings.launchWithUpdate) {
        FkNodeInterop.Features.Update(env);
    }
    await FkNodeInterop.Features.Launch(env);
}
