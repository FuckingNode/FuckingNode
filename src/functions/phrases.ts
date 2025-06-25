/**
 * This file contains random phrases for the about page. You're not supposed to edit it, however funny additions are always welcome :).
 * Some of these are the kind of jokes only some people (mostly friends of mine) understand. Others are just really random (but real) phrases. But hey, any funny addition is, as I said, welcome.
 *
 * (bruh i spent my time writing all of this instead of studying)
 */

import { APP_NAME, FWORDS } from "../constants.ts";
import { GetAppPath } from "./config.ts";

const internalJokes = [
    "Dima definitely approves", // indeed he does
    "Sokora Seal of Approval", // and i'm proud of it
    "(not) powered by Vuelto <https://vuelto.pp.ua/>", // rewrite to Vuelto coming 2026
    "Proudly running on anything but a FireBlitz server", // those who know :skull:
    "not made in germany", // those who know :skull:
    `(it's named this way because Node is ${FWORDS.FKN} annoying, not because I ${FWORDS.FK}ed it)`, // (someone really asked me)
    "Proudly made by ZakaHaceCosas (translates to 'ZakaMakesStuff')", // YOO
    "Proudly developed in Spain (the S is silent)", // elections here don't work, i swear
    "i should be studying chemistry and i'm writing random phrases for this thing", // real btw
    "weeb > furry", // indeed
    "haccing skill #3: download a CLI tool", // the 3rd one in a series
];

const internalQuotes = [
    "'You are supposed to cool it, not heat it up' - Herpes of Balkan", // i mean, he's right
    "'THE DAY OF Ws' - Serge", // that was a good day
    "'lmfao' - Serge", // such a quote is worth a book
    "'am jok' - Serge", // hes jok
    "'please don't kil' - Serge",
    "'shork thinking its smol fish crushes goose!!!!' - Serge",
    "'it's sokover' - Serge", // from the creators of it's joever (not)
    "'Dookie in da pookie' - Dima",
    "'learn as if you will live forever, live like you will die tomorrow' - EpicSprout", // poetic
    "'widnwos sucsk' - Serge", // he got a point, kind of
    "'We either have one ball, or we have two'", // he got a point there, too
];

const coolJokes = [
    "that's what she said",
    "stay safe",
    "i don't get paid for writing phrases... here's another one",
    `This PC has been running for ${Math.ceil(Deno.osUptime() / 60)} minutes.`,
    "Freedom for Venezuela!",
    "Freedom for Ukraine!", // (don't misunderstand this sentence being inside a jokes array)
];

const devJokes = [
    "git commit -m 'rewrite to Lua'",
    "git commit -m 'send help'",
    "git commit -m 'fix previous fix again'",
    "git commit -m 'change CRLF to LF, again'",
    "git commit -m 'Create .env'\ngit commit -m 'Delete .env'\ngit commit -m 'Update .gitignore'",
    "curl parrot.live",
    "midudev would approve",
    "#RewriteToBrainF\*ck",
    "No AI was used to generate these random phrases.\n\nI hope these random phrases look good enough. Happy coding!", // it's a joke lmao, i did not use AI for these
    "not powered by OpenAI",
    "an ecosystem where 'npm install is-odd' is a thing, is a broken ecosystem",
    "Proudly made from mom's basement",
    "try { study() } catch { study_harder() } finally { workAt('aliExpress') }",
    "REACT_DO_NOT_USE_THIS_OR_YOU_WILL_BE_FIRED",
    "Proudly running from a CLI capable of running Doom",
    "rm -rf .git/",
    "rm -rf node_modules/",
    "runs faster than a Roblox server on a saturday",
    "ALPHA -> BETA -> RELEASE CANDIDATE -> STAY LIKE THAT FOR AGES -> STABLE -> IT BREAKS -> repeat()",
];

