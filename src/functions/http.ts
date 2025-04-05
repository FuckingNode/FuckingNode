import { LOCAL_PLATFORM } from "../constants.ts";
import type { tURL } from "../types/misc.ts";
import { Commander } from "./cli.ts";

/**
 * Fetches a resource using GitHub's headers.
 *
 * @export
 * @async
 * @param {tURL} url
 * @returns {Promise<Response>}
 */

export async function FetchGitHub(url: tURL): Promise<Response> {
    return await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
}

export function LaunchWebsite(url: tURL): void {
    const base = LOCAL_PLATFORM.SYSTEM === "windows" ? "start" : "open";

    Commander(
        base,
        [url],
    );
}
