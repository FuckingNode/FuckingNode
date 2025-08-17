import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheBuilderConstructedParams } from "./constructors/command.ts";
import { ValidateUserCmd } from "../functions/user.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { RunBuildCmds } from "../functions/build.ts";
import { stripAnsiCode } from "@std/fmt/colors";

export default function TheBuilder(params: TheBuilderConstructedParams) {
    const project = (params.project || "").startsWith("--") ? Deno.cwd() : SpotProject(params.project);
    const env = GetProjectEnvironment(project);
    const projectName = NameProject(env.root, "name");

    Deno.chdir(env.root);

    const buildCmd = ValidateUserCmd(env, "buildCmd");

    if (!buildCmd) {
        LogStuff("No build command(s) specified!", "warn", "bright-yellow");
        return;
    }

    const startup = new Date();

    LogStuff(`There we go, time to build ${projectName}`, "tick-clear", "green");

    RunBuildCmds(buildCmd.split("^"));

    LogStuff(`That worked out! ${projectName} should be built now.`, "tick", ["bold", "bright-green"]);

    const elapsed = Date.now() - startup.getTime();

    Notification(
        "Build completed!",
        `Your build of ${stripAnsiCode(projectName)} succeeded! Elapsed ${elapsed}.`,
        elapsed,
    );

    return;
}
