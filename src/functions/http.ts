import { LOCAL_PLATFORM } from "../constants/platform.ts";
import type { VALID_URL } from "../types/misc.ts";
import { Commander } from "./cli.ts";

/**
 * Fetches a resource using GitHub's headers.
 *
 * @async
 * @param {VALID_URL} url
 * @returns {Promise<Response>}
 */

export async function FetchGitHub(url: VALID_URL): Promise<Response> {
    return await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
}

export function LaunchWebsite(url: VALID_URL): void {
    const base = LOCAL_PLATFORM.SYSTEM === "windows" ? "start" : "open";

    Commander(
        base,
        [url],
    );
}
