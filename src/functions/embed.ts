import { join } from "@std/path";
import { FknError } from "./error.ts";

/** Get an embedded file. */
export function Get(name: string, _src: "/setups" | "/terminators" | "/manpage"): string {
    const src = "../embed" + _src;
    const dir = Deno.readDirSync(join(import.meta.dirname!, src));
    for (const match of dir) {
        if (match.isFile && match.name === name) {
            return Deno.readTextFileSync(
                join(import.meta.dirname!, src, match.name),
            );
        }
    }
    throw new FknError(
        "Internal__InvalidEmbedded",
        `Invalid name '${name}' requested at embedded src ${src}. This is our fault, please raise an issue.`,
    );
}
