import TheUpdater from "../commands/updater.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import { FlushConfigFiles, GetAppPath, GetUserSettings } from "./config.ts";
import { GetDateNow, ParseDate } from "./date.ts";
import { parse as parseYaml } from "@std/yaml";
import { StringifyYaml } from "./io.ts";
import * as DenoJson from "../../deno.json" with { type: "json" };

export async function RunScheduledTasks() {
    const settings = GetUserSettings();
    const scheduleFilePath: string = GetAppPath("SCHEDULE");
    const scheduleFile: CF_FKNODE_SCHEDULE = parseYaml(Deno.readTextFileSync(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const currentDate: Date = new Date();
    function CalculateDifference(date: Date) {
        return (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    }

    const dates = {
        updater: {
            last: scheduleFile.updater.lastCheck,
            diff: CalculateDifference(
                ParseDate(scheduleFile.updater.lastCheck),
            ),
        },
        flusher: {
            last: scheduleFile.flusher.lastFlush,
            diff: CalculateDifference(
                ParseDate(scheduleFile.flusher.lastFlush),
            ),
        },
    };

    if (dates.updater.diff >= settings["update-freq"]) {
        const updatedScheduleFile: CF_FKNODE_SCHEDULE = {
            ...scheduleFile,
            updater: {
                lastCheck: GetDateNow(),
                latestVer: DenoJson.default.version,
            },
        };
        await TheUpdater({
            silent: true,
        });
        Deno.writeTextFileSync(scheduleFilePath, StringifyYaml(updatedScheduleFile));
    }

    if (dates.flusher.diff >= settings["flush-freq"]) {
        const updatedScheduleFile: CF_FKNODE_SCHEDULE = {
            ...scheduleFile,
            flusher: {
                lastFlush: GetDateNow(),
            },
        };
        await FlushConfigFiles("logs", true, true);
        Deno.writeTextFileSync(scheduleFilePath, StringifyYaml(updatedScheduleFile));
    }
}
