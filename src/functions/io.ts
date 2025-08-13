import type { VALID_COLORS, VALID_EMOJIS } from "../types/misc.ts";
import { GetAppPath } from "./config.ts";
import { stringify as stringifyYaml } from "@std/yaml";
import { GetDateNow } from "./date.ts";
import { Commander } from "./cli.ts";
import { APP_NAME } from "../constants/name.ts";
import { LOCAL_PLATFORM } from "../constants/platform.ts";
import { ColorString } from "./color.ts";

/**
 * Appends an emoji at the beginning of a message.
 *
 * @param {string} message Your message, e.g. `"hi chat"`.
 * @param {VALID_EMOJIS} emoji What emoji you'd like to append, e.g. `"bruh"`.
 * @returns {string} The message with your emoji, e.g. `"😐 hi chat"`.
 */
export function Emojify(message: string, emoji: VALID_EMOJIS): string {
    function GetEmoji(emoji: VALID_EMOJIS) {
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
            case "tick-clear":
                return `✔`;
            case "error":
                return `❌`;
            case "warn":
                // return String.fromCodePoint(0x26A0, 0xFE0F); // attempt to fix text rendering
                return `⚠️`;
            case "heads-up":
                return `🚨`;
            case "working":
                return `🔄`;
            case "moon-face":
                return `🌚`;
            case "bruh":
                return `😐`;
            case "package":
                return `📦`;
            case "trash":
                return `🗑`;
            case "chart":
                return `📊`;
            case "wink":
                return `😉`;
            case "comrade":
                return `🫡`;
            default:
                return "";
        }
    }

    const emojiString = GetEmoji(emoji).normalize("NFC");
    return emojiString === "" ? message : `${emojiString} ${message}`;
}

/**
 * Logs a message to the standard output and saves it to a `.log` file.
 * @author ZakaHaceCosas
 *
 * @param {any} message The message to be logged.
 * @param {?VALID_EMOJIS} [emoji] Additionally, add an emoji before the log.
 * @param {?(VALID_COLORS | VALID_COLORS[])} [color] Optionally, a color (or more) for the output.
 * @returns {void}
 */
export function LogStuff(
    // deno-lint-ignore no-explicit-any
    message: any,
    emoji?: VALID_EMOJIS,
    color?: VALID_COLORS | VALID_COLORS[],
): void {
    try {
        const finalMessage = emoji ? Emojify(message, emoji) : message;

        // deno-lint-ignore no-control-regex
        const regex = /\x1b\[[0-9;]*[a-zA-Z]/g;
        const plainMessage = finalMessage.replace(regex, "");

        const formattedMessage = `${GetDateNow()} / ${plainMessage}\n`
            .replace(/\n{2,}/g, "\n"); // (fix for adding \n to messages that already have an \n for whatever reason)

        if (color) {
            if (Array.isArray(color)) {
                console.log(ColorString(finalMessage, ...color));
            } else {
                console.log(ColorString(finalMessage, color));
            }
        } else {
            console.log(finalMessage);
        }

        Deno.writeTextFileSync(
            GetAppPath("LOGS"),
            formattedMessage,
            { append: true },
        );
    } catch (e) {
        throw `Error logging stuff: ${e}`;
    }
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
            LogStuff(question, "warn", "bold");
            break;
        case "heads-up":
            LogStuff(question, "heads-up", "bold");
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
 */
export function Notification(title: string, msg: string) {
    // NOTE: we should show our logo
    // requires to bundle it / add it to the installer script
    // on Windows, to write XML inside of the damn script :sob:
    // on macOS and Linux, idk what does it require, we'll find out
    if (LOCAL_PLATFORM.SYSTEM === "windows") {
        Commander(
            "powershell",
            [
                "-Command",
                `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; ` +
                `$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); ` +
                `$template.GetElementsByTagName("text").Item(0).AppendChild($template.CreateTextNode("${title}")) > $null; ` +
                `$template.GetElementsByTagName("text").Item(1).AppendChild($template.CreateTextNode("${msg}")) > $null; ` +
                `$notification = [Windows.UI.Notifications.ToastNotification]::new($template); ` +
                `$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("${APP_NAME.CASED}"); ` +
                `$notifier.Show($notification);`,
            ],
        );
    } else if (LOCAL_PLATFORM.SYSTEM === "chad") {
        if (Deno.build.os === "darwin") {
            Commander(
                "osascript",
                [
                    "-e",
                    `display notification "${msg}" with title "${title}"`,
                ],
            );
        } else {
            const out = Commander(
                "command",
                [
                    "-v",
                    "notify-send",
                ],
            );
            // cannot notify
            if (!out.success) return;
            Commander(
                "notify-send",
                [
                    title,
                    msg,
                ],
            );
        }
    }
}
