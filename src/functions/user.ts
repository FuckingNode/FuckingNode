import { validateAgainst } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";
import { Commander } from "./cli.ts";
import { type CF_FKNODE_SETTINGS, SUPPORTED_EDITORS } from "../types/config_files.ts";
import { GetUserSettings } from "./config.ts";
import { LOCAL_PLATFORM } from "../platform.ts";

export function LaunchUserIDE(where?: string): void {
    const path = where ?? ".";
    const IDE: CF_FKNODE_SETTINGS["fav-editor"] = GetUserSettings()["fav-editor"];

    if (!validateAgainst(IDE, SUPPORTED_EDITORS)) {
        throw new FknError(
            "Cfg__User__FavIDE",
            `${IDE} is not a supported editor! Cannot launch it.`,
        );
    }

    let executionCommand: string[];

    switch (IDE) {
        case "sublime":
            executionCommand = ["subl"];
            break;
        case "vscode":
            executionCommand = ["code"];
            break;
        case "vscodium":
            executionCommand = ["codium"];
            break;
        case "notepad++":
            executionCommand = ["notepad++"];
            break;
        case "emacs":
            executionCommand = ["emacs"];
            break;
        case "atom":
            executionCommand = ["atom"];
            break;
        case "zed":
            executionCommand = ["zed"];
            break;
        case "flatpak-zed":
            executionCommand = ["flatpak", "run", "dev.zed.Zed"];
            break;
        case "flatpak-vscode":
            executionCommand = ["flatpak", "run", "com.visualstudio.code"];
            break;
        case "flatpak-vscodium":
            executionCommand = ["flatpak", "run", "com.vscodium.codium"];
            break;
    }

    const out = LOCAL_PLATFORM.SYSTEM === "msft"
        ? Commander(LOCAL_PLATFORM.SHELL, [...executionCommand.slice(1), path])
        : Commander(executionCommand[0]!, [...executionCommand.slice(1), path]);
    if (!out.success) throw new Error(`Error launching ${IDE}: ${out.stdout}`);
    return;
}
