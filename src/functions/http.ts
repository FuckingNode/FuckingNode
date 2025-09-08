import { LOCAL_PLATFORM } from "../constants/platform.ts";
import { Commander } from "./cli.ts";

/**
 * Fetches a resource using GitHub's headers.
 *
 * @async
 * @param {string} url
 * @returns {Promise<Response>}
 */
export async function FetchGitHub(url: string): Promise<Response> {
    return await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
}

/**
 * Launches a website in the user's browser.
 *
 * @param {string} url
 * @returns {void}
 */
export function LaunchWebsite(url: string): void {
    Commander(
        LOCAL_PLATFORM.SYSTEM === "msft" ? "start" : "open",
        [url],
    );
}
