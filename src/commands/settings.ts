import { Interrogate, LogStuff } from "../functions/io.ts";
import { ChangeSetting, DisplaySettings, FlushConfigFiles, FreshSetup } from "../functions/config.ts";
import { validate, validateAgainst } from "@zakahacecosas/string-utils";
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

export default async function TheSettings(
    params?: {
        action: "change";
        set: string | undefined;
        to: string | undefined;
    } | {
        action: "flush";
        files: string | undefined;
        force: boolean | undefined;
    } | {
        action: "reset";
        force: boolean | undefined;
    },
): Promise<void> {
    const VALID_SETTINGS: (keyof CF_FKNODE_SETTINGS)[] = Object.keys(DEFAULT_SETTINGS) as (keyof CF_FKNODE_SETTINGS)[];

    if (!params) {
        DisplaySettings();
        return;
    }

    switch (params.action) {
        case "flush":
            await FlushConfigFiles(params.files, params.force ?? false);
            break;
        case "reset":
            ResetSettings();
            break;
        case "change":
            if (!validateAgainst(params.set, VALID_SETTINGS)) {
                LogStuff(
                    `Invalid setting, use one of these keys:\n- ${VALID_SETTINGS.join("\n- ")}`,
                );
                return;
            }
            if (!validate(params.to)) {
                LogStuff("Provide a value to update this setting to.");
                return;
            }
            ChangeSetting(
                params.set,
                params.to,
            );
            break;
        default:
            DisplaySettings();
    }
}
