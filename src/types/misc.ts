import { UnknownString } from "@zakahacecosas/string-utils";

/**
 * Valid emojis
 *
 * @export
 */
export type VALID_EMOJIS =
    | "danger"
    | "prohibited"
    | "wip"
    | "what"
    | "bulb"
    | "tick"
    | "tick-clear"
    | "error"
    | "heads-up"
    | "working"
    | "moon-face"
    | "bruh"
    | "warn"
    | "package"
    | "trash"
    | "chart"
    | "wink"
    | "comrade";

/**
 * A GitHub release asset.
 */
type GitHubReleaseAsset = {
    url: string;
    name: string;
    label: string | null;
    size: number;
    download_count: number;
    /**
     * URL to download the asset. This is what we mostly care about.
     *
     * @type {string}
     */
    browser_download_url: string;
};

/**
 * An interface so we can type responses from GitHub's REST API.
 *
 * @export
 * @interface GITHUB_RELEASE
 */
export interface GITHUB_RELEASE {
    /**
     * Version of a release. Uses the SemVer format.
     *
     * @type {string}
     */
    tag_name: string;
    /**
     * Assets of a release.
     *
     * @type {GitHubReleaseAsset[]}
     */
    assets: GitHubReleaseAsset[];
}

/**
 * A string preceded with "https://"
 *
 * @export
 */
export type VALID_URL = `https://${string}`;

/**
 * Colors that can be used to spice up the CLI's stdout.
 */
export type VALID_COLORS =
    | "red"
    | "white"
    | "bold"
    | "blue"
    | "green"
    | "cyan"
    | "purple"
    | "pink"
    | "half-opaque"
    | "bright-green"
    | "italic"
    | "bright-blue"
    | "bright-yellow"
    | "orange";

/**
 * Git file codes.
 *
 * @export
 */
export type GIT_FILES = UnknownString[] | "A" | "S";
