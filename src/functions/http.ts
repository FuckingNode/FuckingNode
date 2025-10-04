import { LOCAL_PLATFORM } from "../platform.ts";
import { Commander } from "./cli.ts";

/**
 * Launches a website in the user's browser.
 *
 * @param {string} url
 * @returns {void}
 */
export function LaunchWebsite(url: string): void {
    if (LOCAL_PLATFORM.SYSTEM === "msft") {
        Commander(
            LOCAL_PLATFORM.SHELL,
            [
                "-c",
                "start",
                url,
            ],
        );
    } else {
        Commander(
            "open",
            [
                url,
            ],
        );
    }
    return;
}
