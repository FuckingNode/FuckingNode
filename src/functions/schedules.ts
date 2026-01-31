import TheUpdater from "../commands/updater.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import { GetAppPath, GetUserSettings } from "./config.ts";
import { GetDateNow, ParseDate } from "./date.ts";
import { parse as parseYaml } from "@std/yaml";
import { StringifyYaml } from "./io.ts";
import * as DenoJson from "../../deno.json" with { type: "json" };
import { difference } from "@std/datetime";

export async function RunScheduledTasks(): Promise<void> {
    const settings = GetUserSettings();
    const scheduleFilePath: string = GetAppPath("SCHEDULE");
    const scheduleFile: CF_FKNODE_SCHEDULE = parseYaml(Deno.readTextFileSync(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const currentDate: Date = new Date();
    const { milliseconds } = difference(currentDate, ParseDate(scheduleFile.updater.lastCheck), { units: ["milliseconds"] });

    if (milliseconds! < settings["update-freq"]) return;

    const updatedScheduleFile: CF_FKNODE_SCHEDULE = {
        ...scheduleFile,
        updater: {
            lastCheck: GetDateNow(),
            latestVer: DenoJson.default.version,
        },
    };
    await TheUpdater({
        silent: true,
        force: false,
    });
    Deno.writeTextFileSync(scheduleFilePath, StringifyYaml(updatedScheduleFile));
}
