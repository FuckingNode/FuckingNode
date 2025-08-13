import { FknError } from "../../functions/error.ts";
import { ColorString } from "../../functions/color.ts";

const SUPPORTED_FILES = [
    "fknode.yaml",
    ".gitignore",
    "tsconfig.json",
    ".editorconfig",
    ".prettierrc",
    "LICENSE",
    ".npmrc",
    ".dockerignore",
    ".gitattributes",
] as const;
type SUPPORTED_FILE = typeof SUPPORTED_FILES[number];

/** Get an embed file. */
function Get(name: string): string {
    const dir = Deno.readDirSync(import.meta.dirname + "/setups");
    let result: string | null = null;
    for (const match of dir) {
        if (match.isFile && match.name === name) result = Deno.readTextFileSync(import.meta.dirname + "/setups/" + match.name);
    }
    if (!result) {
        throw new FknError(
            "Internal__InvalidEmbedded",
            "Invalid name: " + name,
        );
    }
    return result;
}

export const SETUPS: {
    name: string;
    desc: string;
    content: string;
    seek: SUPPORTED_FILE;
}[] = [
    {
        name: "fknode-basic",
        desc: "A very basic fknode.yaml file.",
        content: Get("fknode-basic.yaml"),
        seek: "fknode.yaml",
    },
    {
        name: "fknode-allow-all",
        desc: "An fknode.yaml file that allows every feature to run (commits too!).",
        content: Get("fknode-allow-all.yaml"),
        seek: "fknode.yaml",
    },
    {
        name: "gitignore-js",
        desc: "A gitignore file for JavaScript projects.",
        content: Get(".gitignore-js"),
        seek: ".gitignore",
    },
    {
        name: "gitignore-js-nolock",
        desc: "A gitignore file for JavaScript projects (also ignores lockfiles).",
        content: Get(".gitignore-js-nolock"),
        seek: ".gitignore",
    },
    {
        name: "ts-strictest",
        desc: "Strictest way of TypeScripting, ensuring cleanest code.",
        content: Get("ts-strictest.json"),
        seek: "tsconfig.json",
    },
    {
        name: "ts-library",
        desc: "Recommended config for libraries.",
        content: Get("ts-library.json"),
        seek: "tsconfig.json",
    },
    {
        name: "editorconfig-default",
        desc: "A basic .editorconfig file that works for everyone.",
        content: Get(".editorconfig-default"),
        seek: ".editorconfig",
    },
    {
        name: "prettierrc-default",
        desc: "An unopinionated Prettier config that suits everyone.",
        content: Get(".prettierrc-default"),
        seek: ".prettierrc",
    },
    {
        name: "prettierrc-funy",
        desc: "(this should not be used in real working environments)",
        content: Get(".prettierrc-funy"),
        seek: ".prettierrc",
    },
    {
        name: "license-mit",
        desc: "LICENSE file for the MIT License",
        content: Get("LICENSE-MIT"),
        seek: "LICENSE",
    },
    {
        name: "license-gpl3",
        desc: "LICENSE file for the GNU General Public License v3",
        content: Get("LICENSE-GPL3"),
        seek: "LICENSE",
    },
    {
        name: "license-apache2",
        desc: "LICENSE file for the Apache 2.0 License",
        content: Get("LICENSE-APACHE2"),
        seek: "LICENSE",
    },
    {
        name: "gitattributes-eol",
        desc: "Git attributes file that sets line endings to LF.",
        content: Get(".gitattributes"),
        seek: ".gitattributes",
    },
    {
        name: ".dockerignore",
        desc: "A basic Docker ignore file.",
        content: Get(".dockerignore"),
        seek: ".dockerignore",
    },
    {
        name: "npmrc-exact",
        desc: "A simple npmrc file that saves exact versions instead of ranged versions.",
        content: Get("npmrc-exact"),
        seek: ".npmrc",
    },
];

export const VISIBLE_SETUPS = SETUPS.map(({ name, desc, seek }) => ({
    Name: ColorString(
        name,
        seek === "fknode.yaml"
            ? "red"
            : seek === "tsconfig.json"
            ? "bright-blue"
            : seek === ".editorconfig"
            ? "cyan"
            : seek === ".prettierrc"
            ? "bright-yellow"
            : (seek === ".gitattributes" || seek === ".gitignore")
            ? "orange"
            : seek === "LICENSE"
            ? "bright-orange"
            : seek === ".npmrc"
            ? "green"
            : "blue",
    ),
    Description: ColorString(desc, "italic"),
}));
