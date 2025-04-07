import { ColorString } from "../../functions/io.ts";

/** Get an embed file. */
function Get(name: string): string {
    const dir = Deno.readDirSync(import.meta.dirname + "/setups");
    let result: string | null = null;
    for (const match of dir) {
        if (match.isFile && match.name === name) result = Deno.readTextFileSync(import.meta.dirname + "/setups/" + match.name);
    }
    if (!result) throw new Error("Invalid name: " + name);
    return result;
}

export const SETUPS: {
    name: string;
    desc: string;
    content: string;
    seek: "fknode.yaml" | ".gitignore" | "tsconfig.json" | ".editorconfig";
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
];

export const VISIBLE_SETUPS = SETUPS.map(({ name, desc, seek }) => ({
    Name: ColorString(
        name,
        seek === "fknode.yaml" ? "red" : seek === "tsconfig.json" ? "bright-blue" : seek === ".editorconfig" ? "cyan" : "orange",
    ),
    Description: ColorString(desc, "bold"),
}));
