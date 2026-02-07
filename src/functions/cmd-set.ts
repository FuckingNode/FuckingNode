import { ctrlc } from "ctrlc-windows";
import { normalize, unquote, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { DebugFknErr, ErrorHandler, FknError } from "./error.ts";
import type { ConservativeProjectEnvironment, ProjectEnvironment } from "../types/platform.ts";
import { Commander } from "./cli.ts";
import { GetAppPath } from "./config.ts";
import { LogStuff, Notification } from "./io.ts";
import {
    type CmdInstruction,
    type CmdSet,
    type CrossPlatformParsedCmdInstruction,
    IsCPCmdInstruction,
    type ParsedCmdInstruction,
} from "../types/config_files.ts";
import type { NonEmptyArray } from "../types/misc.ts";
import { LOCAL_PLATFORM } from "../platform.ts";
import { bold, dim, italic } from "@std/fmt/colors";
import type { TASK_ERROR_CODES } from "../types/errors.ts";
import { stringify as stringifyYaml } from "@std/yaml";

type Parameters = {
    key: "commitCmd" | "releaseCmd" | "buildCmd" | "launchCmd" | "kickstartCmd";
    env: ProjectEnvironment | ConservativeProjectEnvironment;
};
type FormattedCmd = {
    pref: string;
    expr: string[];
    detach: boolean;
    cmdTypeString: "Command" | "File" | "Script" | "Raw exec" | "Detached command" | "Detached file" | "Detached script" | "Detached raw exec";
    cmdString: string;
};

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

export function ValidateCmdSet(
    params: Parameters,
): (ParsedCmdInstruction | CrossPlatformParsedCmdInstruction | ParsedCmdInstruction[])[] | null {
    const rawSet = params.env.settings[params.key];
    if (!rawSet) return null;

    const set = Object.values(rawSet).map((v) => {
        if (!v) return null;
        if (Array.isArray(v)) return v.map((w) => ValidateCallback(w)).filter((i) => i !== null);
        if (typeof v === "object") {
            return {
                msft: v.msft
                    ? (Array.isArray(v.msft)) ? v.msft.map((w) => ValidateCallback(w)).filter((i) => i !== null) : ValidateCallback(v.msft)
                    : null,
                posix: v.posix
                    ? (Array.isArray(v.posix)) ? v.posix.map((w) => ValidateCallback(w)).filter((i) => i !== null) : ValidateCallback(v.posix)
                    : null,
            };
        }
        return ValidateCallback(v);
    }).filter((i) => i !== null);

    return set.length ? set : null;
}

async function ExecCmd(pref: string, expr: string[], detach: boolean): Promise<ReturnType<typeof Commander>> {
    // dirty fix
    pref = pref.replace(";;", "");
    if (detach) {
        try {
            const child = new Deno.Command(pref, { args: expr }).spawn();

            let success = 0;

            const signalHandler = (signal: "SIGTERM" | "SIGINT" | "SIGBREAK") => {
                console.log(italic(`\n(FKN: caught manual exit signal ${signal}.)`));
                const kill = child.kill.bind(child);
                // see https://github.com/denoland/deno/issues/29599
                child.kill = (signal) => {
                    if (signal === "SIGINT") {
                        ctrlc(child.pid);
                    } else {
                        kill(signal);
                    }
                };
                success = 1;
            };

            const onSigint = () => signalHandler("SIGINT");
            const onSigterm = () => signalHandler("SIGTERM");
            const onSigbreak = () => signalHandler("SIGBREAK");

            Deno.addSignalListener("SIGINT", onSigint);
            if (LOCAL_PLATFORM.SYSTEM === "posix") Deno.addSignalListener("SIGTERM", onSigterm);
            if (LOCAL_PLATFORM.SYSTEM === "msft") {
                Deno.addSignalListener("SIGBREAK", onSigbreak);
                // ? deno doesn't support SIGUP (types at least indicate that)
                // however stack trace goes like
                // TypeError: Windows only supports ctrl-c (SIGINT), ctrl-break (SIGBREAK), and ctrl-close (SIGUP), but got SIGTERM
                // weird...
                // Deno.addSignalListener("SIGUP", onSigbreak);
            }

            let out;
            try {
                out = await child.output();
            } catch (_e) {
                console.error(italic("(FKN: child process errored)"));
                out = {
                    success: false,
                    stdout: "",
                };
            } finally {
                Deno.removeSignalListener("SIGINT", onSigint);
                if (LOCAL_PLATFORM.SYSTEM === "posix") Deno.removeSignalListener("SIGTERM", onSigterm);
                if (LOCAL_PLATFORM.SYSTEM === "msft") Deno.removeSignalListener("SIGBREAK", onSigbreak);
            }

            return {
                stdout: "",
                success: success === 1 ? true : out.success,
            };
        } catch (e) {
            if (e instanceof Deno.errors.NotFound) {
                throw new FknError(
                    "Os__NoEntity",
                    `Detached Cmd tried to execute '${pref} ${expr.join(" ")}', but your OS wasn't able find it.`,
                );
            }
            throw e;
        }
    } else {
        return Commander(
            pref,
            expr,
        );
    }
}

function CmdFormatter(command: ParsedCmdInstruction, env: ProjectEnvironment | ConservativeProjectEnvironment): FormattedCmd {
    const cmdString = command.cmd.join(" ");
    const detach = cmdString.slice(0, 2) === ";;";
    const cmdTypeString = command.type === "~"
        ? (detach ? "Detached command" : "Command")
        : command.type === "="
        ? (detach ? "Detached file" : "File")
        : command.type === "$"
        ? (detach ? "Detached script" : "Script")
        : (detach ? "Detached raw exec" : "Raw exec");
    const pref = command.type === "<" ? command.cmd[0] : command.type === "$"
        // @ts-expect-error: TS type inference can't tell that this IS validated above
        ? env.commands.script[0]
        : command.type === "="
        // @ts-expect-error: same here
        ? env.commands.file[0]
        : LOCAL_PLATFORM.SHELL;
    const expr = [
        command.type === "<" ? undefined : command.type === "$"
            // @ts-expect-error: same as above
            ? env.commands.script[1]
            : command.type === "="
            // @ts-expect-error: yet again
            ? env.commands.file[1]
            : "-c",
    ];
    const cmd = detach ? [command.cmd[0].replace(";;", ""), ...(command.cmd.slice(1))] : command.cmd;
    if (command.type === "<") expr.push(...cmd.slice(1));
    else if (command.type === "~") expr.push(cmd.join(" "));
    else expr.push(...cmd);
    return {
        pref,
        expr: expr.filter(validate),
        detach,
        cmdTypeString,
        cmdString: command.cmd[0].replace(";;", ""),
    };
}

async function CmdRunner(
    cmd: ParsedCmdInstruction,
    env: ConservativeProjectEnvironment | ProjectEnvironment,
    cmdIndex: number,
    key: Parameters["key"],
    errorCode: TASK_ERROR_CODES,
    format: FormattedCmd,
): Promise<void> {
    const command = IsCPCmdInstruction(cmd) ? cmd[LOCAL_PLATFORM.SYSTEM] : cmd;
    if (!command) {
        // non-CP instructions do get filtered for null values, so we can be sure
        // this is only null when a CPCmdInstruction isn't defined for us
        LogStuff(`CmdSet #${cmdIndex} in sequence is platform specific, and not for you.\n`, "warn");
        return;
    }
    if (Array.isArray(command)) {
        return;
    }
    const { cmdString, pref, expr, detach, cmdTypeString } = format;
    try {
        if (env.commands.script === false && command.type === "$") {
            throw new FknError(
                "Interop__JSRunUnable",
                `${env.manager} does not support JavaScript-like "run" commands, however you've set ${key} in your fknode.yaml to ${cmdString}. Since we don't know what you're doing, this task won't proceed for this project.`,
            );
        }
        if (env.commands.file === false && command.type === "=") {
            throw new FknError(
                "Interop__FileRunUnable",
                `${env.manager} does not support running code files, however you've set ${key} in your fknode.yaml to ${cmdString}. Since we don't know what you're doing, this task won't proceed for this project.`,
            );
        }
        const _out = await ExecCmd(pref, expr, detach);
        const out = {
            success: _out.success,
            stdout: detach ? italic("(FKN: detached execution terminated.)") : _out.stdout,
        };
        if (!out.success) {
            LogStuff(out.stdout ?? "(No stdout/stderr was written by the command)");
            throw out.stdout;
        }
        if (normalize(out.stdout).length === 0) LogStuff(dim(italic("No output received.")));
        else LogStuff(out.stdout);
        LogStuff(`\n${bold("Done")} with ${cmdString}!\n`);
        return;
    } catch (e) {
        await Notification(
            `Your ${key} failed!`,
            `${cmdTypeString}#${cmdIndex} "${cmdString}" failed, so we've halted execution.`,
            30000,
        );
        if (typeof e === "string") {
            DebugFknErr(
                errorCode,
                `${cmdTypeString} "${cmdString}" has failed (#${cmdIndex} in '${key}' sequence). We've halted execution. Error log, if any, was dumped into ${
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
        : params.key === "releaseCmd"
        ? "Task__Release"
        : "Task__Kickstart";

    for (const _cmd of cmdSet) {
        const command = IsCPCmdInstruction(_cmd) ? _cmd[LOCAL_PLATFORM.SYSTEM] : _cmd;
        const cmdIndex = cmdSet.indexOf(_cmd) + 1;
        if (!command) {
            // non-CP instructions do get filtered for null values, so we can be sure
            // this is only null when a CPCmdInstruction isn't defined for us
            LogStuff(`Command #${cmdIndex} in sequence is platform specific, and not for you.\n`, "warn");
            continue;
        }
        if (Array.isArray(command)) {
            LogStuff(
                bold(
                    `Running parallelized Cmd ${cmdIndex}/${cmdSet.length} | Includes ${command.length} parallel statements\n`,
                ),
            );
            await Promise.all(command.map((cmd) => CmdRunner(cmd, params.env, cmdIndex, params.key, errorCode, CmdFormatter(cmd, params.env))));
            LogStuff(`${bold("Done with the whole Cmd!")}\n`);
        } else {
            const fmt = CmdFormatter(command, params.env);
            LogStuff(
                bold(
                    `Running Cmd ${cmdIndex}/${cmdSet.length} | ${fmt.cmdTypeString} / ${italic(dim(fmt.cmdString))}\n`,
                ),
            );
            await CmdRunner(command, params.env, cmdIndex, params.key, errorCode, fmt);
        }
    }

    return;
}

export function HumanizeCmd(cmd: CmdSet): string {
    return stringifyYaml(cmd)
        .split("\n")
        .map((s) => s.replace("- ", "").trim())
        .filter((s) => LOCAL_PLATFORM.SYSTEM === "msft" ? !s.startsWith("posix: ") : !s.startsWith("msft: "))
        .map((s) =>
            s.replaceAll("posix: ", "").replaceAll("msft: ", "")
                .replace(
                    "~",
                    `${LOCAL_PLATFORM.SHELL} -c `.padEnd("(execute code file):      ".length, " "),
                )
                .replace(
                    "=",
                    "(execute code file):      ",
                )
                .replace(
                    "<",
                    "(execute PROGRAM/BINARY): ",
                )
                .replace("$", "(run project script):     ")
        )
        .join("\n");
}
