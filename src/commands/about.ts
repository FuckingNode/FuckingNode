import * as DenoJson from "../../deno.json" with { type: "json" };
import { brightOrange, orange } from "../functions/color.ts";
import { LogStuff } from "../functions/io.ts";
import { ASCII } from "../functions/ascii.ts";
import { phrases } from "../functions/phrases.ts";
import { reveal } from "@zakahacecosas/string-utils/cli";
import { bold, brightBlue, brightGreen, brightYellow, cyan, dim, italic, red } from "@std/fmt/colors";
import { shuffle } from "@zakahacecosas/entity-utils";

function colorizeText(text: string): string {
    const lines = text.split("\n");
    return lines.map((line) => {
        const color = shuffle([
            "red",
            "orange",
            "bright-orange",
        ]);
        return color === "red" ? red(line) : color === "orange" ? orange(line) : brightOrange(line);
    }).join("\n");
}

const coolStrings = {
    ver: bold(red(`FuckingNode v${DenoJson.default.version}`)),
    ts: brightBlue(`TypeScript ${Deno.version.typescript}`),
    deno: brightYellow(`Deno ${Deno.version.deno}`),
    spain: red("Spain"),
    zakaOne: brightGreen("ZakaHaceCosas"),
    zakaTwo: italic('"ZakaMakesStuff"'),
    gitUrl: orange("https://github.com/FuckingNode/FuckingNode"),
    side: italic("Another side project"),
    date: cyan("September 28, 2024"),
};

const phrase = shuffle(phrases);
const index = phrases.indexOf(phrase) + 1;
const dashLength = Math.min(phrase.length, 45);

export default async function TheAbouter(): Promise<void> {
    await reveal(colorizeText(ASCII), 2);
    LogStuff("-".repeat(dashLength));
    await reveal(
        brightGreen(italic(phrase)),
        10,
    );
    await reveal(
        dim(italic(`(random quote/tip ${index}/${phrases.length})`)),
        5,
    );
    await reveal(
        `Running ${coolStrings.ver}. Written in ${coolStrings.ts}. Powered by ${coolStrings.deno}.\nDeveloped in ${coolStrings.spain} by ${coolStrings.zakaOne} (${coolStrings.zakaTwo} in spanish).\n`,
        10,
    );
    await reveal(
        `Follow us and join our Discord at ${orange("https://fuckingnode.github.io/follow-us")}`,
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
