import { walkSync } from "@std/fs/walk";
import { join } from "@std/path";

console.log("we making this good");

const dir = Deno.cwd(); // as the CWD from where you'll run deno task will always be the root of the project

function Run(...args: string[]) {
    const output = new Deno.Command("deno", {
        args,
    }).outputSync();

    if (!output.success) throw new Error(new TextDecoder().decode(output.stderr));
    console.log(args, "went right");
}

function GetAllTsFiles(): string[] {
    const exclude = [join(dir, "tests/environment")];
    const tsFiles: string[] = [];

    for (
        const entry of walkSync(dir, {
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

const toPrepare: string[] = GetAllTsFiles();

for (const unprepared of toPrepare) Run("check", unprepared); // ensure code is right

Run("fmt"); // ensure code is formatted

Run("upgrade"); // ensure we're on latest

Run("outdated", "--update", "--latest"); // ensure deps are on latest
