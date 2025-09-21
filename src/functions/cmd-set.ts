import { normalize, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { DebugFknErr, ErrorHandler, FknError } from "./error.ts";
import type { ProjectEnvironment } from "../types/platform.ts";
import { Commander } from "./cli.ts";
import { GetAppPath } from "./config.ts";
import { ColorString } from "./color.ts";
import { LogStuff, Notification } from "./io.ts";
import {
    type CmdInstruction,
    type CrossPlatformParsedCmdInstruction,
    IsCPCmdInstruction,
    type ParsedCmdInstruction,
} from "../types/config_files.ts";
import type { NonEmptyArray } from "../types/misc.ts";
import { LOCAL_PLATFORM } from "../platform.ts";

type Parameters = { key: "commitCmd" | "releaseCmd" | "buildCmd" | "launchCmd"; env: ProjectEnvironment };

function ValidateCallback(v: CmdInstruction): ParsedCmdInstruction | null {
    const type = v.charAt(0);
    if (!validateAgainst(type, ["$", "~", "="])) throw new FknError("Cfg__InvalidCmdK", `Cmd "${v}" is not properly typed.`);
    const __cmd: string = v.slice(1).trim();
    const _cmd: string = __cmd.startsWith('"') ? __cmd.slice(1, -1) : __cmd;
    const cmd: string[] = _cmd.split(" ").filter(validate);
    if (cmd.length < 1) return null;
    return {
        type,
        cmd: cmd as NonEmptyArray<string>,
    };
}

export function ValidateCmdSet(params: Parameters): (ParsedCmdInstruction | CrossPlatformParsedCmdInstruction)[] | null {
    const rawSet = params.env.settings[params.key];
    if (!rawSet) return null;

    const set = Object.values(rawSet).map((v) => {
        if (typeof v === "object") {
            return {
                msft: ValidateCallback(v.msft),
                posix: ValidateCallback(v.posix),
            };
        } else {
            return ValidateCallback(v);
        }
    }).filter((i) => i !== null);

    return set.length === 0 ? null : set;
}

// we plan to make this support paralleled cmds, so keep it awaited
// deno-lint-ignore require-await
export async function RunCmdSet(params: Parameters): Promise<void> {
    const cmdSet = ValidateCmdSet(params);
    if (!cmdSet) return;

    Deno.chdir(params.env.root);

    LogStuff(
        `Running your ${params.key}!`,
        undefined,
        "bold",
    );

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
            LogStuff(`Command #${cmdIndex} in sequence is platform specific, and not for you.`, "warn");
            continue;
        }
        const cmdString = command.cmd.join(" ");
        const cmdTypeString = command.type === "~" ? "Command" : command.type === "=" ? "File" : "Script";
        LogStuff(
            `Running command ${cmdIndex}/${cmdSet.length} | ${ColorString(cmdString, "half-opaque", "italic")}\n`,
            undefined,
            "bold",
        );
        try {
            if (params.env.commands.script === false && command.type === "$") {
                throw new FknError(
                    "Interop__JSRunUnable",
                    `${params.env.manager} does not support JavaScript-like "run" commands, however you've set ${params.key} in your fknode.yaml to ${cmdString}. Since we don't know what you're doing, this task won't proceed for this project.`,
                );
            }
            const pref = command.type === "<" ? command.cmd[0] : command.type === "$"
                // @ts-expect-error TS type inference isn't working here
                // and idk how to type guard this
                ? params.env.commands.script[0]
                : command.type === "="
                ? params.env.commands.file[0]
                : LOCAL_PLATFORM.SHELL;
            const expr = [
                command.type === "<" ? undefined : command.type === "$"
                    // @ts-expect-error same as above
                    ? params.env.commands.script[1]
                    : command.type === "="
                    ? params.env.commands.file[1]
                    : "-c",
            ];
            if (command.type === "<") expr.push(...command.cmd.slice(1));
            else if (command.type === "~") expr.push(command.cmd.join(" "));
            else expr.push(...command.cmd);
            const out = Commander(
                pref,
                expr,
            );
            if (!out.success) {
                LogStuff(out.stdout ?? "(No stdout/stderr was written by the command)");
                throw out.stdout;
            }
            if (normalize(out.stdout).length === 0) LogStuff("No output received.", undefined, ["half-opaque", "italic"]);
            else LogStuff(out.stdout);
            LogStuff("\nDone!\n", undefined, "bold");
        } catch (error) {
            Notification(
                `Your ${params.key} failed!`,
                `${cmdTypeString}#${cmdIndex} "${cmdString}" failed, so we've halted execution.`,
                30000,
            );
            if (typeof error === "string") {
                DebugFknErr(
                    errorCode,
                    `${cmdTypeString} "${cmdString}" has failed (#${cmdIndex} in '${params.key}' sequence). We've halted execution. Error log, if any, was dumped into ${
                        GetAppPath("ERRORS")
                    }.`,
                    error,
                    false,
                );
            }
            // halt execution, especially to avoid releases
            ErrorHandler(error);
        }
    }

    return;
}
