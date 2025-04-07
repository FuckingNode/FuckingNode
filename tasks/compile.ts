import { APP_NAME } from "../src/constants.ts";

function CompileApp(): void {
    const TARGETS: Record<
        "win64" | "darwinArm" | "linuxArm" | "darwin64" | "linux64",
        [string, string]
    > = {
        win64: ["x86_64-pc-windows-msvc", "win64"],
        darwinArm: ["aarch64-apple-darwin", "mac_os_arm"],
        linuxArm: ["aarch64-unknown-linux-gnu", "linux_arm"],
        darwin64: ["x86_64-apple-darwin", "mac_os_x86_64"],
        linux64: ["x86_64-unknown-linux-gnu", "linux_x86_64"],
    };

    const ALL_COMMANDS = Object.entries(TARGETS).map(([_key, [target, output]]) => {
        const compiledName = `${APP_NAME.CASED}-${output}${target === "win64" ? ".exe" : ""}`;

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

        return new Deno.Command("deno", { args: compilerArguments });
    });

    for (const CMD of ALL_COMMANDS) {
        const process = CMD.spawn();
        process.status.then((status) => {
            console.log(
                status.success ? `Something went right` : `Something went wrong: ${status.code} / ${status.signal?.toString()}`,
            );
        });
    }
}

try {
    Deno.statSync("./dist/");
    Deno.removeSync("./dist/", {
        recursive: true,
    });
} catch {
    // no dist/
}

Deno.mkdir("./dist/");

CompileApp();

// for nix, run "nix-prefetch-url URL_TO_LATEST_LINUX_64_86_EXE"
