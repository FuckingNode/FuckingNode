/**
 * This file contains random phrases for the about page. You're not supposed to edit it, however funny additions are always welcome :).
 * Some of these are the kind of jokes only some people (mostly friends of mine) understand. Others are just really random (but real) phrases. But hey, any funny addition is, as I said, welcome.
 *
 * (bruh i spent my time writing all of this instead of studying)
 */

import { APP_NAME, I_LIKE_JS } from "../constants.ts";
import { GetAppPath } from "./config.ts";

const internalJokes = [
    "Dima definitely approves", // indeed he does
    "Sokora Seal of Approval", // and i'm proud of it
    "verified, just as sokora", // indeed
    "(not) powered by Vuelto <https://vuelto.pp.ua/>", // rewrite to Vuelto coming 2026
    "Proudly running on anything but a FireBlitz server", // those who know :skull:
    "not made in germany", // those who know :skull:
    `(it's named this way because Node is ${I_LIKE_JS.FKN} annoying, not because I ${I_LIKE_JS.FK}ed it)`, // (someone really told me the 2nd one)
    "Proudly made by ZakaHaceCosas (translates to 'ZakaMakesStuff')", // YOO
    "Proudly developed in Spain (the S is silent)", // elections here don't work, i swear
    "i should be studying chemistry and i'm writing random phrases for this thing", // real btw
    "weeb > furry", // indeed
    "i'm grounded", // this is real btw
    "haccing skill #3: download a CLI tool", // the 3rd one in a series
    "brick",
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
    "'learn as if you will live forever, live like you will die tomorrow' - EpicSprout",
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
export const hints = [
    `F\*ckingProTip: try running with "FKNDBG" at the end next time`,
    "F\*ckingProTip: run 'fkn sokoballs'",
    "F\*ckingProTip: cleanup supports a '--verbose' flag that shows CLI output in real time from tasks that are being automated",
    `F\*ckingProTip: critical errors get logged to ${GetAppPath("ERRORS")} in a fairly readable format`,
    `F\*ckingProTip: run 'fkn export <project>', it'll show you what we REALLY understand about your project (and care enough about)`,
    `F\*ckingProTip: 'fkn surrender' has aliases that do the exact same thing but more properly representing why you chose to surrender on a project, for example 'fkn im-done-with <project>', or 'fkn i-give-up <project>'`,
    `F\*ckingProTip: if your drive is nearly full and you desperately need storage, run 'fkn storage-emergency'. thank me later. note: desperate situations require desperate measures, be advised.`,
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
    `${APP_NAME.CASED}/Deno/Bun, actually`,
    `${I_LIKE_JS.FKN}JSRuntimesInGeneral, actually`,
    `${APP_NAME.CASED}? More like ${I_LIKE_JS.FKN}Cool!`,
];

const quotes = [
    "'Anything that can be written in JavaScript, will be eventually written in JavaScript' - Jeff Atwood",
    "'It just works' - Steve Jobs",
];

export const phrases = [
    ...devJokes,
    ...coolJokes,
    ...internalJokes,
    ...brandingJokes,
    ...appRelatedJokes,
    ...quotes,
    ...internalQuotes,
    ...hints,
];
