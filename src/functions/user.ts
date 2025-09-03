import { validateAgainst } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import { Commander } from "./cli.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { GetUserSettings } from "./config.ts";

export function LaunchUserIDE(): void {
    const IDE: CF_FKNODE_SETTINGS["fav-editor"] = (GetUserSettings())["fav-editor"];

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
