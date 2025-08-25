import type { MANAGER_GLOBAL } from "../types/platform.ts";
import { FknError } from "./error.ts";

const decoder = new TextDecoder();

/**
 * Executes commands and automatically handles errors. Doesn't show live output (it used to but...).
 *
 * @async
 * @param {string} main Main command.
 * @param {(string | undefined)[]} stuff Additional args for the command. `undefined` strings get removed.
 * @returns {CommanderOutput} An object with a boolean telling if it was successful or not, and its full output.
 */
export function Commander(
    main: string,
    stuff: (string | undefined)[],
): {
    /**
     * True if success, false if failure.
     *
     * @type {boolean}
     */
    success: boolean;
    /**
     * Output of the command. Uses both `stdout` and `stderr`, joined by an \n. Trimmed.
     *
     * @type {string}
     */
    stdout: string;
} {
    try {
        const args = stuff.filter((i) => i !== undefined);

        const command = new Deno.Command(
            main,
            {
                args,
                stdout: "piped",
                stderr: "piped",
            },
        );

        const process = command.outputSync();

        return {
            success: process.success,
            stdout: `${decoder.decode(process.stdout)}\n${decoder.decode(process.stderr)}`.trim(),
        };
    } catch (error) {
        if (error instanceof Deno.errors.NotFound && error.message.toLowerCase().includes("failed to spawn")) {
            throw new FknError("Os__NoEntity", `We attempted to run a shell / CLI command (${main}), but your OS wasn't able find it.`);
        }
        throw error;
    }
}

/**
 * Validates if a package manager is installed, to check before running anything.
 *
 * @param {MANAGER_GLOBAL} cmd Manager to check for.
 * @returns {boolean} True if it exists, false if it doesn't.
 */
export function ManagerExists(cmd: MANAGER_GLOBAL): boolean {
    try {
        return new Deno.Command(cmd, {
            args: cmd === "go" ? ["help"] : ["-v"],
            stdout: "null",
            stderr: "null",
        }).outputSync().success;
    } catch {
        // error = false
        return false;
    }
}
