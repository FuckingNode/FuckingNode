import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";

export default function TheLauncher(params: TheLauncherConstructedParams) {
    const path = SpotProject(params.project ?? Deno.cwd());
    const env = GetProjectEnvironment(path);

    Deno.chdir(path);
    LaunchUserIDE();

    if (env.settings.launchWithUpdate) {
        FkNodeInterop.Features.Update(env);
    }
    FkNodeInterop.Features.Launch(env);
}
