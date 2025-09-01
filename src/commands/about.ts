import * as DenoJson from "../../deno.json" with { type: "json" };
import { APP_URLs } from "../constants.ts";
import { ColorString } from "../functions/color.ts";
import { LogStuff } from "../functions/io.ts";
import type { VALID_COLORS } from "../types/misc.ts";
import { ASCII } from "../functions/ascii.ts";
import { phrases } from "../functions/phrases.ts";
import { APP_NAME } from "../constants/name.ts";
import { reveal } from "@zakahacecosas/string-utils";

function getRandomPhrase(): string {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const string = phrases[randomIndex] ?? "Make JS fun again!";
    return string;
}

function getRandomColor(): VALID_COLORS {
    const colors: VALID_COLORS[] = [
        "bright-blue",
        "cyan",
        "blue",
    ];

    const randomIndex = Math.floor(Math.random() * colors.length);
    return (colors[randomIndex]) ?? "white";
}

function colorizeText(text: string): string {
    const lines = text.split("\n");
    return lines.map((line) => {
        return ColorString(line, getRandomColor());
    }).join("\n");
}

const coolStrings = {
    ver: ColorString(`${APP_NAME.CASED} ${DenoJson.default.version}`, "bold", "red"),
    ts: ColorString(`TypeScript ${Deno.version.typescript}`, "bright-blue"),
    deno: ColorString(`Deno ${Deno.version.deno}`, "bright-yellow"),
    spain: ColorString("Spain", "red"),
    zakaOne: ColorString("ZakaHaceCosas", "bright-green"),
    zakaTwo: ColorString('"ZakaMakesStuff"', "italic"),
    gitUrl: ColorString(`https://github.com/${APP_NAME.CASED}/${APP_NAME.CASED}`, "orange"),
    side: ColorString("Another side project", "italic"),
    date: ColorString("September 28, 2024", "cyan"),
};

const phrase = getRandomPhrase();
const index = phrases.indexOf(phrase) + 1;
const dashLength = Math.min(phrase.length, 45);

export default async function TheAbouter(): Promise<void> {
    await reveal(colorizeText(ASCII), 2);
    LogStuff("-".repeat(dashLength));
    await reveal(
        ColorString(phrase, "bright-green", "italic"),
        10,
    );
    await reveal(
        ColorString(`(random quote/tip ${index}/${phrases.length})`, "half-opaque", "italic"),
        5,
    );
    await reveal(
        `Running ${coolStrings.ver}. Written in ${coolStrings.ts}. Powered by ${coolStrings.deno}.\nDeveloped in ${coolStrings.spain} by ${coolStrings.zakaOne} (${coolStrings.zakaTwo} in spanish).\n`,
        10,
    );
    await reveal(
        `Follow us and join our Discord at ${ColorString(`${APP_URLs.WEBSITE}follow-us`, "orange")}`,
        2,
    );
    await reveal(
        `We all love freedom, right? This is open-source: ${coolStrings.gitUrl}\n`,
        2,
    );
    await reveal(
        `${coolStrings.side}, born ${coolStrings.date} (a bit earlier but 'Initial commit' in the 1st repo was then)`,
        3,
    );
}
