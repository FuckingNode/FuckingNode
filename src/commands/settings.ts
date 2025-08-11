import { Interrogate, LogStuff } from "../functions/io.ts";
import type { TheSettingsConstructedParams } from "./constructors/command.ts";
import { ChangeSetting, DisplaySettings, FlushConfigFiles, FreshSetup, VALID_SETTINGS } from "../functions/config.ts";
import { normalizeArray, testFlag, validate, validateAgainst } from "@zakahacecosas/string-utils";

async function ResetSettings() {
    const confirmation = Interrogate(
        "Are you sure you want to reset your settings to the defaults? Current settings will be lost",
    );

    if (!confirmation) return;

    await FreshSetup(true);
    LogStuff("Switched to defaults successfully:", "tick");
    DisplaySettings();
}

export default async function TheSettings(params: TheSettingsConstructedParams) {
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
            await ResetSettings();
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
