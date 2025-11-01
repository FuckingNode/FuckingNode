import { normalize, unquote, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { DebugFknErr, ErrorHandler, FknError } from "./error.ts";
import type { ConservativeProjectEnvironment, ProjectEnvironment } from "../types/platform.ts";
import { Commander } from "./cli.ts";
import { GetAppPath } from "./config.ts";
import { LogStuff, Notification } from "./io.ts";
import {
    type CmdInstruction,
    type CrossPlatformParsedCmdInstruction,
    IsCPCmdInstruction,
    type ParsedCmdInstruction,
} from "../types/config_files.ts";
import type { NonEmptyArray } from "../types/misc.ts";
import { LOCAL_PLATFORM } from "../platform.ts";
import { bold, brightYellow, dim, italic } from "@std/fmt/colors";

type Parameters = { key: "commitCmd" | "releaseCmd" | "buildCmd" | "launchCmd"; env: ProjectEnvironment | ConservativeProjectEnvironment };

function ValidateCallback(v: CmdInstruction): ParsedCmdInstruction | null {
    if (!v) return null;
    const type = v.charAt(0);
    if (!validateAgainst(type, ["$", "~", "=", "<"])) throw new FknError("Cfg__FknYaml__InvalidCmdK", `Cmd "${v}" is not properly typed.`);
    const cmdArray = unquote(v.slice(1))
        .split(" ")
        .filter(validate);
    if (!cmdArray.length) return null;
    return {
        type,
        cmd: cmdArray as NonEmptyArray<string>,
    };
}

export function ValidateCmdSet(params: Parameters): (ParsedCmdInstruction | CrossPlatformParsedCmdInstruction)[] | null {
    const rawSet = params.env.settings[params.key];
    if (!rawSet) return null;

    const set = Object.values(rawSet).map((v) => {
        if (!v) return null;
        if (typeof v === "object") {
            return {
                msft: v.msft ? ValidateCallback(v.msft) : null,
                posix: v.posix ? ValidateCallback(v.posix) : null,
            };
        }
        return ValidateCallback(v);
    }).filter((i) => i !== null);

    return set.length ? set : null;
}

async function ExecCmd(pref: string, expr: string[], detach: boolean): Promise<ReturnType<typeof Commander>> {
    if (detach) {
        const child = new Deno.Command(pref, { args: expr }).spawn();

        let success = 0;

        const signalHandler = (signal: "SIGTERM" | "SIGINT" | "SIGBREAK") => {
            console.log(italic(`\n(FKN: caught manual exit signal ${signal}.)`));
            child.kill(signal);
            success = 1;
        };

        const onSigint = () => signalHandler("SIGINT");
        const onSigterm = () => signalHandler("SIGTERM");
        const onSigbreak = () => signalHandler("SIGBREAK");

        Deno.addSignalListener("SIGINT", onSigint);
        Deno.addSignalListener("SIGTERM", onSigterm);
        if (LOCAL_PLATFORM.SYSTEM === "msft") {
            Deno.addSignalListener("SIGBREAK", onSigbreak);
        }

        let out;
        try {
            out = await child.output();
        } catch (_e) {
            // console.error(italic(`(FKN: child process error: ${e})`));
            out = {
                success: false,
                stdout: "",
            };
        } finally {
            Deno.removeSignalListener("SIGINT", onSigint);
            Deno.removeSignalListener("SIGTERM", onSigterm);
            if (LOCAL_PLATFORM.SYSTEM === "msft") {
                Deno.removeSignalListener("SIGBREAK", onSigbreak);
            }
        }

        return {
            stdout: "",
            success: success === 1 ? true : out.success,
        };
    } else {
        return Commander(
            pref,
            expr,
        );
    }
}

// TODO(@ZakaHaceCosas): we plan to make this support paralleled cmds too
export async function RunCmdSet(params: Parameters): Promise<void> {
    const cmdSet = ValidateCmdSet(params);
    if (!cmdSet) return;

    Deno.chdir(params.env.root);

    LogStuff(bold(`Running your ${params.key}!`));

    const errorCode = params.key === "buildCmd"
        ? "Task__Build"
        : params.key === "commitCmd"
        ? "Task__Commit"
        : params.key === "launchCmd"
        ? "Task__Launch"
        : "Task__Release";

    for (const _cmd of cmdSet) {
        const command = IsCPCmdInstruction(_cmd) ? _cmd[LOCAL_PLATFORM.SYSTEM] : _cmd;
        const cmdIndex = cmdSet.indexOf(_cmd) + 1;
        if (!command) {
            // non-CP instructions do get filtered for null values, so we can be sure
            // this is only null when a CPCmdInstruction isn't defined for us
            LogStuff(`Command #${cmdIndex} in sequence is platform specific, and not for you.\n`, "warn");
            continue;
        }
        const cmdString = command.cmd.join(" ");
        const detach = cmdString.slice(0, 2) === ";;";
        const cmdTypeString = command.type === "~" ? "Command" : command.type === "=" ? "File" : "Script";
        LogStuff(
            bold(
                `Running Cmd ${cmdIndex}/${cmdSet.length} | ${detach ? "Detached " + cmdTypeString.toLowerCase() : cmdTypeString} / ${
                    italic(dim(cmdString))
                }\n${detach ? bold(brightYellow("Heads up: detached cmds are a work-in-progress and might fail")) + "\n" : ""}`,
            ),
        );
        try {
            if (params.env.commands.script === false && command.type === "$") {
                throw new FknError(
                    "Interop__JSRunUnable",
                    `${params.env.manager} does not support JavaScript-like "run" commands, however you've set ${params.key} in your fknode.yaml to ${cmdString}. Since we don't know what you're doing, this task won't proceed for this project.`,
                );
            }
            if (params.env.commands.file === false && command.type === "=") {
                throw new FknError(
                    "Interop__FileRunUnable",
                    `${params.env.manager} does not support running code files, however you've set ${params.key} in your fknode.yaml to ${cmdString}. Since we don't know what you're doing, this task won't proceed for this project.`,
                );
            }
            const pref = command.type === "<" ? command.cmd[0] : command.type === "$"
                // @ts-expect-error: TS type inference can't tell that this IS validated above
                ? params.env.commands.script[0]
                : command.type === "="
                // @ts-expect-error: same here
                ? params.env.commands.file[0]
                : LOCAL_PLATFORM.SHELL;
            const expr = [
                command.type === "<" ? undefined : command.type === "$"
                    // @ts-expect-error: same as above
                    ? params.env.commands.script[1]
                    : command.type === "="
                    // @ts-expect-error: yet again
                    ? params.env.commands.file[1]
                    : "-c",
            ];
            const cmd = detach ? [command.cmd[0].replace(";;", ""), ...(command.cmd.slice(1))] : command.cmd;
            if (command.type === "<") expr.push(...cmd.slice(1));
            else if (command.type === "~") expr.push(cmd.join(" "));
            else expr.push(...cmd);
            const _out = await ExecCmd(pref, expr, detach);
            const out = {
                success: _out.success,
                stdout: detach ? italic("(FKN: detached execution terminated.)") : _out.stdout as string,
            };
            if (!out.success) {
                LogStuff(out.stdout ?? "(No stdout/stderr was written by the command)");
                throw out.stdout;
            }
            if (normalize(out.stdout).length === 0) LogStuff(dim(italic("No output received.")));
            else LogStuff(out.stdout);
            LogStuff(bold("\nDone!\n"));
        } catch (e) {
            Notification(
                `Your ${params.key} failed!`,
                `${cmdTypeString}#${cmdIndex} "${cmdString}" failed, so we've halted execution.`,
                30000,
            );
            if (typeof e === "string") {
                DebugFknErr(
                    errorCode,
                    `${cmdTypeString} "${cmdString}" has failed (#${cmdIndex} in '${params.key}' sequence). We've halted execution. Error log, if any, was dumped into ${
                        GetAppPath("ERRORS")
                    }.`,
                    e,
                    false,
                );
            }
            // halt execution, especially to avoid releases
            ErrorHandler(e);
        }
    }

    return;
}
