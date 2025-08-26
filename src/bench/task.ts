import * as DenoJson from "../../deno.json" with { type: "json" };

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
