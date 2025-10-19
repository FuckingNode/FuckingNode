import { RunCmdSet, ValidateCmdSet } from "../functions/cmd-set.ts";
import { LogStuff } from "../functions/io.ts";
import { ConservativelyGetProjectEnvironment } from "../functions/projects.ts";
import { LaunchUserIDE } from "../functions/user.ts";
import type { TheLauncherConstructedParams } from "./_interfaces.ts";

export default async function TheLauncher(params: TheLauncherConstructedParams): Promise<void> {
    const env = await ConservativelyGetProjectEnvironment(params.project);

    Deno.chdir(env.root);
    if (!params.noIDE) LaunchUserIDE();

    if (!ValidateCmdSet({ env, key: "launchCmd" }) && params.noIDE) {
        LogStuff("Why launch without IDE and without having a launchCmd configured?\nThere's nothing we can do with this project.", "error");
        Deno.exit(1);
    }

    // TODO(@ZakaHaceCosas): here you usually run the kind of stuff
    // where you may want not just CLI output but CLI input
    // (e.g. react servers where you can hit keystrokes to reload and stuff)
    // so we need a different behavior here
    // my idea is making the *last* Cmd spawn as a visible process
    // and let it run
    await RunCmdSet({ env, key: "launchCmd" });

    return;
}
