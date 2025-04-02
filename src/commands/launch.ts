import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";

export default async function TheLauncher(params: TheLauncherConstructedParams) {
    const path = await SpotProject(params.project);
    const env = await GetProjectEnvironment(path);

    Deno.chdir(path);

    await LaunchUserIDE();
    if (env.settings.launchWithUpdate) {
        await FkNodeInterop.Features.Update({
            env,
            verbose: true,
        });
    }
    await FkNodeInterop.Features.Launch({
        env,
        verbose: true,
    });
}
