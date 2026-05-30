import type { UnknownString } from "@zakahacecosas/string-utils";

/**
 * Valid emojis
 */
export type VALID_EMOJIS =
    | "danger"
    | "prohibited"
    | "wip"
    | "what"
    | "bulb"
    | "tick"
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
    | "comrade"
    | "skip";

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
 * Git file codes.
 */
export type GIT_FILES = UnknownString[] | "A" | "!A" | "S";

/** typescript just shut the hell up */
export type NonEmptyArray<T> = [T, ...T[]];

/** states regarding the committableness (term i made up) of a git repo
 *
 * if you need some "IsSafe" check just do `x == 5` (`5 == CommittablenessState.SAFE`), anything else is equally unsafe and the fine-grained-ness is only for the fkn commit thing
 */
export const enum CommittablenessState {
    /** Uncommitted unstaged changes exist. Cannot commit safely. */
    UNSTAGED,
    /** Untracked files exist, but tracked files are unchanged. */
    UNTRACKED_ONLY,
    /** Staged changes exist with no other dirt. Ready to commit. */
    STAGED,
    /** Staged changes AND unstaged changes exist simultaneously. Cannot commit safely. */
    STAGED_AND_DIRTY,
    /** Local branch is behind the remote. Should not commit. */
    BEHIND_REMOTE,
    /** No changes anywhere. Nothing to commit. Only safe state. */
    SAFE,
}
