import { walk } from "@std/fs/walk";
import { join } from "@std/path";

console.log("we making this good");

const dir = Deno.cwd(); // as the CWD from where you'll run deno task will always be the root of the project

function Run(...args: string[]) {
    const output = new Deno.Command("deno", {
        args,
    }).outputSync();

    const e = new TextDecoder();

    if (!output.success) throw new Error(e.decode(output.stderr) + "\n" + e.decode(output.stdout));
    console.log(args, "went right");
}

async function GetAllTsFiles(): Promise<string[]> {
    const exclude = [join(dir, "tests/environment")];
    const tsFiles: string[] = [];

    for await (
        const entry of walk(dir, {
            includeDirs: false,
            exts: [".ts"],
            skip: [
                ...exclude.map((excluded) => new RegExp(`(^|/)${excluded}(/|$)`)),
                /\.ignore\.ts$/,
            ],
        })
    ) {
        tsFiles.push(entry.path);
    }

    return tsFiles;
}

const toPrepare: string[] = await GetAllTsFiles();

for (const unprepared of toPrepare) Run("check", unprepared); // ensure code is right

Run("fmt"); // ensure code is formatted

Run("upgrade"); // ensure we're on latest

Run("outdated", "--update", "--latest"); // ensure deps are on latest

try {
    Deno.stat("../fkdocs");
} catch (e) {
    if (e instanceof Deno.errors.NotFound) {
        console.warn("Didn't copy scripts to docs. You'll have to clone the repo for that (in ../fkdocs).");
    }
}

await Deno.copyFile(
    join(dir, "scripts/install.ps1"),
    join(dir, "../fkdocs/docs/install.ps1"),
); // ensure Windows install is on latest
await Deno.copyFile(
    join(dir, "scripts/install.sh"),
    join(dir, "../fkdocs/docs/install.sh"),
); // ensure macOS and Linux install are on latest
