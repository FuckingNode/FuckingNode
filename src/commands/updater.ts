import { compare, parse } from "@std/semver";
import { FetchGitHub } from "../functions/http.ts";
import { LOCAL_PLATFORM, RELEASE_URL, VERSIONING } from "../constants.ts";
import type { GITHUB_RELEASE } from "../types/misc.ts";
import { GetDateNow } from "../functions/date.ts";
import type { TheUpdaterConstructedParams } from "./constructors/command.ts";
import { ColorString, LogStuff, StringifyYaml } from "../functions/io.ts";
import { parse as parseYaml } from "@std/yaml";
import { GetAppPath } from "../functions/config.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import { Commander } from "../functions/cli.ts";
import { JoinPaths } from "../functions/filesystem.ts";

async function TellAboutUpdate(newVer: string): Promise<void> {
    await LogStuff(
        `There's a new version! ${newVer}. Consider downloading it from GitHub. You're on ${VERSIONING.APP}, btw.`,
        "bulb",
    );
}

/**
 * Checks for updates.
 *
 * @export
 * @returns {Promise<void>}
 */
export default async function TheUpdater(params: TheUpdaterConstructedParams): Promise<void> {
    const scheduleFilePath = GetAppPath("SCHEDULE");
    const scheduleFileContents = parseYaml(await Deno.readTextFile(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const IsUpToDate: (tag: string) => boolean = (tag: string) => compare(parse(VERSIONING.APP), parse(tag)) >= 0;

    async function CheckUpdates(): Promise<CF_FKNODE_SCHEDULE | "rl"> {
        try {
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

            await Deno.writeTextFile(scheduleFilePath, StringifyYaml(dataToWrite));
            return dataToWrite;
        } catch (e) {
            throw new Error("Error checking for updates: " + e);
        }
    }

    const needsToUpdate = await CheckUpdates();
    if (needsToUpdate === "rl") {
        await LogStuff(
            "Bro was rate-limited by GitHub (update provider). Try again in a few hours.",
            "bruh",
            "bright-yellow",
        );
        return;
    }

    const { latestVer } = needsToUpdate.updater;

    if (IsUpToDate(latestVer)) {
        if (params.silent) return;
        await LogStuff(`You're up to date! ${ColorString(VERSIONING.APP, "bright-green")} is the latest.`, "tick");
        return;
    } else {
        await TellAboutUpdate(latestVer);
        if (!params.install) return;
        const filename = LOCAL_PLATFORM.SYSTEM === "windows" ? "install.ps1" : "install.sh";
        const res = await fetch(
            LOCAL_PLATFORM.SYSTEM === "windows" ? "https://fuckingnode.github.io/install.ps1" : "https://fuckingnode.github.io/install.sh",
        );

        const buffer = await res.arrayBuffer();

        const path = Deno.makeTempDirSync({ prefix: "UPDATE-SH" });
        Deno.writeFileSync(JoinPaths(path, filename), new Uint8Array(buffer));

        await Commander(
            LOCAL_PLATFORM.SYSTEM === "windows" ? "iex" : "bash",
            [JoinPaths(path, filename)],
        );
    }
}
