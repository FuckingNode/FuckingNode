import { APP_NAME } from "../src/constants.ts";
import { stringify as stringifyYaml } from "@std/yaml";

try {
    Deno.statSync("./dist/");
    Deno.removeSync("./dist/", {
        recursive: true,
    });
} catch {
    // no dist/
}

Deno.mkdir("./dist/");

console.debug(Deno.cwd());

const TARGETS: Record<
    "win64" | "darwinArm" | "linuxArm" | "darwin64" | "linux64",
    [string, string]
> = {
    win64: ["x86_64-pc-windows-msvc", "win64"],
    darwinArm: ["aarch64-apple-darwin", "macos_arm"],
    linuxArm: ["aarch64-unknown-linux-gnu", "linux_arm"],
    darwin64: ["x86_64-apple-darwin", "macos64"],
    linux64: ["x86_64-unknown-linux-gnu", "linux64"],
};

const ALL_COMMANDS = Object.entries(TARGETS).map(([key, [target, output]]) => {
    const compiledName = `${APP_NAME.CASED}-${output}${key === "win64" ? ".exe" : ""}`;

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

    // hash and signature stuff is for
    const hasherArguments = [
        "kbd-hash",
        `dist/${compiledName}`,
        "--porcelain",
    ];

    let newTarget: "linux_64_sha" | "linux_arm_sha" | "mac_64_sha" | "mac_arm_sha" | "win64_sha" | null = null;

    if (key === "win64") {
        newTarget = "win64_sha";
    } else if (key === "linux64") {
        newTarget = "linux_64_sha";
    } else if (key === "linuxArm") {
        newTarget = "linux_arm_sha";
    } else if (key === "darwin64") {
        newTarget = "mac_64_sha";
    } else if (key === "darwinArm") {
        newTarget = "mac_arm_sha";
    }

    if (!newTarget) throw new Error("No newTarget for " + key);

    return {
        target: newTarget,
        compileCmd: new Deno.Command("deno", { args: compilerArguments }),
        hashCmd: new Deno.Command("kbi", { args: hasherArguments }),
    };
});

// first
for (const CMD of ALL_COMMANDS) {
    console.log("Compile for", CMD.target);
    CMD.compileCmd.outputSync();
}

// then
const hashes: Record<
    "linux_64_sha" | "linux_arm_sha" | "mac_64_sha" | "mac_arm_sha" | "win64_sha",
    string
> = {
    linux_64_sha: "",
    linux_arm_sha: "",
    mac_64_sha: "",
    mac_arm_sha: "",
    win64_sha: "",
};
for (const CMD of ALL_COMMANDS) {
    console.log("Hash for", CMD.target);
    const hashing = CMD.hashCmd.outputSync();
    const hash = new TextDecoder().decode(hashing.stdout).trim();
    hashes[CMD.target] = hash;
    console.log(CMD.target, ":", hash);
    Deno.writeTextFileSync("konbini.hash.yaml", stringifyYaml(hashes));
}

// for nix, run "nix-prefetch-url URL_TO_LATEST_LINUX_64_86_EXE"

// for konbini asc, run:
// gpg --armor --output dist/FuckingNode-A.asc --detach-sig --digest-algo SHA512 --armor dist/FuckingNode-A
