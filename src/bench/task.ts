import * as DenoJson from "../../deno.json" with { type: "json" };

if (Deno.args[0] === "debug") {
    console.log("This'll show the output of benchmarks live.\nCheck for issues (hope there's none, probably there isn't).");

    await new Deno.Command("deno", {
        args: ["bench", "--allow-all"],
    }).spawn().output();

    Deno.exit(0);
}

console.log("Running benchmarks (give it some time)");

const out = new TextDecoder().decode(
    new Deno.Command("deno", {
        args: ["bench", "--allow-all"],
    }).outputSync().stdout,
);

console.log("\nPerformance insights for", DenoJson.default.version);

console.log(
    out.split("\n").filter((l) => l.startsWith("|")).join("\n"),
);
