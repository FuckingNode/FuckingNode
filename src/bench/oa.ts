// oa.ts, object access
const WIN = Deno.build.os === "windows"
    || globalThis.Deno?.build.os === "windows"
    || globalThis.navigator?.userAgent?.includes("Windows")
    || globalThis.process?.platform?.startsWith("win");

Deno.bench({
    name: "obj access",
    warmup: 300,
    fn: () => {
        const LOCAL_PLATFORM: {
            /** What system platform we're on. */
            SYSTEM: "msft" | "posix";
            /** APPDATA or whatever it is equivalent to on Linux & macOS. */
            APPDATA: string | undefined;
            /** Shell name (and command prefix). */
            SHELL: "bash" | "powershell";
            /** Shell Script Suffix for filenames. */
            SSS: ".ps1" | ".sh";
        } = {
            SYSTEM: WIN ? "msft" : "posix",
            APPDATA: (
                Deno.env.get("APPDATA")
                || Deno.env.get("XDG_CONFIG_HOME")
                || `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
            ),
            SHELL: WIN ? "powershell" : "bash",
            SSS: WIN ? ".ps1" : ".sh",
        };

        let _ = LOCAL_PLATFORM.APPDATA;
        _ = LOCAL_PLATFORM.SHELL;
        _ = LOCAL_PLATFORM.SSS;
        _ = LOCAL_PLATFORM.SYSTEM;
        _;
    },
});

Deno.bench({
    name: "cnt access",
    warmup: 300,
    fn: () => {
        /** What system platform we're on. */
        const LOCAL_SYSTEM: "msft" | "posix" = WIN ? "msft" : "posix";
        /** APPDATA or whatever it is equivalent to on Linux & macOS. */
        const LOCAL_APPDATA: string = (
            Deno.env.get("APPDATA")
            || Deno.env.get("XDG_CONFIG_HOME")
            || `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
        );
        /** Shell name (and command prefix). */
        const LOCAL_SHELL: "bash" | "powershell" = WIN ? "powershell" : "bash";
        /** Shell Script Suffix for filenames. */
        const LOCAL_SSS: ".ps1" | ".sh" = WIN ? ".ps1" : ".sh";

        let _: any = LOCAL_APPDATA;
        _ = LOCAL_SHELL;
        _ = LOCAL_SSS;
        _ = LOCAL_SYSTEM;
        _;
    },
});

Deno.bench({
    name: "obj access (optimized)",
    warmup: 300,
    fn: () => {
        const LOCAL_PLATFORM: {
            /** What system platform we're on. */
            SYSTEM: "msft" | "posix";
            /** APPDATA or whatever it is equivalent to on Linux & macOS. */
            APPDATA: string | undefined;
            /** Shell name (and command prefix). */
            SHELL: "bash" | "powershell";
            /** Shell Script Suffix for filenames. */
            SSS: ".ps1" | ".sh";
        } = {
            SYSTEM: WIN ? "msft" : "posix",
            APPDATA: WIN ? Deno.env.get("APPDATA")! : (
                Deno.env.get("XDG_CONFIG_HOME")
                || `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
            ),
            SHELL: WIN ? "powershell" : "bash",
            SSS: WIN ? ".ps1" : ".sh",
        };

        let _ = LOCAL_PLATFORM.APPDATA;
        _ = LOCAL_PLATFORM.SHELL;
        _ = LOCAL_PLATFORM.SSS;
        _ = LOCAL_PLATFORM.SYSTEM;
        _;
    },
});

Deno.bench({
    name: "cnt access (optimized)",
    warmup: 300,
    fn: () => {
        /** What system platform we're on. */
        const LOCAL_SYSTEM: "msft" | "posix" = WIN ? "msft" : "posix";
        /** APPDATA or whatever it is equivalent to on Linux & macOS. */
        const LOCAL_APPDATA: string = WIN ? Deno.env.get("APPDATA")! : (
            Deno.env.get("XDG_CONFIG_HOME")
            || `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
        );
        /** Shell name (and command prefix). */
        const LOCAL_SHELL: "bash" | "powershell" = WIN ? "powershell" : "bash";
        /** Shell Script Suffix for filenames. */
        const LOCAL_SSS: ".ps1" | ".sh" = WIN ? ".ps1" : ".sh";

        let _: any = LOCAL_APPDATA;
        _ = LOCAL_SHELL;
        _ = LOCAL_SSS;
        _ = LOCAL_SYSTEM;
        _;
    },
});

/**
 * RESULT:
 *
 * sometimes cnt wins
     CPU | Intel(R) Core(TM) i5-10500T CPU @ 2.30GHz
Runtime | Deno 2.7.9 (x86_64-unknown-linux-gnu)

file:///home/zaka/proyectitos/FuckingNode/src/bench/oa.ts

| benchmark                | time/iter (avg) |        iter/s |      (min … max)      |      p75 |      p99 |     p995 |
| ------------------------ | --------------- | ------------- | --------------------- | -------- | -------- | -------- |
| obj access               |        634.8 ns |     1,575,000 | (602.0 ns … 838.0 ns) | 636.4 ns | 838.0 ns | 838.0 ns |
| cnt access               |        620.2 ns |     1,612,000 | (601.2 ns … 896.5 ns) | 622.5 ns | 896.5 ns | 896.5 ns |
| obj access (optimized)   |        357.3 ns |     2,799,000 | (341.8 ns … 530.7 ns) | 361.1 ns | 511.6 ns | 530.7 ns |
| cnt access (optimized)   |        353.7 ns |     2,827,000 | (341.1 ns … 556.3 ns) | 352.9 ns | 533.4 ns | 556.3 ns |
  * other times, obj does
| benchmark                | time/iter (avg) |        iter/s |      (min … max)      |      p75 |      p99 |     p995 |
| ------------------------ | --------------- | ------------- | --------------------- | -------- | -------- | -------- |
| obj access               |        671.4 ns |     1,489,000 | (603.0 ns …   2.2 µs) | 643.4 ns |   2.2 µs |   2.2 µs |
| cnt access               |        638.7 ns |     1,566,000 | (603.1 ns …   1.0 µs) | 637.7 ns |   1.0 µs |   1.0 µs |
| obj access (optimized)   |        351.9 ns |     2,842,000 | (342.0 ns … 547.3 ns) | 352.9 ns | 513.0 ns | 547.3 ns |
| cnt access (optimized)   |        356.0 ns |     2,809,000 | (340.7 ns … 553.6 ns) | 358.2 ns | 499.1 ns | 553.6 ns |
  * since i can't tell, i'll avoid extra code modification and keep the object, with the discovered optimizations
 */
