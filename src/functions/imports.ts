import { createSourceFile, forEachChild, isImportDeclaration, ScriptTarget } from "typescript";
import { join, parse } from "@std/path";

/**
 * Gets all imports from a JavaScript/TypeScript projects.
 *
 * @async
 * @param {string} dir Base directory. It'll be recursively read, so be sure it's something like `src/`.
 * @returns {Promise<Set<string>>}
 */
export async function GetTsImports(dir: string): Promise<Set<string>> {
    const imports = new Set<string>();

    async function walk(directory: string) {
        const files = Deno.readDirSync(directory);
        await Promise.all(files.map(async (file) => {
            const fullPath = join(directory, file.name);
            const stat = await Deno.stat(fullPath);

            if (stat.isDirectory) {
                if (fullPath.endsWith("node_modules")) console.warn("ERROR: getting TS imports from node_modules!?");
                await walk(fullPath);
            } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".js")) {
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
