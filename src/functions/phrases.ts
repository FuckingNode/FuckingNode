/**
 * This file contains random phrases for the about page. You're not supposed to edit it, however funny additions are always welcome :).
 * Some of these are the kind of jokes only some people (mostly friends of mine) understand. Others are just really random (but real) phrases. But hey, any funny addition is, as I said, welcome.
 */

import { GetAppPath } from "./config.ts";

const internalJokes = [
    "Dima definitely approves", // indeed he does
    "Sokora Seal of Approval", // and i'm proud of it
    `(it's named this way because Node is fucking annoying, not because I fucked it)`, // (someone really asked me)
    "Proudly made by ZakaHaceCosas (translates to 'ZakaMakesStuff')", // YOO
    "Proudly developed in Spain (the S is silent)", // elections here don't work, i swear
    "i should be studying chemistry and i'm writing random phrases for this thing", // real btw
    "haccing skill #3: download a CLI tool", // the 3rd one in a series
];

const internalQuotes = [
    "'You are supposed to cool it, not heat it up' - Herpes of Balkan", // i mean, he's right
    "'THE DAY OF Ws' - Serge", // that was a good day
    "'lmfao' - Serge", // such a quote is worth a book
    "'am jok' - Serge", // hes jok
    "'please don't kil' - Serge",
    "'shork thinking its smol fish crushes goose!!!!' - Serge",
    "'its sokover' - Serge", // from the creators of it's joever (not)
    "'Dookie in da pookie' - Dima",
    "'Learn as if you will live forever, live like you will die tomorrow' - EpicSprout", // poetic
    "'widnwos sucsk' - Serge", // he got a point, kind of
    "'We either have one ball, or we have two' - Serge", // he got a point there, too
    "'At the end of the day, all sokoballers will sokoball' - Serge", // ...
    // this project is sponsoring https://sokora.org at this point
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
    "#RewriteToBrainFuck",
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

export const HINTS = [
    `Set the FKNODE_SHALL_WE_DEBUG environment variable to "yeah" to see internal debugging logs.`,
    `Critical errors are logged in ${GetAppPath("ERRORS")}, in a fairly readable format.`,
    `After running 'kickstart' on a large repository, you can switch windows and do something else; if it takes more than 2 minutes, whenever we finish we'll send a desktop notification.`,
    `The 'surrender' command has aliases that do the exact same thing but more properly represent why you chose to surrender on a project.\nFor example 'fkn im-done-with <project>', or 'fkn i-give-up <project>'.`,
    `If your drive is nearly full and you desperately need storage, run 'fkn storage-emergency'. it'll remove 'node_modules' from all of your projects. You'll need to reinstall later, but desperate situations require desperate measures, and this recovers gigabytes of storage.`,
    `You can kickstart a project with a Git alias.\nFor example, 'kickstart gh:cool-guy/cool-repo' maps to 'https://github.com/cool-guy/cool-repo.git' - so you type less.\nThere's 10 aliases, run 'compat kickstart' to see all.`,
    `All config files live at ${GetAppPath("BASE")}.\nTouch anything there if you want to.`,
    `If you touch and break any config file, run 'fkn something-fucked-up'. It'll reset all config files except for your project list.`,
    `Here's an actually good pro tip: use Deno, or Bun, or learn another language like Go or Rust.\nJust. Avoid. Node.`,
];

const appRelatedJokes = [
    "funnily enough, this could be an(other) npm package",
    "using javascript to fix javascript (again)",
    "made in Deno, made for Node, made eating a Bun",
    "don't tell mommy i said the f-word",
    "question: how do you end up downloading a CLI tool literally called 'FuckingNode'?",
    "fun fact: this started as a .ps1 script i used to automate cleaning of my own node_modules",
    "fun fact: it's not made in node",
    "(we need a better logo)",
    "Why Go and Rust? No clue",
    "yes we're gonna keep our branding JS-related even tho we support Rust",
];

const brandingJokes = [
    "Make JavaScript great again!",
    "Make JavaScript great again! (not like it ever was)",
    "FuckingNode/Deno/Bun/Golang/Rust, actually",
    "FuckingJSRuntimesInGeneral, actually",
    "FuckingNode? More like FuckingCool!",
];

const quotes = [
    "'Anything that can be written in JavaScript, will be eventually written in JavaScript.' - Jeff Atwood",
    "'It just works' - Steve Jobs",
    "'Good programmers know what to write. Great ones know what to rewrite and reuse.' - Eric S. Raymond",
    "'Software and cathedrals are much the same; first we build them, then we pray' - (anonymous)",
    "'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.' - Martin Fowler",
    "'Make it work, make it right, make it fast.' - Kent Beck",
    "'When in doubt, use brute force.' - Ken Thompson",
    "'If you can't write it down in English, you can't code it.' - Peter Halpern",
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
