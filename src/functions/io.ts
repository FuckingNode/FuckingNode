import type { SUPPORTED_EMOJIS, tValidColors } from "../types/misc.ts";
import { GetAppPath } from "./config.ts";
import { stringify as stringifyYaml } from "@std/yaml";

/**
 * Appends an emoji at the beginning of a message.
 *
 * @export
 * @param {string} message Your message, e.g. `"hi chat"`.
 * @param {SUPPORTED_EMOJIS} emoji What emoji you'd like to append, e.g. `"bruh"`.
 * @returns {string} The message with your emoji, e.g. `"😐 hi chat"`.
 */
export function Emojify(message: string, emoji: SUPPORTED_EMOJIS): string {
    function GetEmoji(emoji: SUPPORTED_EMOJIS) {
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
 * @export
 * @param {string} message The message to be logged.
 * @param {?SUPPORTED_EMOJIS} [emoji] Additionally, add an emoji before the log.
 * @param {?(tValidColors | tValidColors[])} [color] Optionally, a color (or more) for the output.
 * @param {?boolean} [verbose] If false, stuff will be saved to `.log` file but not written to the `stdout`. Pass here the variable you use to handle verbose logs.
 * @returns {void} Boolean value if it's a question depending on user input. If it's not a question, to avoid a type error for being `void`, it always returns false.
 */
export function LogStuff(
    message: string,
    emoji?: SUPPORTED_EMOJIS,
    color?: tValidColors | tValidColors[],
    verbose?: boolean,
): void {
    try {
        const finalMessage = emoji ? Emojify(message, emoji) : message;

        // deno-lint-ignore no-control-regex
        const regex = /\x1b\[[0-9;]*[a-zA-Z]/g;
        const plainMessage = finalMessage.replace(regex, "");

        const formattedMessage = `${new Date().toLocaleString()} / ${plainMessage}\n`
            .replace(/\n{2,}/g, "\n"); // (fix for adding \n to messages that already have an \n for whatever reason)

        if (verbose ?? true) {
            if (color) {
                if (Array.isArray(color)) {
                    console.log(ColorString(finalMessage, ...color));
                } else {
                    console.log(ColorString(finalMessage, color));
                }
            } else {
                console.log(finalMessage);
            }
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
 * @export
 * @param {string} question What to ask?
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
 * Given a string, returns a CLI-colored version of it.
 * @author ZakaHaceCosas
 *
 * @export
 * @param {(string | number)} string String to color.
 * @param {...tValidColors[]} colors The color you wish to give it. Some styles that aren't "colors" are also allowed, e.g. `bold` or `half-opaque`. You can pass many values to add as many colors as you wish.
 * @returns {string} A colorful string.
 */
export function ColorString(string: string | number, ...colors: tValidColors[]): string {
    function internalColorString(string: string | number, color: tValidColors): string {
        const finalString = typeof string === "string" ? string : String(string);
        const RESET = "\x1b[0m";
        let colorCode = RESET;

        switch (color) {
            case "red":
                colorCode = "\x1b[31m";
                break;
            case "white":
                colorCode = "\x1b[37m";
                break;
            case "bold":
                colorCode = "\x1b[1m";
                break;
            case "blue":
                colorCode = "\x1b[34m";
                break;
            case "green":
                colorCode = "\x1b[32m";
                break;
            case "cyan":
                colorCode = "\x1b[36m";
                break;
            case "purple":
                colorCode = "\x1b[35m";
                break;
            case "pink":
                colorCode = "\x1b[38;5;213m"; // (custom color)
                break;
            case "half-opaque":
                colorCode = "\x1b[2m";
                break;
            case "bright-green":
                colorCode = "\x1b[92m";
                break;
            case "bright-blue":
                colorCode = "\x1b[94m";
                break;
            case "bright-yellow":
                colorCode = "\x1b[93m";
                break;
            case "italic":
                colorCode = "\x1b[3m";
                break;
            case "orange":
                colorCode = "\x1b[38;5;202m"; // (custom color)
                break;
            default:
                break;
        }

        return `${colorCode}${finalString}${RESET}`;
    }

    const finalString = typeof string === "string" ? string : String(string);

    if (colors === undefined || colors.length === 0 || !colors[0]) return finalString;

    // initial color
    let result = internalColorString(finalString, colors[0]);

    // recursively apply ColorFunc with the rest of the arguments
    for (let i = 1; i < colors.length; i++) {
        const color = colors[i];
        if (color === undefined || !color) return finalString;
        result = internalColorString(result, color);
    }

    return result;
}

/**
 * Stringify an object or whatever to YAML, using reusable config.
 *
 * @export
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
