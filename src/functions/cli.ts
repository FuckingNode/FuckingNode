import type { MANAGER_GLOBAL } from "../types/platform.ts";
import { FknError } from "./error.ts";
import { LOCAL_PLATFORM } from "../constants/platform.ts";

export function Commander(
    main: string,
    stuff: (string | undefined)[],
    showOutput?: false | boolean,
): {
    success: boolean;
    stdout: string;
};
export function Commander(
    main: string,
    stuff: (string | undefined)[],
    showOutput: true,
): {
    success: boolean;
};
/**
 * Executes commands and automatically handles errors.
 *
 * Also, it logs their content synchronously (unless you hide output) so they look "real".
 *
 * @async
 * @param {string} main Main command.
 * @param {string[]} stuff Additional args for the command.
 * @param {?boolean} showOutput Defaults to true. If false, the output of the command won't be shown in the current shell.
 * @returns {CommanderOutput} An object with a boolean telling if it was successful or not, and its full output.
 */
export function Commander(
    main: string,
    stuff: (string | undefined)[],
    showOutput?: boolean,
): {
    /**
     * True if success, false if failure.
     *
     * @type {boolean}
     */
    success: boolean;
    /**
     * Output of the command. Uses both `stdout` and `stderr`, joined by an \n.
     *
     * @type {string | undefined}
     */
    stdout: string | undefined;
} {
    try {
        const args = stuff.filter((i) => i !== undefined);

        const command = new Deno.Command(
            main,
            showOutput === false
                ? {
                    args,
                    stdout: "piped",
                    stderr: "piped",
                }
                : {
                    args,
                    stdout: "inherit",
                    stderr: "inherit",
                    stdin: "inherit",
                },
        );

        const process = command.outputSync();
        const decoder = new TextDecoder();

        if (showOutput === true) {
            // @ts-expect-error TS thinks the return type is wrong, but it isn't...
            return {
                success: process.success,
            };
        }

        return {
            success: process.success,
            stdout: `${decoder.decode(process.stdout)}${decoder.decode(process.stderr)}`,
        };
    } catch (error) {
        if (error instanceof Deno.errors.NotFound && error.message.toLowerCase().includes("failed to spawn")) {
            const err = new FknError("Os__NoEntity", `We attempted to run a shell / CLI command (${main}), but your OS wasn't able find it.`);
            if (LOCAL_PLATFORM.SYSTEM === "windows") {
                err.hint =
                    `Just in case it's a shell command (like, e.g., 'echo') and you input it somewhere like 'buildCmd': it has to be preceded with 'powershell' or 'cmd', as its passed as an argument to this executable.`;
            }
        }
        throw error;
    }
}

/**
 * Validates if a package manager is installed, to check before running anything. Uses `-v` and `--version` as an arg to the command you pass.
 *
 * @param {MANAGER_GLOBAL} cmd
 * @returns {boolean} True if it exists, false if it doesn't.
 */
export function ManagerExists(cmd: MANAGER_GLOBAL): boolean {
    try {
        const process = new Deno.Command(cmd, {
            args: cmd === "go" ? ["help"] : ["-v"],
            stdout: "null",
            stderr: "null",
        });

        // sync on purpose so we pause execution until we 100% know if command exists or not
        return process.outputSync().success;
    } catch {
        // error = false
        return false;
    }
}
