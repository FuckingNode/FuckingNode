import { join } from "@std/path/join";
import { APP_NAME, FWORDS, LOCAL_PLATFORM } from "../constants.ts";
import { ColorString } from "./io.ts";
import type { GLOBAL_ERROR_CODES } from "../types/errors.ts";
import { GetDateNow } from "./date.ts";
import { stripCliColors, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { FKNODE_SHALL_WE_DEBUG } from "../main.ts";

/**
 * Errors that we know about, or that are caused by the user.
 *
 * @export
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
     * @param {GLOBAL_ERROR_CODES} code Error code. (TODO: add a documentation page for them).
     * @param {?string} [message] An optional error message.
     */
    constructor(code: GLOBAL_ERROR_CODES, message?: string) {
        super(message);
        this.name = "FknError";
        this.code = code;
        switch (this.code) {
            case "Generic__InteractionInvalidCauseNoPathProvided":
                this.hint =
                    `Provide the project's path or name to the project.\n    It can be a file path ("../node-project" OR "C:\\Users\\coolDev\\node-project"),\n    It can be "--self" to use the current working DIR (${Deno.cwd()}).\n    Or it can be a project's name (type the exact name as it is on package.json's "name" field).`;
                break;
            case "Cleaner__InvalidCleanerIntensity":
                this.hint =
                    "Valid intensity levels are 'normal', 'hard', 'hard-only', 'maxim', and 'maxim-only'.\nIf you want to use flags without providing an intensity (e.g. 'clean --verbose'), prepend '-- --' to the command ('clean -- -- -verbose'). Run 'help clean' for more info onto what does each level do.";
                break;
            case "Internal__Projects__CantDetermineEnv":
                this.hint =
                    "Check 'Thrown message' as that might help you. If not present, or it didn't help you, you should open up an issue on GitHub.";
                break;
            case "Generic__NonExistingPath":
                this.hint =
                    "Check for typos - the path you provided wasn't found in the filesystem. If you're sure the path is right, maybe it's a permission issue. If not, open an issue on GitHub so we can fix our tool that fixes NodeJS ;).";
                break;
            case "Internal__NoEnvForConfigPath":
                this.hint = `We tried to find ${
                    ColorString(
                        LOCAL_PLATFORM.SYSTEM === "windows" ? "APPDATA env variable" : "XDG_CONFIG_HOME and HOME env variables",
                        "bold",
                    )
                } but failed, meaning config files cannot be created and the CLI can't work. Something seriously went ${FWORDS.MFLY} wrong. If these aren't the right environment variables for your system's config path (currently using APPDATA on Windows, /home/user/.config on macOS and Linux), please raise an issue on GitHub.`;
                break;
            case "Project__NonFoundProject":
                this.hint = `Check for typos or a wrong name. Given input (either a project's name or a file path) wasn't found.`;
                break;
            case "Env__UnparsableMainFile":
                this.hint =
                    `Your project's main file (package.json, deno.json, go.mod, etc.) is unparsable, or is missing basic fields ("name" and "version" on JS/Cargo, "go" and "module" on Golang).\nCheck for typos or syntax errors. If you're sure the file is correct, please open an issue on GitHub (if everything's right, it might be a bug with our interop layer).`;
                break;
            case "Interop__CannotRunJsLike":
                this.hint =
                    `Non-JS environments do not have an equivalent to "npm run" or "yarn run" tasks, so we can't execute that task. To avoid undesired behavior, we stopped execution. Please remove the setting key from this fknode.yaml that's causing the error.`;
                break;
            case "Generic__MissingRuntime":
                this.hint =
                    "The specified runtime / package manager is not installed on your machine! Please install it for this task to work. If it is installed and you still got this error, please raise an issue on GitHub.";
                break;
            case "Internal__UnparsablePath":
                this.hint = `The given path was not found. Check for typos${
                    LOCAL_PLATFORM.SYSTEM === "windows" ? "." : " or casing mistakes (you're on Linux mate, paths are case-sensitive)."
                }`;
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
     * @returns {Promise<void>}
     */
    public debug(debuggableContent: UnknownString): void {
        // base! because if we're already debugging stuff we assume the CLI got to run
        // meaning that path does exist
        const debugPath = join(LOCAL_PLATFORM.APPDATA, APP_NAME.CLI, `${APP_NAME.CLI}-errors.log`);
        const debuggableError = `\n
---
# BEGIN FknERROR ${this.code} @ ${new Date().toISOString()}
---
- INFO (so you know where you at)
Timestamp      :  ${GetDateNow()},
FknError code  :  ${this.code},
Thrown message :  ${this.message},
Thrown hint    :  ${this.hint},
- STACK (so the dev knows where he at)
${this.stack}
-
below goes the debugged content dump. this could be, for example, an entire project main file, dumped here for reviewal. it could be a sh*t ton of stuff to read
- DEBUGGABLE CONTENT (in most cases, what the CLI command that was executed returned, in case we were able to gather it)
${stripCliColors(debuggableContent ?? "UNKNOWN OUTPUT - No debuggableContent was provided, or it was empty.")}
---
# END   FknERROR ${this.code} # GOOD LUCK FIXING THIS
---\n
        `.trim();
        console.warn(ColorString(`For details about what happened, see last entry @ ${debugPath}`, "orange"));
        Deno.writeTextFileSync(
            debugPath,
            debuggableError,
            {
                append: true,
            },
        );
    }

    /**
     * Handles the error and exits the CLI. Don't use this directly, use {@linkcode GenericErrorHandler} instead.
     */
    public exit(): never {
        this.handleMessage();
        Deno.exit(1);
    }
}

/**
 * Handles an error and quits. Save up a few lines of code by using this in the `catch` block.
 *
 * @export
 * @param {unknown} e The error.
 * @returns {never} _Below any call to this function nothing can happen. It exits the CLI with code 1._
 */
export function GenericErrorHandler(e: unknown): never {
    if (e instanceof FknError) {
        e.exit();
        Deno.exit(1); // (never reached, but without this line typescript doesn't shut up)
    } else if (e instanceof Error) {
        console.error(`${ColorString(FWORDS.FK, "red", "bold")}! Something happened: ${e.message}`);
        Deno.exit(1);
    } else {
        console.error(`${ColorString(FWORDS.FK, "red", "bold")}! Something strange happened: ${e}`);
        Deno.exit(1);
    }
}

/** function to write debug logs, only visible if env variable FKNODE_SHALL_WE_DEBUG is set to `yeah`
 *
 * (constant case instead of pascal case so i can better recognize this)
 */
export function DEBUG_LOG(...a: unknown[]): void {
    if (FKNODE_SHALL_WE_DEBUG) console.debug(" >>> FKNDBG >>>", ...a);
}

/** Throws a `FknError` and writes any debuggable content. */
export function DebugFknErr(code: GLOBAL_ERROR_CODES, message: UnknownString, debuggableContent: UnknownString): never {
    const err = new FknError(code, validate(message) ? message : undefined);
    err.debug(
        debuggableContent,
    );
    throw err;
}