/** (used to be secretHints...) */
export const HINTS = [
    `F\*ckingProTip (01): try setting the FKNODE_SHALL_WE_DEBUG environment variable to "yeah" in your machine`,
    "F\*ckingProTip (02): run 'fkn sokoballs'",
    "F\*ckingProTip (03): cleanup supports a '--verbose' flag that shows CLI output in real time from tasks that are being automated",
    `F\*ckingProTip (04): critical errors get logged to ${GetAppPath("ERRORS")} in a fairly readable format`,
    `F\*ckingProTip (05): run 'fkn export <project>', it'll show you what we REALLY understand about your project (and care enough about)`,
    `F\*ckingProTip (06): 'fkn surrender' has aliases that do the exact same thing but more properly representing why you chose to surrender on a project, for example 'fkn im-done-with <project>', or 'fkn i-give-up <project>'`,
    `F\*ckingProTip (07): if your drive is nearly full and you desperately need storage, run 'fkn storage-emergency'.\nthank me later. note: desperate situations require desperate measures, be advised.`,
    `F\*ckingProTip (08): you can kickstart a project with a git prefix (or shorthand or alias or whatever).\nfor example, kickstart gh:cool-guy/cool-repo maps to https://github.com/cool-guy/cool-repo.git - so you type less\nthere's 10 aliases, run 'compat kickstart' to see them all`,
    `F\*ckingProTip (09): all config files live at ${GetAppPath("BASE")}. touch anything there if you want.`,
    `F\*ckingProTip (10): if you touch and break any config file (or it breaks because yes), run 'fkn something-fucked-up'. it'll reset all config files except for your project list.`,
    `F\*ckingProTip (11): here's an actually good pro tip: use DenoJS, or BunJS, or learn another language - just. avoid. Node.`,
];

const appRelatedJokes = [
    "funnily enough, this could be an(other) npm package",
    "using javascript to fix javascript (again)",
    "made in Deno, made for Node, made eating a Bun",
    "don't tell mommy i said the f-word",
    `question: how do you end up downloading a CLI tool literally called '${APP_NAME.STYLED}'?`,
    "fun fact: this started as a .ps1 script i used to automate cleaning of my own node_modules",
    "fun fact: it's not made in node",
    "(we need a better logo)",
    "Why Go and Rust? No clue",
    "yes we're gonna keep our branding JS-related even tho we support Rust",
];

const brandingJokes = [
    "Make JavaScript great again!",
    "Make JavaScript great again! (not like it ever was)",
    `${APP_NAME.CASED}/Deno/Bun/Golang/Rust, actually`,
    `${FWORDS.FKN}JSRuntimesInGeneral, actually`,
    `${APP_NAME.CASED}? More like ${FWORDS.FKN}Cool!`,
];

const quotes = [
    "'Anything that can be written in JavaScript, will be eventually written in JavaScript.' - Jeff Atwood",
    "'It just works' - Steve Jobs",
    "'Good programmers know what to write. Great ones know what to rewrite and reuse.' - Eric S. Raymond",
    "'Software and cathedrals are much the same; first we build them, then we pray' - (anonymous)",
    "'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.' - Martin Fowler",
    "'Make it work, make it right, make it fast.' - Kent Beck",
    "'When in doubt, use brute force.' - Ken Thompson",
    "'If you can’t write it down in English, you can't code it.' - Peter Halpern",
    "'Get your data structures correct first, and the rest of the program will write itself.' - David Jones",
    "'Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.' - Rick Osborne",
    "'Don't comment bad code. Rewrite it.' - Brian Kernighan", // if only i wasn't that lazy...
    "'If the code and the comments disagree, then both are probably wrong.' - Norm Schryer",
    "'When explaining a command, or language feature, or hardware widget, first describe the problem it is designed to solve.' - David Martin",
    "'Code is like humor. When you have to explain it, it's bad.' - Cory House",
];

export const phrases = [
    ...devJokes,
    ...coolJokes,
    ...internalJokes,
    ...brandingJokes,
    ...appRelatedJokes,
    ...quotes,
    ...internalQuotes,
    ...HINTS,
];
