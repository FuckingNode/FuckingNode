import { join, normalize } from "@std/path";
import { StringArray, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";

/**
 * Returns `true` if a given path exists, `false` if otherwise.
 *
 * @param {string} path Path to check for
 * @returns {boolean}
 */
export function CheckForPath(path: string): boolean {
    try {
        Deno.statSync(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks for a directory, returns a string depending on the result.
 *
 * @async
 * @param {string} path
 * @returns {Promise<"NotDir" | "ValidButNotEmpty" | "NotFound" | "Valid">}
 */
export async function CheckForDir(path: string): Promise<"NotDir" | "ValidButNotEmpty" | "NotFound" | "Valid"> {
    try {
        const info = await Deno.stat(path);
        if (!info.isDirectory) return "NotDir";
        for await (const _ of Deno.readDir(path)) return "ValidButNotEmpty";
        return "Valid";
    } catch (e) {
        // path doesn't exist.
        if (e instanceof Deno.errors.NotFound) return "NotFound";
        // unexpected sh*t happened
        throw e;
    }
}

/**
 * Parses a string path, to ensure string cleanness and handle things like relative paths.
 *
 * @param {UnknownString} target The string to parse.
 * @returns {string} A string with the parsed path.
 */
export function ParsePath(target: UnknownString): string {
    try {
        if (!validate(target)) {
            throw new FknError(
                "Param__WhateverUnprovided",
                "Target for path parsing must be (obviously) a string.",
            );
        }

        let workingTarget: string;

        try {
            workingTarget = Deno.realPathSync(target.trim());
        } catch {
            // fallback
            workingTarget = target.trim();
        }

        const cleanEntry = normalize(workingTarget);

        if (cleanEntry.endsWith("/") || cleanEntry.endsWith("\\")) return cleanEntry.slice(0, -1);

        return cleanEntry.trim();
    } catch (e) {
        throw new FknError("Fs__UnparsablePath", `Error parsing ${target}: ${e}`);
    }
}

/**
 * Parses a string of a lot of file paths separated by newlines or commas, and returns them as an array of individual paths.
 *
 * @param {UnknownString} target The string to parse.
 * @returns {string[]} Your `string[]`.
 */
export function ParsePathList(target: UnknownString): string[] {
    if (!validate(target)) return [];

    return StringArray.fromKominator(target, "\n")
        .sortAlphabetically()
        .arr()
        .map((line) => line.trim().replace(/,$/, ""))
        .filter((line) => line.length > 0)
        .map(ParsePath);
}

/**
 * Joins two parts of a file path. If they cannot be found, you'll be given back an unparsed join.
 *
 * @param {string} pathA First part, e.g. "./my/beginning".
 * @param {string} pathB Second part, e.g. "my/end.txt".
 * @returns {string} Result, e.g. "./my/beginning/my/end.txt".
 */
export function JoinPaths(pathA: string, pathB: string): string {
    try {
        const firstPart = ParsePath(pathA);
        const secondPath = pathB.trim();
        return join(firstPart, secondPath);
    } catch {
        return join(pathA, pathB);
    }
}

/**
 * Takes an array of paths and removes all of them, with recursive removal enabled.
 *
 * @async
 * @param {string[]} files Array of file paths to remove
 */
export async function BulkRemove(files: string[]): Promise<void> {
    if (files.length === 0) return;
    await Promise.all(files.map((file) =>
        Deno.remove(ParsePath(file), {
            recursive: true,
        })
    ));
}

/** Gets the indent size used by an already read file, with fair enough accuracy. */
export function GetTextIndentSize(file: string): number {
    const line = file.trim().split("\n")[1] || "";
    const indentSize: number = line.length - line.trim().length || 4;
    return indentSize;
}
