import { APP_NAME, APP_URLs, I_LIKE_JS, VERSIONING } from "../constants.ts";
import { ColorString } from "../functions/io.ts";
import { LogStuff } from "../functions/io.ts";
import type { tValidColors } from "../types/misc.ts";
import { ASCII } from "../utils/ascii.ts";
import { phrases } from "../utils/phrases.ts";

function getRandomPhrase(): string {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const string = phrases[randomIndex] ?? "Make JS fun again!";
    return ColorString(string, "bright-green", "italic");
}

function getRandomColor(): tValidColors {
    const colors: tValidColors[] = [
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
    ts: ColorString(`TypeScript ${Deno.version.typescript}`, "bright-blue"),
    deno: ColorString(`Deno ${Deno.version.deno}`, "bright-yellow"),
    spain: ColorString("Spain", "red"),
    zakaOne: ColorString("ZakaHaceCosas", "bright-green"),
    zakaTwo: ColorString("ZakaMakesStuff", "italic"),
    gitUrl: ColorString(`https://github.com/ZakaHaceCosas/${APP_NAME.CASED}`, "orange"),
    side: ColorString("Another side project", "italic"),
    date: ColorString("September 28, 2024", "cyan"),
    yt: ColorString("YouTube", "red"),
};

export default async function TheAbouter() {
    await LogStuff(colorizeText(ASCII));
    console.log("-".repeat(35));
    await LogStuff(`${ColorString(VERSIONING.APP, "bright-yellow")} · ${getRandomPhrase()}\n`);
    await LogStuff(
        `Written in ${coolStrings.ts}. Running in ${coolStrings.deno}.\nDeveloped in ${coolStrings.spain} by ${coolStrings.zakaOne} (${coolStrings.zakaTwo} in spanish).\n`,
    );
    await LogStuff(
        `See cool trailer on ${coolStrings.yt} / ${APP_URLs.WEBSITE}follow-us`,
    );
    await LogStuff(
        `${I_LIKE_JS.FK} communism, love freedom. this one's open-source: ${coolStrings.gitUrl}\n`,
    );
    await LogStuff(
        `${coolStrings.side}, born ${coolStrings.date} (a bit earlier but 'Initial commit' in the 1st repo was then)`,
    );
}
