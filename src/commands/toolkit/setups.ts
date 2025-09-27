import { ColorString } from "../../functions/color.ts";
import { Get } from "../../functions/embed.ts";

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

export const SETUPS: {
    name: string;
    desc: string;
    content: string;
    seek: SUPPORTED_FILE;
}[] = [
    {
        name: "fknode-basic",
        desc: "A very basic fknode.yaml file.",
        content: Get("fknode-basic.yaml", "/setups"),
        seek: "fknode.yaml",
    },
    {
        name: "fknode-allow-all",
        desc: "An fknode.yaml file that enables every feature (commits too!).",
        content: Get("fknode-allow-all.yaml", "/setups"),
        seek: "fknode.yaml",
    },
    {
        name: "gitignore-js",
        desc: "A gitignore for JavaScript projects.",
        content: Get("js.gitignore", "/setups"),
        seek: ".gitignore",
    },
    {
        name: "gitignore-js-nolock",
        desc: "A gitignore for JavaScript projects (ignores lockfiles!).",
        content: Get("js-nolock.gitignore", "/setups"),
        seek: ".gitignore",
    },
    {
        name: "gitignore-golang",
        desc: "A gitignore for Go projects.",
        content: Get("go.gitignore", "/setups"),
        seek: ".gitignore",
    },
    {
        name: "gitignore-rust",
        desc: "A gitignore for Rust projects.",
        content: Get("go.gitignore", "/setups"),
        seek: ".gitignore",
    },
    {
        name: "ts-strictest",
        desc: "Strictest way of TypeScripting, ensuring cleanest code.",
        content: Get("ts-strictest.json", "/setups"),
        seek: "tsconfig.json",
    },
    {
        name: "ts-library",
        desc: "Recommended config for libraries.",
        content: Get("ts-library.json", "/setups"),
        seek: "tsconfig.json",
    },
    {
        name: "editorconfig-default",
        desc: "A basic .editorconfig file that works for most people.",
        content: Get(".editorconfig-default", "/setups"),
        seek: ".editorconfig",
    },
    {
        name: "prettierrc-default",
        desc: "An unopinionated Prettier config that suits everyone.",
        content: Get(".prettierrc-default", "/setups"),
        seek: ".prettierrc",
    },
    {
        name: "prettierrc-fun",
        desc: "(stupid; this should not be used in real working environments).",
        content: Get(".prettierrc-fun", "/setups"),
        seek: ".prettierrc",
    },
    {
        name: "license-mit",
        desc: "LICENSE file for the MIT License.",
        content: Get("LICENSE-MIT", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "license-bsd2",
        desc: "LICENSE file for the BSD 2-Clause License.",
        content: Get("LICENSE-BSD2", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "license-bsd3",
        desc: "LICENSE file for the BSD 3-Clause License.",
        content: Get("LICENSE-BSD3", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "license-gpl3",
        desc: "LICENSE file for the GNU General Public License v3.",
        content: Get("LICENSE-GPL3", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "license-gpl2",
        desc: "LICENSE file for the GNU General Public License v2.",
        content: Get("LICENSE-GPL2", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "license-apache2",
        desc: "LICENSE file for the Apache 2.0 License.",
        content: Get("LICENSE-APACHE2", "/setups"),
        seek: "LICENSE",
    },
    {
        name: "gitattributes-eol",
        desc: "Git attributes file that sets line endings to LF.",
        content: Get(".gitattributes", "/setups"),
        seek: ".gitattributes",
    },
    {
        name: ".dockerignore",
        desc: "A basic Docker ignore file.",
        content: Get(".dockerignore", "/setups"),
        seek: ".dockerignore",
    },
    {
        name: "npmrc-exact",
        desc: "An npmrc file that saves exact and not ranged versions.",
        content: Get("npmrc-exact", "/setups"),
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
