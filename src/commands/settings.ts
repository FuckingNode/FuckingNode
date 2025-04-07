import { Interrogate, LogStuff } from "../functions/io.ts";
import type { TheSettingsConstructedParams } from "./constructors/command.ts";
import { ChangeSetting, DisplaySettings, FlushConfigFiles, FreshSetup, VALID_SETTINGS } from "../functions/config.ts";
import { StringUtils } from "@zakahacecosas/string-utils";
import { DEBUG_LOG } from "../functions/error.ts";

function ResetSettings() {
    const confirmation = Interrogate(
        "Are you sure you want to reset your settings to the defaults? Current settings will be lost",
    );

    if (!confirmation) return;

    FreshSetup(true);
    LogStuff("Switched to defaults successfully:", "tick");
    DisplaySettings();
}

export default function TheSettings(params: TheSettingsConstructedParams) {
    const args = StringUtils.normalizeArray(params.args);
    DEBUG_LOG("SETTINGS TOOK", args[0]);

    if (!args || args.length === 0) {
        DisplaySettings();
        return;
    }

    if (!args[0]) {
        DisplaySettings();
        return;
    }

    switch (args[0]) {
        case "flush":
            FlushConfigFiles(args[1], StringUtils.testFlag(args[2] ?? "", "force"));
            break;
        case "repair":
        case "reset":
            ResetSettings();
            break;
        case "change":
            if (!StringUtils.validateAgainst(args[1], VALID_SETTINGS)) {
                LogStuff(
                    `Invalid option, use one of these keys to tweak settings: ${VALID_SETTINGS.toString()}`,
                );
                return;
            }
            if (!StringUtils.validate(args[2])) {
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
