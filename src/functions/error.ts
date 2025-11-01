import { join } from "@std/path/join";
import { ColorString } from "./color.ts";
import type { GLOBAL_ERROR_CODES } from "../types/errors.ts";
import { GetDateNow } from "./date.ts";
import { type UnknownString, validate } from "@zakahacecosas/string-utils";
import { FKNODE_SHALL_WE_DEBUG } from "../main.ts";
import { LOCAL_PLATFORM } from "../platform.ts";
import { stripAnsiCode } from "@std/fmt/colors";
import { ALIASES } from "../commands/toolkit/git-url.ts";

/**
 * Errors that we know about, or that are caused by the user.
 *
 * @class FknError
 * @extends {Error}
 */
export class FknError extends Error {
    code: GLOBAL_ERROR_CODES;
    hint: string | undefined;

    /**
     * Creates an instance of FknError.
     *
     * @constructor
     * @param {GLOBAL_ERROR_CODES} code Error code.
     * @param {?string} message An optional error message.
     */
    constructor(code: GLOBAL_ERROR_CODES, message?: string) {
        super(message);
        this.name = "FknError";
        this.code = code;
        switch (this.code) {
            case "Interop__FileRunUnable":
                this.hint =
                    "You're likely taking advantage of certain features being agnostic, making us unable to tell how to run a file.\nBest fix is to use the RAW EXEC (<) CmdKey and manually type the file run command of this project's stack.";
                break;
            case "Param__CIntensityInvalid":
                this.hint =
                    "Valid intensity levels are 'normal', 'hard', 'hard-only', 'maxim', and 'maxim-only'.\nIf you want to use flags without providing an intensity (e.g. 'clean --pretty'), prepend '-- --' to the command ('clean -- -- -pretty'). Run 'help clean' for more info onto what does each level do.";
                break;
            case "Cfg__FknYaml__InvalidCmdK":
                this.hint =
                    'Every command within a Cmd set needs to start with either "~" (SHELL SCRIPT), "$" (PROJECT SCRIPT), "=" (PROJECT FILE), or "<" (RAW EXEC).';
                break;
            case "Env__CannotDetermine":
                this.hint =
                    "To (manually) fix this, manually specify the package manager you use via the 'fknode.yaml' file, by adding the 'projectEnvOverride' field with the value of 'npm', 'pnpm', 'bun', 'deno', 'golang', or 'rust'.";
                break;
            case "Os__NoEntity":
                if (LOCAL_PLATFORM.SYSTEM === "msft") {
                    this.hint =
                        `Just in case it's a shell command (like 'echo' or 'ls') and you input it somewhere like 'buildCmd': it has to be preceded with 'powershell', as its passed as an argument to this executable.`;
                }
                break;
            case "Fs__Unreal":
                this.hint =
                    "Check for typos - the path you provided wasn't found in the filesystem. If you're sure the path is right, maybe it's a permission issue. If not, open an issue on GitHub so we can fix our tool that fixes NodeJS ;).";
                break;
            case "Os__NoAppdataNoHome":
                this.hint = `We tried to find ${
                    ColorString(
                        LOCAL_PLATFORM.SYSTEM === "msft" ? "APPDATA env variable" : "XDG_CONFIG_HOME and HOME env variables",
                        "bold",
                    )
                } but failed, meaning config files cannot be created and the CLI can't work. Something seriously went motherfuckingly wrong. If these aren't the right environment variables for your system's config path (currently using APPDATA on Windows, /home/user/.config on macOS and Linux), please raise an issue on GitHub.`;
                break;
            case "Env__NotFound":
                this.hint = `Check for typos or a wrong name. Given input (either a project's name or a file path) wasn't found.`;
                break;
            case "Env__PkgFileUnparsable":
                this.hint =
                    `Your project's main file (package.json, deno.json, go.mod, etc.) is unparsable, or is missing basic fields ("name" and "version" on JS/Cargo, "go" and "module" on Golang).\nCheck for typos or syntax errors. If you're sure the file is correct, please open an issue on GitHub (if everything's right, it might be a bug with our interop layer).`;
                break;
            case "Interop__JSRunUnable":
                this.hint =
                    `Non-JS environments do not have an equivalent to "npm run" or "yarn run" tasks, so we can't execute that task. To avoid undesired behavior, we stopped execution. Please remove the setting key from this fknode.yaml that's causing the error.`;
                break;
            case "Env__MissingMotor":
                this.hint =
                    "The specified runtime / package manager is not installed on your machine! Please install it for this task to work. If it is installed and you still got this error, please raise an issue on GitHub.";
                break;
            case "Fs__UnparsablePath":
                this.hint = `The given path was not found. Check for typos${
                    LOCAL_PLATFORM.SYSTEM === "msft" ? "." : " or casing mistakes (you're on Linux mate, paths are case-sensitive)."
                }`;
                break;
            case "Env__SchrodingerLockfile":
                this.hint =
                    "Either leave just one lockfile, or manually specify the package manager you use via the 'fknode.yaml' file, by adding the 'projectEnvOverride' field with the value of 'npm', 'pnpm', 'bun', 'deno', 'golang', or 'rust'.";
                break;
            case "Git__NoBranch":
                this.hint =
                    "Choose the right branch. If you're sure you've chosen the right one and think this might be a bug, file an issue on GitHub.";
                break;
            case "Git__NoBranchAA":
                this.hint = "This is likely a bug. Please file an issue on GitHub.";
                break;
            case "Param__GitTargetInvalid":
                this.hint =
                    "Provide a proper URL (that points to a Git repo). If you provide a valid URL without ending in .git we'll auto-append it for you.";
                break;
            case "Param__GitTargetAliasInvalid":
                this.hint = `Provide a valid Git alias. These follow the PROVIDER:OWNER/REPO format, where PROVIDED is any of these:\n${
                    Object.keys(ALIASES).join(", ")
                }`;
                break;
            case "Git__Forbidden":
                this.hint =
                    "Sensible files like .env or node_modules/ are intentionally banned from commits (to prevent a catastrophe). Please, manually unstage this file, then re-run without staging it (and preferably add it to .gitignore).";
                break;
        }
        if (Error.captureStackTrace) Error.captureStackTrace(this, FknError);
    }

