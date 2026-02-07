import type { VALID_EMOJIS } from "../types/misc.ts";
import { GetUserSettings } from "./config.ts";
import { stringify as stringifyYaml } from "@std/yaml";
import { Commander } from "./cli.ts";
import { LOCAL_PLATFORM } from "../platform.ts";
import { bold, stripAnsiCode } from "@std/fmt/colors";
import { SHOULD_CLEAN_OUTPUT } from "../main.ts";
import process from "node:process";
import DBus from "@particle/dbus-next";

/**
 * Appends an emoji at the beginning of a message.
 *
 * @param {string} message Your message, e.g. `"hi chat"`.
 * @param {VALID_EMOJIS} emoji What emoji you'd like to append, e.g. `"bruh"`.
 * @returns {string} The message with your emoji, e.g. `"😐 hi chat"`.
 */
export function Emojify(message: string, emoji: VALID_EMOJIS): string {
    const emojiString = function (emoji: VALID_EMOJIS): string {
        switch (emoji) {
            case "danger":
                return `🛑`;
            case "prohibited":
                return `⛔`;
            case "wip":
                return `🚧`;
            case "what":
                return `❓`;
            case "bulb":
                return `💡`;
            case "tick":
                return `✅`;
            case "error":
                return `❌`;
            case "warn":
                // return String.fromCodePoint(0x26A0, 0xFE0F); // attempt to fix text rendering
                return `⚠️`;
            case "heads-up":
                return `🚨`;
            case "working":
                return `🔄`;
            case "skip":
                return `⏩`;
            case "moon-face":
                return `🌚`;
            case "bruh":
                return `😐`;
            case "package":
                return `📦`;
            case "trash":
                return `🗑️`;
            case "chart":
                return `📊`;
            case "wink":
                return `😉`;
            case "comrade":
                return `🫡`;
        }
    }(emoji).normalize("NFC");

    return `${emojiString} ${message}`;
}

/**
 * Logs a message to the standard output and saves it to a `.log` file.
 * @author ZakaHaceCosas
 *
 * @param {unknown} message The message to be logged.
 * @param {?VALID_EMOJIS} [emoji] Additionally, add an emoji before the log.
 * @returns {void}
 */
export function LogStuff(
    // deno-lint-ignore explicit-module-boundary-types no-explicit-any
    message: any,
    emoji?: VALID_EMOJIS,
): void {
    if (typeof message !== "string") message = String(message);
    if (SHOULD_CLEAN_OUTPUT || !process.stdout.isTTY || !process.stderr.isTTY) {
        console.log(stripAnsiCode(message));
        return;
    }
    const finalMessage = emoji ? Emojify(message, emoji) : message;
    console.log(finalMessage);
}

/**
 * Asks a question to the user in the form of a [y/N] confirm. It returns false for everything except for an explicit yes.
 *
 * @param {string} question What to ask?
 * @param {?("ask" | "warn" | "heads-up")} style Optional, defines what emoji and color to use.
 * @returns {boolean} User input, or false if none.
 */
export function Interrogate(question: string, style?: "ask" | "warn" | "heads-up"): boolean {
    switch (style) {
        case "warn":
            LogStuff(bold(question), "warn");
            break;
        case "heads-up":
            LogStuff(bold(question), "heads-up");
            break;
        case "ask":
        default:
            LogStuff(question, "what");
            break;
    }
    return confirm("Confirm?");
}

/**
 * Stringify an object or whatever to YAML, using reusable config.
 *
 * @param {unknown} content Whatever to stringify.
 * @returns {string} Stringified YAML.
 */
export function StringifyYaml(content: unknown): string {
    return stringifyYaml(content, {
        indent: 2,
        lineWidth: 120,
        arrayIndent: true,
        skipInvalid: false,
        sortKeys: false,
        useAnchors: false,
        compatMode: true,
        condenseFlow: false,
    });
}

/**
 * Shows a system UI notification.
 *
 * @param {string} title Title of notification.
 * @param {string} msg Main text.
 * @param {number} elapsed Elapsed time, for checking the threshold.
 */
export async function Notification(title: string, msg: string, elapsed?: number): Promise<void> {
    const settings = GetUserSettings();
    if (!settings["notifications"]) return;
    if ((elapsed && settings["notification-threshold"]) && elapsed < settings["notification-threshold-value"]) return;
    // const icon = join(Deno.execPath(), "..", "fkn.png");
    // NOTE: we should show our logo
    // requires to bundle it / add it to the installer script
    // on Windows, to bundle this as a native app
    // on macOS, I don't know
    // on Linux it actually should work (thanks D-Bus) (NOTE: UNTESTED)
    if (LOCAL_PLATFORM.SYSTEM === "msft") {
        Commander(
            "powershell",
            [
                "-Command",
                "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; "
                + "$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); "
                + `$template.GetElementsByTagName("text").Item(0).AppendChild($template.CreateTextNode("${title}")) | Out-Null; `
                + `$template.GetElementsByTagName("text").Item(1).AppendChild($template.CreateTextNode("${msg}")) | Out-Null; `
                + "$notification = [Windows.UI.Notifications.ToastNotification]::new($template); "
                + '$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("FuckingNode"); '
                + "$notifier.Show($notification);",
            ],
        );
    } else if (LOCAL_PLATFORM.SYSTEM === "posix") {
        if (Deno.build.os === "darwin") {
            Commander(
                "osascript",
                [
                    "-e",
                    `display notification "${msg}" with title "${title}"`,
                ],
            );
        } else {
            try {
                const bus = DBus.sessionBus();

                // do not change the order of this thing
                const parameters = {
                    app_name: "FuckingNode",
                    replaces_id: 0,
                    app_icon: "",
                    summary: title,
                    body: msg,
                    actions: [],
                    hints: {},
                    timeout: -1,
                };

                const message = new DBus.Message({
                    destination: "org.freedesktop.Notifications",
                    path: "/org/freedesktop/Notifications",
                    interface: "org.freedesktop.Notifications",
                    member: "Notify",
                    body: [
                        parameters.app_name,
                        parameters.replaces_id,
                        parameters.app_icon,
                        parameters.summary,
                        parameters.body,
                        parameters.actions,
                        parameters.hints,
                        parameters.timeout,
                    ],
                    signature: "susssasa{sv}i",
                });

                // don't await as we don't really care about output, errors will get ignored
                await bus.call(message);
                bus.disconnect();
            } catch {
                // cannot notify
            }
        }
    }
    return;
}
