import { compare, parse } from "@std/semver";
import type { GITHUB_RELEASE } from "../types/misc.ts";
import { GetDateNow } from "../functions/date.ts";
import type { TheUpdaterConstructedParams } from "./_interfaces.ts";
import { LogStuff, StringifyYaml } from "../functions/io.ts";
import { parse as parseYaml } from "@std/yaml";
import { GetAppPath } from "../functions/config.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import * as DenoJson from "../../deno.json" with { type: "json" };
import { ColorString } from "../functions/color.ts";
import { LOCAL_PLATFORM } from "../platform.ts";
import { validate } from "@zakahacecosas/string-utils";

async function CheckUpdates(): Promise<CF_FKNODE_SCHEDULE | "rl"> {
    const scheduleFilePath = GetAppPath("SCHEDULE");
    const scheduleFileContents = parseYaml(Deno.readTextFileSync(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const response = await fetch("https://api.github.com/repos/FuckingNode/FuckingNode/releases/latest", {
        headers: { Accept: "application/vnd.github.v3+json" },
    });

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
 * Checks for updates and updates the CLI if outdated.
 *
 * @async
 * @returns {void}
 */
export default async function TheUpdater(params: TheUpdaterConstructedParams): Promise<void> {
    const needsToUpdate = await CheckUpdates();

    if (needsToUpdate === "rl") {
        LogStuff(
            "You were rate-limited by GitHub (from where we download updates), my bro. Try again in, at most, one hour.",
            "bruh",
            "bright-yellow",
        );
        return;
    }

    const { latestVer } = needsToUpdate.updater;

    if (compare(parse(DenoJson.default.version), parse(latestVer)) >= 0) {
        if (params.silent) return;
        LogStuff(`You're up to date! ${ColorString(DenoJson.default.version, "bright-green")} is the latest.`, "tick");
        return;
    }

    LogStuff(
        `There's a new version! ${ColorString(latestVer, "bright-green")}. You're on ${
            ColorString(DenoJson.default.version, "green")
        }, by the way.`,
        "bulb",
    );
    if (params.silent) return;
    LogStuff("Updating...", "package");
    const res = await fetch(
        `https://fuckingnode.github.io/install${LOCAL_PLATFORM.SSS}`,
    );
    const path = Deno.makeTempFileSync({ suffix: LOCAL_PLATFORM.SSS });
    Deno.writeFileSync(
        path,
        await res.bytes(),
    );
    await new Deno.Command(
        LOCAL_PLATFORM.SHELL,
        {
            args: [
                LOCAL_PLATFORM.SYSTEM === "msft" ? "-File" : undefined,
                path,
                Deno.pid.toString(),
            ].filter(validate),
        },
    ).spawn().output();
    LogStuff(`You're now up to date! Congrats and welcome to ${ColorString(latestVer, "bright-green")}.`, "tick");
    return;
}
