import { Interrogate, LogStuff } from "../functions/io.ts";
import type { TheSettingsConstructedParams } from "./_interfaces.ts";
import { ChangeSetting, DisplaySettings, FlushConfigFiles, FreshSetup } from "../functions/config.ts";
import { normalizeArray, testFlag, validate, validateAgainst } from "@zakahacecosas/string-utils";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { DEFAULT_SETTINGS } from "../constants.ts";

function ResetSettings(): void {
    const confirmation = Interrogate(
        "Are you sure you want to reset your settings to the defaults? Current settings will be lost",
    );

    if (!confirmation) return;

    FreshSetup(true);
    LogStuff("Switched to defaults successfully:", "tick");
    DisplaySettings();
}

export default async function TheSettings(params: TheSettingsConstructedParams): Promise<void> {
    const VALID_SETTINGS: (keyof CF_FKNODE_SETTINGS)[] = Object.keys(DEFAULT_SETTINGS) as (keyof CF_FKNODE_SETTINGS)[];
    const args = normalizeArray(params.args);

    if (!args || args.length === 0) {
        DisplaySettings();
        return;
    }

    switch (args[0]) {
        case "flush":
            await FlushConfigFiles(args[1], testFlag(args[2] ?? "", "force"));
            break;
        case "repair":
        case "reset":
            ResetSettings();
            break;
        case "change":
            if (!validateAgainst(args[1], VALID_SETTINGS)) {
                LogStuff(
                    `Invalid setting, use one of these keys: ${VALID_SETTINGS.toString()}`,
                );
                return;
            }
            if (!validate(args[2])) {
                LogStuff("Provide a value to update this setting to.");
                return;
            }
            ChangeSetting(
                args[1],
                args[2],
            );
            break;
        default:
            DisplaySettings();
    }
}
