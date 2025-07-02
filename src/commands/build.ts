import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheBuilderConstructedParams } from "./constructors/command.ts";
import { ValidateUserCmd } from "../functions/user.ts";
import { isDis } from "../constants.ts";
import { LogStuff } from "../functions/io.ts";
import { validate } from "@zakahacecosas/string-utils";
import { RunBuildCmds } from "../functions/build.ts";

export default function TheBuilder(params: TheBuilderConstructedParams) {
    const project = (params.project || "").startsWith("--") ? Deno.cwd() : SpotProject(params.project);
    const env = GetProjectEnvironment(project);

    Deno.chdir(env.root);

    const buildCmd = ValidateUserCmd(env, "buildCmd");

    if (!validate(buildCmd) || isDis(buildCmd)) {
        LogStuff("No build command(s) specified!", "warn", "bright-yellow");
        return;
    }

    LogStuff(`There we go, time to build ${NameProject(env.root, "name")}`, "tick-clear", "green");

    RunBuildCmds(buildCmd.split("^"));

    LogStuff(`That worked out! Your project should be built now.`, "tick", ["bold", "bright-green"]);
    return;
}
