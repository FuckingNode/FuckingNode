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
    const GetEmoji = (emoji: SUPPORTED_EMOJIS) => {
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
            default:
                return "";
        }
    };

    const emojiString = GetEmoji(emoji).normalize("NFC");
    return emojiString === "" ? message : `${emojiString} ${message}`;
}

/**
 * Logs a message to the standard output and saves it to a `.log` file.
 * @author ZakaHaceCosas
 *
 * @export
 * @async
 * @param {string} message The message to be logged.
 * @param {?SUPPORTED_EMOJIS} [emoji] Additionally, add an emoji before the log.
 * @param {?(tValidColors | tValidColors[])} [color] Optionally, a color (or more) for the output.
 * @param {?boolean} [question] If true, the log will act as a y/N confirm. Will return true if the user confirms, false otherwise.
 * @param {?boolean} [verbose] If false, stuff will be saved to `.log` file but not written to the `stdout`. Pass here the variable you use to handle verbose logs.
 * @returns {Promise<boolean>} Boolean value if it's a question depending on user input. If it's not a question, to avoid a type error for being `void`, it always returns false.
 */
export async function LogStuff(
    message: string,
    emoji?: SUPPORTED_EMOJIS,
    color?: tValidColors | tValidColors[],
    question?: boolean,
    verbose?: boolean,
): Promise<boolean> {
    try {
        const finalMessage = emoji ? Emojify(message, emoji) : message;

        // deno-lint-ignore no-control-regex
        const regex = /\x1b\[[0-9;]*[a-zA-Z]/g;

        const formattedMessage = `${new Date().toLocaleString()} / ${finalMessage}\n`
            .replace(regex, "")
            .replace("\n\n", "\n"); // (fix for adding \n to messages that already have an \n for whatever reason)

        if (verbose === undefined || verbose === true) {
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

        await Deno.writeTextFile(
            await GetAppPath("LOGS"),
            formattedMessage,
            { append: true },
        );

        if (question) {
            return confirm("Confirm?");
        }

        return false;
    } catch (e) {
        console.error(`Error logging stuff: ${e}`);
        throw e;
    }
}

/**
 * Given a string, e.g. "help", returns an array of all strings that could be considered a `--flag`, so you can test a string against that flag.
 *
 * @export
 * @param {string} flag String you want to test.
 * @param {boolean} min When true, using just the 1st letter of the provided string (e.g. "--h") is also counted as valid.
 * @returns {string[]}
 */
export function ParseFlag(flag: string, min: boolean): string[] {
    const target: string = flag.trim().toLowerCase();

    const response: string[] = [`--${target}`, `-${target}`];

    if (min) response.push(`--${target.charAt(0)}`, `-${target.charAt(0)}`);

    return response;
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
    const internalColorString = (string: string | number, color: tValidColors): string => {
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
    };

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
