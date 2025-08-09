import { APP_NAME } from "../src/constants.ts";
import { stringify as stringifyYaml } from "@std/yaml";

const release = Deno.args.includes("--release");

try {
    Deno.statSync("./dist/");
    Deno.removeSync("./dist/", {
        recursive: true,
    });
} catch {
    // no dist/
}

Deno.mkdir("./dist/");

type OS = "win64" | "macArm" | "linuxArm" | "mac64" | "linux64";

const TARGETS: Record<
    OS,
    [string, OS]
> = {
    win64: ["x86_64-pc-windows-msvc", "win64"],
    macArm: ["aarch64-apple-darwin", "macArm"],
    linuxArm: ["aarch64-unknown-linux-gnu", "linuxArm"],
    mac64: ["x86_64-apple-darwin", "mac64"],
    linux64: ["x86_64-unknown-linux-gnu", "linux64"],
};

const ALL_COMMANDS = Object.entries(TARGETS).map(([key, [target, output]]: [string, [string, string]]): {
    target: OS;
    compileCmd: Deno.Command;
    hashCmd: Deno.Command;
    signCmd: Deno.Command;
} => {
    const compiledName = `${APP_NAME.CLI}-${output}${key === "win64" ? ".exe" : ""}`;

    const compilerArguments = [
        "compile",
        "--allow-write", // write files, like project list
        "--allow-read", // read files, like a project's package.json
        "--allow-net", // fetch the network, to update the app
        "--allow-env", // see ENV variables, to access .../AppData/...
        "--allow-run", // run cleanup commands
        "--allow-sys=osUptime", // used for an easter egg that requires OS uptime
        "--include",
        "./src/commands/toolkit/setups", // include setups
        "--target",
        target,
        "--output",
        `dist/${compiledName}`,
        "src/main.ts",
    ];

    // hash and signature stuff
    const hasherArguments = [
        "hash",
        `dist/${compiledName}`,
        "--porcelain",
    ];

    const signerArguments = [
        "sign",
        "apply",
        `dist/${compiledName}`,
        "org.fuckingnode",
    ];

    return {
        target: key as OS,
        compileCmd: new Deno.Command("deno", { args: compilerArguments }),
        // env: {} is a workaround for Deno not properly reading my PATH for whatever reason...
        // it's just me who can make releases so ig it's okay to hardcode my user path lmao
        hashCmd: new Deno.Command("kbi", { args: hasherArguments, env: { PATH: "C:\\Users\\Zaka\\kbi\\exe;" + Deno.env.get("PATH") } }),
        signCmd: new Deno.Command("kbi", { args: signerArguments, env: { PATH: "C:\\Users\\Zaka\\kbi\\exe;" + Deno.env.get("PATH") } }),
    };
});

for (const CMD of ALL_COMMANDS) {
    CMD.compileCmd.outputSync();
}

if (release) {
    const hashes: Record<
        OS,
        string
    > = {
        linux64: "",
        linuxArm: "",
        mac64: "",
        macArm: "",
        win64: "",
    };

    for (const CMD of ALL_COMMANDS) {
        const hashing = CMD.hashCmd.outputSync();
        const hash = new TextDecoder().decode(hashing.stdout).trim();
        hashes[CMD.target] = hash;
        console.log(CMD.target, "HASH", hash);
        Deno.writeTextFileSync("dist/konbini.hash.yaml", stringifyYaml(hashes));
        CMD.signCmd.outputSync();
        console.log("Signed", CMD.target);
    }

    console.log(
        "Don't forget hashing Nix releases! From Linux or WSL, run:",
        "nix run .#hashes --extra-experimental-features nix-command --extra-experimental-features flakes",
    );
}
