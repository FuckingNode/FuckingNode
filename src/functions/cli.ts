import type { MANAGER_GLOBAL } from "../types/platform.ts";

/**
 * Output of a CLI command called using Commander.
 *
 * @interface CommanderOutput
 */
export interface CommanderOutput {
    /**
     * True if success, false if failure.
     *
     * @type {boolean}
     */
    success: boolean;
    /**
     * Output of the command. Uses both `stdout` and `stderr`, joined by an \n.
     *
     * @type {?string}
     */
    stdout?: string;
}

/**
 * Executes commands and automatically handles errors.
 *
 * Also, it logs their content synchronously (unless you hide output) so they look "real". PS. THAT ONE TOOK IT'S TIME
 *
 * @export
 * @async
 * @param {string} main Main command.
 * @param {string[]} stuff Additional args for the command.
 * @param {?boolean} showOutput Defaults to true. If false, the output of the command won't be shown and it'll be returned in the `CommanderOutput` object instead.
 * @returns {CommanderOutput} An object with a boolean telling if it was successful and its output.
 */
export function Commander(
    main: string,
    stuff: (string | undefined)[],
    showOutput?: boolean,
): CommanderOutput {
    const args = stuff.filter((i) => i !== undefined);

    if (showOutput === false) {
        const command = new Deno.Command(main, {
            args,
            stdout: "piped",
            stderr: "piped",
        });

        const process = command.outputSync();

        const result: CommanderOutput = {
            success: process.success,
            stdout: `${new TextDecoder().decode(process.stdout)}${process.stderr ? "\n" + new TextDecoder().decode(process.stderr) : ""}`,
        };

        return result;
    }

    const command = new Deno.Command(main, {
        args,
        stdout: "inherit",
        stderr: "inherit",
        stdin: "inherit",
    });

    const process = command.outputSync();

    const result: CommanderOutput = {
        success: process.code === 0,
    };

    return result;
}

/**
 * Validates if a package manager is installed, to check before running anything. Uses `-v` and `--version` as an arg to the command you pass.
 *
 * @export
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
