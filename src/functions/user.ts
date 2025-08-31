import { normalize, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import type { ProjectEnvironment } from "../types/platform.ts";
import { Commander } from "./cli.ts";
import { isDis } from "../constants.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { GetAppPath, GetUserSettings } from "./config.ts";
import { ColorString } from "./color.ts";
import { LogStuff, Notification } from "./io.ts";
import { DebugFknErr } from "./error.ts";
import { NameProject } from "./projects.ts";

export function ValidateUserCmd(env: ProjectEnvironment, key: "commitCmd" | "releaseCmd" | "buildCmd"): string | null {
    const command = env.settings[key];

    const cmd = (validate(command) && !isDis(command)) ? normalize(command) : "#disable";

    if (cmd !== "#disable" && env.commands.run === "__UNSUPPORTED") {
        throw new FknError(
            "Interop__JSRunUnable",
            `Your fknode.yaml file has a ${key} key, but ${env.manager} doesn't support JS-like "run" tasks, so we can't execute that task. To avoid undesired behavior, we stopped execution. Please remove the commitCmd key from this fknode.yaml. Sorry!`,
        );
    }

    if (cmd === "#disable") return null;
    return cmd;
}

export function RunUserCmd(params: { key: "commitCmd" | "releaseCmd"; env: ProjectEnvironment }) {
    const { env, key } = params;

    const cmd = ValidateUserCmd(env, key);

    if (!cmd) return;

    LogStuff(
        `Running your ${key} | ${ColorString([env.commands.run[0], env.commands.run[1], cmd].join(" "), "half-opaque", "italic")}`,
        undefined,
        "bold",
    );

    const cmdOutput = Commander(
        env.commands.run[0],
        [env.commands.run[1], cmd],
    );

    LogStuff(cmdOutput.stdout);

    if (!cmdOutput.success) {
        Notification(
            `Your ${key} failed at ${NameProject(env.root, "name-colorless")}!`,
            `Error was dumped to ${GetAppPath("ERRORS")}, and it appear in the terminal as well.`,
            30000,
        );
        DebugFknErr(
            key === "commitCmd" ? "Task__Commit" : "Task__Release",
            `Your fknode.yaml's ${key} failed at ${env.root}. Scroll up as their output should've been shown in this terminal session.`,
            cmdOutput.stdout,
        );
    }
}

export function LaunchUserIDE() {
    const IDE: CF_FKNODE_SETTINGS["fav-editor"] = GetUserSettings()["fav-editor"];

    if (!validateAgainst(IDE, ["vscode", "sublime", "emacs", "notepad++", "atom", "vscodium"])) {
        throw new FknError("External__Setting__FavIde", `${IDE} is not a supported editor! Cannot launch it.`);
    }

    let executionCommand: "subl" | "code" | "emacs" | "notepad++" | "codium" | "atom";

    switch (IDE) {
        case "sublime":
            executionCommand = "subl";
            break;
        case "vscode":
            executionCommand = "code";
            break;
        case "vscodium":
            executionCommand = "codium";
            break;
        case "notepad++":
            executionCommand = "notepad++";
            break;
        case "emacs":
            executionCommand = "emacs";
            break;
        case "atom":
            executionCommand = "atom";
            break;
    }

    const out = Commander(executionCommand, ["."]);
    if (!out.success) throw new Error(`Error launching ${IDE}: ${out.stdout}`);
    return;
}
