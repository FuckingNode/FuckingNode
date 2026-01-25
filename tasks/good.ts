console.log("We making this good");

function Run(...args: string[]) {
    const output = new Deno.Command("deno", {
        args,
    }).outputSync();

    if (!output.success) throw new Error(new TextDecoder().decode(output.stderr));
    console.log(args, "went right");
}

Run("check", "."); // ensure code is right

Run("fmt"); // ensure code is formatted

Run("outdated", "--update", "--latest"); // ensure deps are on latest
