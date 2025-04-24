import { compare, parse } from "@std/semver";
import { FetchGitHub } from "../functions/http.ts";
import { APP_URLs, LOCAL_PLATFORM, RELEASE_URL, VERSION } from "../constants.ts";
import type { GITHUB_RELEASE } from "../types/misc.ts";
import { GetDateNow } from "../functions/date.ts";
import type { TheUpdaterConstructedParams } from "./constructors/command.ts";
import { ColorString, Interrogate, LogStuff, StringifyYaml } from "../functions/io.ts";
import { parse as parseYaml } from "@std/yaml";
import { GetAppPath } from "../functions/config.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import { Commander } from "../functions/cli.ts";
import { JoinPaths } from "../functions/filesystem.ts";

/**
 * Checks for updates.
 *
 * @async
 * @export
 * @returns {Promise<void>}
 */
export default async function TheUpdater(params: TheUpdaterConstructedParams): Promise<void> {
    const scheduleFilePath = GetAppPath("SCHEDULE");
    const scheduleFileContents = parseYaml(Deno.readTextFileSync(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    async function CheckUpdates(): Promise<CF_FKNODE_SCHEDULE | "rl"> {
        const response = await FetchGitHub(RELEASE_URL);

        if (!response.ok) {
            if (response.status === 403) return "rl"; // (github has a rate limit, so this is not an error we should be really aware of)
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
    if (!params.install) return;
    if (!Interrogate("Should we auto-update the CLI for you?")) return;
    const filename = LOCAL_PLATFORM.SYSTEM === "windows" ? "install.ps1" : "install.sh";
    const buffer = await (await fetch(
        `${APP_URLs.WEBSITE}${filename}`,
    )).arrayBuffer();

    const path = Deno.makeTempDirSync({ prefix: "UPDATE-SH" });
    Deno.writeTextFileSync(JoinPaths(path, filename), new TextDecoder().decode(new Uint8Array(buffer)));

    Commander(
        LOCAL_PLATFORM.SYSTEM === "windows" ? "iex" : "bash",
        [JoinPaths(path, filename)],
    );
}
