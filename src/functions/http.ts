import { LOCAL_PLATFORM } from "../platform.ts";
import { Commander } from "./cli.ts";

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
