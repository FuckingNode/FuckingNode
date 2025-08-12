import { normalize, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import type { ProjectEnvironment } from "../types/platform.ts";
import { Commander } from "./cli.ts";
import { isDis } from "../constants.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { GetUserSettings } from "./config.ts";

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

    const cmdOutput = Commander(
        env.commands.run[0],
        [env.commands.run[1], cmd],
        true,
    );

    if (!cmdOutput.success) {
        throw new FknError(
            key === "commitCmd" ? "Task__Commit" : "Task__Release",
            `Your fknode.yaml's ${key} failed at ${env.root}. Scroll up as their output should've been shown in this terminal session.`,
        );
    }
}

export function LaunchUserIDE() {
    const IDE: CF_FKNODE_SETTINGS["favEditor"] = GetUserSettings().favEditor;

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

    const out = Commander(executionCommand, ["."], false);
    if (!out.success) throw new Error(out.stdout ?? "Error launching " + IDE);
    return;
}
