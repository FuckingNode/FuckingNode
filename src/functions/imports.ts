import { createSourceFile, forEachChild, isImportDeclaration, ScriptTarget } from "typescript";
import { extname, join, parse } from "@std/path";
import { validateAgainst } from "@zakahacecosas/string-utils";

// WHAT'S UP
// in future versions I want this to check for dependencies that are never imported
// so we can remove them for the user (excluding anything they want to explicitly keep)
// i'm a bit lazy so this'll come on a later release, for now it's unused

/**
 * Gets all imports from a JavaScript/TypeScript project.
 *
 * @async
 * @param {string} dir Base directory. It'll be recursively read, so be sure it's something like `src/`.
 * @returns {Promise<Set<string>>}
 */
export async function GetJavascriptImports(dir: string): Promise<Set<string>> {
    const imports = new Set<string>();

    async function walk(directory: string): Promise<void> {
        const files = Deno.readDirSync(directory);
        await Promise.all(files.map(async (file) => {
            const fullPath = join(directory, file.name);
            const stat = await Deno.stat(fullPath);

            if (stat.isDirectory) {
                if (fullPath.endsWith("node_modules")) throw "Getting JS imports from node_modules!?";
                await walk(fullPath);
            } else if (validateAgainst(extname(fullPath), [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"])) {
                const content = await Deno.readTextFile(fullPath);
                const sourceFile = createSourceFile(fullPath, content, ScriptTarget.ESNext, true);

                forEachChild(sourceFile, (node) => {
                    if (isImportDeclaration(node) && node.moduleSpecifier) {
                        const txt = node.moduleSpecifier.getText();
                        imports.add((txt.includes("./") || txt.includes("../")) ? parse(txt).base : txt);
                    }
                });
            }
        }));
    }

    await walk(dir);
    return imports;
}
