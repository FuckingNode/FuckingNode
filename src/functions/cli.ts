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
    stuff: string[],
    showOutput?: boolean,
): CommanderOutput {
    if (showOutput === false) {
        const command = new Deno.Command(main, {
            args: stuff,
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
        args: stuff,
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
 * Validates if a command exists. Useful to check if the user has some tool installed before running anything. Uses `-v` and `--version` as an arg to whatever command you pass.
 *
 * @export
 * @param {MANAGER_GLOBAL} cmd
 * @returns {boolean}
 */
export function CommandExists(cmd: MANAGER_GLOBAL): boolean {
    try {
        const process = new Deno.Command(cmd, {
            args: ["-v"], // this single line fixed a bug that has been present for at least two months 😭
            stdout: "null",
            stderr: "null",
        });
        const processTwo = new Deno.Command(cmd, {
            args: ["--version"],
            stdout: "null",
            stderr: "null",
        });
        const processThree = new Deno.Command(cmd, {
            args: ["help"], // platform-specific fix (go)
            stdout: "null",
            stderr: "null",
        });

        // sync on purpose so we pause execution until we 100% know if command exists or not
        return (process.outputSync()).success || (processTwo.outputSync()).success || (processThree.outputSync()).success;
    } catch {
        // error = false
        return false;
    }
}