    private handleMessage(): void {
        const messageParts: string[] = [
            "----------",
            ColorString(`A FknError happened! ${ColorString(this.code, "bold")}`, "red"),
        ];
        if (this.message) {
            messageParts.push(
                `Thrown message:      ${ColorString(this.message, "bright-yellow")}`,
            );
        }
        if (this.hint !== undefined) {
            messageParts.push(
                "----------",
                `${ColorString("Hint:", "bright-blue")} ${ColorString(this.hint, "italic")}`,
                "----------",
            );
        }

        console.error(messageParts.join("\n")); // don't risk it, maybe LogStuff() won't work
        return;
    }

    /**
     * Dumps a debug log into the `ERRORS` file. Write anything here, such as an entire main file string.
     *
     * @public
     * @param {string} debuggableContent The content to be dumped.
     * @returns {void}
     */
    public debug(debuggableContent: UnknownString, showWarn: boolean = true): void {
        // APPDATA! because if we're already debugging stuff we assume the CLI got to run
        // meaning that path does exist
        // doesn't use GetAppPath just in case that's the thing erroring, you know
        const debugPath = join(LOCAL_PLATFORM.APPDATA!, "fuckingnode", "fuckingnode-errors.log");
        const debuggableError = `---
# BEGIN FknERROR ${this.code} @ ${new Date().toISOString()}
---
>>> INFO (so you know where you at)
Timestamp      :  ${GetDateNow()},
FknError code  :  ${this.code},
Thrown message :  ${this.message},
Thrown hint    :  ${this.hint},
>>> STACK (so the dev knows where he at)
${this.stack}
>>> DEBUGGABLE CONTENT
below goes the debugged content dump (in most cases, what the CLI command that was executed returned).
it may happen to be a sh*t ton of stuff to read.
>>> BEGIN DEBUGGABLE CONTENT
${stripAnsiCode(validate(debuggableContent) ? debuggableContent : "UNKNOWN OUTPUT - No debuggableContent was provided, or it was empty.")}
>>> END DEBUGGABLE CONTENT
# END   FknERROR ${this.code} # GOOD LUCK FIXING THIS
---\n`;
        if (showWarn) {
            console.warn(
                ColorString(`An exception occurred. For details about what happened, see the last entry of ${debugPath}`, "orange"),
            );
        }
        Deno.writeTextFileSync(
            debugPath,
            debuggableError,
            {
                append: true,
            },
        );
    }

    /**
     * Handles the error and exits the CLI. Don't use this directly, use {@linkcode ErrorHandler} instead.
     */
    public exit(): never {
        this.handleMessage();
        Deno.exit(1);
    }
}

/**
 * Handles an error and quits. Save up a few lines of code by using this in the `catch` block.
 *
 * @param {unknown} e The error.
 * @returns {never} _Below any call to this function nothing can happen. It exits the CLI with code 1._
 */
export function ErrorHandler(e: unknown): never {
    if (e instanceof FknError) {
        e.exit();
        Deno.exit(1); // (never reached, but without this line typescript doesn't shut up)
    }
    const fk = ColorString("f*ck", "red", "bold");
    if (Error.isError(e)) {
        console.error(`${fk}! Something happened: ${e.message} (${e.cause})\n${e.stack}`);
        Deno.exit(1);
    }
    console.error(`${fk}! Something strange happened: ${e}`);
    Deno.exit(1);
}

/** function to write debug logs, only visible if env variable FKNODE_SHALL_WE_DEBUG is set to `yeah`
 *
 * (constant case instead of pascal case so i can better recognize this)
 */
export function DEBUG_LOG(...a: unknown[]): void {
    if (FKNODE_SHALL_WE_DEBUG) console.debug(" >>> FKNDBG >>>", ...a);
}

/** Throws a `FknError` and writes any debuggable content. */
export function DebugFknErr(
    code: GLOBAL_ERROR_CODES,
    message: UnknownString,
    debuggableContent: UnknownString,
    showWarn: boolean = true,
): never {
    const err = new FknError(code, validate(message) ? message : undefined);
    err.debug(
        debuggableContent,
        showWarn,
    );
    throw err;
}
