import { compare, parse } from "@std/semver";
import type { GITHUB_RELEASE } from "../types/misc.ts";
import { GetDateNow } from "../functions/date.ts";
import type { TheUpdaterConstructedParams } from "./_interfaces.ts";
import { LogStuff, StringifyYaml } from "../functions/io.ts";
import { parse as parseYaml } from "@std/yaml";
import { GetAppPath } from "../functions/config.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import * as DenoJson from "../../deno.json" with { type: "json" };
import { LOCAL_PLATFORM } from "../platform.ts";
import { validateAgainst } from "@zakahacecosas/string-utils";
import { parse as parsePath } from "@std/path";
import { brightGreen, brightYellow, green } from "@std/fmt/colors";

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
            brightYellow("You were rate-limited by GitHub (from where we download updates), my bro. Try again in, at most, one hour."),
            "bruh",
        );
        return;
    }

    const { latestVer } = needsToUpdate.updater;

    if ((compare(parse(DenoJson.default.version), parse(latestVer)) >= 0) && !params.force) {
        if (params.silent) return;
        LogStuff(`You're up to date! ${brightGreen(DenoJson.default.version)} is the latest.`, "tick");
        return;
    }

    LogStuff(
        params.force
            ? "Forced update/reinstall."
            : `There's a new version! ${brightGreen(latestVer)}. You're on ${green(DenoJson.default.version)}, by the way.`,
        "bulb",
    );
    if (params.silent) return;
    if (!validateAgainst(parsePath(Deno.execPath()).dir, ["C:\\FuckingNode", "/usr/local/fuckingnode"])) {
        LogStuff(
            "Installed from a package manager, please use said package manager to update FuckingNode.\nIf you didn't install from a package manager, then FuckingNode is running from an unknown, which is likely an installation error (or you moving it somewhere else).",
        );
    }
    LogStuff("Updating...", "package");
    const res = await fetch(
        `https://fuckingnode.github.io/install${LOCAL_PLATFORM.SSS}`,
    );
    const path = Deno.makeTempFileSync({ prefix: "UPDATE-FKN", suffix: LOCAL_PLATFORM.SSS });
    Deno.writeFileSync(
        path,
        await res.bytes(),
    );
    if (LOCAL_PLATFORM.SYSTEM === "msft") {
        await new Deno.Command(
            LOCAL_PLATFORM.SHELL,
            {
                args: [
                    "-File",
                    path,
                    Deno.pid.toString(),
                ],
            },
        ).spawn().output();
    } else {
        await new Deno.Command(
            LOCAL_PLATFORM.SHELL,
            {
                args: [
                    path,
                    Deno.pid.toString(),
                ],
                detached: true,
            },
        ).spawn().output();
    }
    LogStuff(
        `Updating to ${brightGreen(latestVer)}. A separate terminal should've popped up and started downloading the update.`,
        "tick",
    );
    return;
}
