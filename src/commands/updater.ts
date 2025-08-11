import { compare, parse } from "@std/semver";
import { FetchGitHub } from "../functions/http.ts";
import { RELEASE_URL, VERSION } from "../constants.ts";
import type { GITHUB_RELEASE } from "../types/misc.ts";
import { GetDateNow } from "../functions/date.ts";
import type { TheUpdaterConstructedParams } from "./constructors/command.ts";
import { ColorString, LogStuff, StringifyYaml } from "../functions/io.ts";
import { parse as parseYaml } from "@std/yaml";
import { GetAppPath } from "../functions/config.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";

async function CheckUpdates(): Promise<CF_FKNODE_SCHEDULE | "rl"> {
    const scheduleFilePath = GetAppPath("SCHEDULE");
    const scheduleFileContents = parseYaml(Deno.readTextFileSync(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const response = await FetchGitHub(RELEASE_URL);

    if (!response.ok) {
        // (github has a rate limit, so this is not an error we should be really aware of)
        if (response.status === 403) return "rl";
        // there's just one HTTP error app-wide, no need for a FknError
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content: GITHUB_RELEASE = await response.json();

    const dataToWrite: CF_FKNODE_SCHEDULE = {
        ...scheduleFileContents,
        updater: {
            lastCheck: GetDateNow(),
            latestVer: content.tag_name,
        },
    };

    Deno.writeTextFileSync(scheduleFilePath, StringifyYaml(dataToWrite));
    return dataToWrite;
}

/**
 * Checks for updates.
 *
 * @async
 * @returns {void}
 */
export default async function TheUpdater(params: TheUpdaterConstructedParams): Promise<void> {
    const needsToUpdate = await CheckUpdates();

    if (needsToUpdate === "rl") {
        LogStuff(
            "Bro was rate-limited by GitHub (update provider). Try again in a few hours.",
            "bruh",
            "bright-yellow",
        );
        return;
    }

    const { latestVer } = needsToUpdate.updater;

    if (compare(parse(VERSION), parse(latestVer)) >= 0) {
        if (params.silent) return;
        LogStuff(`You're up to date! ${ColorString(VERSION, "bright-green")} is the latest.`, "tick");
        return;
    }

    LogStuff(
        `There's a new version! ${latestVer}. You're on ${VERSION}, btw.`,
        "bulb",
    );
    return;
}
