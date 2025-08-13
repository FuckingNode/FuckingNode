import { blue, bold, brightBlue, brightGreen, brightYellow, cyan, dim, green, italic, magenta, red, rgb8, white } from "@std/fmt/colors";
import { VALID_COLORS } from "../types/misc.ts";

/**
 * Given a string, returns a CLI-colored version of it.
 *
 * @param {(string | number)} string String to color.
 * @param {...VALID_COLORS[]} colors The color you wish to give it. Some styles that aren't "colors" are also allowed, e.g. `bold` or `half-opaque`. You can pass many values to add as many colors as you wish.
 * @returns {string} A colorful string.
 */
export function ColorString(string: string | number, ...colors: VALID_COLORS[]): string {
    function internalColorString(string: string | number, color: VALID_COLORS): string {
        const finalString = typeof string === "string" ? string : String(string);

        switch (color) {
            case "red":
                return red(finalString);
            case "white":
                return white(finalString);
            case "bold":
                return bold(finalString);
            case "blue":
                return blue(finalString);
            case "green":
                return green(finalString);
            case "cyan":
                return cyan(finalString);
            case "purple":
                return magenta(finalString);
            case "pink":
                return rgb8(finalString, 213);
            case "half-opaque":
                return dim(finalString);
            case "bright-green":
                return brightGreen(finalString);
            case "bright-blue":
                return brightBlue(finalString);
            case "bright-yellow":
                return brightYellow(finalString);
            case "italic":
                return italic(finalString);
            case "orange":
                return rgb8(finalString, 202);
        }
    }

    let finalString = typeof string === "string" ? string : String(string);

    if (colors === undefined || colors.length === 0 || !colors[0]) return finalString;

    // recursively color the string
    colors.forEach((color) => finalString = internalColorString(finalString, color));

    return finalString;
}
