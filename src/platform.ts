const WIN = Deno.build.os === "windows"
    || globalThis.Deno?.build.os === "windows"
    || globalThis.navigator?.userAgent?.includes("Windows")
    || globalThis.process?.platform?.startsWith("win");

/** Info on the user's platform. */
export const LOCAL_PLATFORM: {
    /** What system platform we're on. */
    SYSTEM: "msft" | "posix";
    /** APPDATA or whatever it is equivalent to on Linux & macOS. */
    APPDATA: string;
    /** Shell name (and command prefix). */
    SHELL: "bash" | "powershell";
    /** Shell Script Suffix for filenames. */
    SSS: ".ps1" | ".sh";
} = {
    SYSTEM: WIN ? "msft" : "posix",
    APPDATA: WIN ? Deno.env.get("APPDATA")! : (
        Deno.env.get("XDG_CONFIG_HOME")
        || `${Deno.env.get("HOME") ?? ""}/.config/`
    ),
    SHELL: WIN ? "powershell" : "bash",
    SSS: WIN ? ".ps1" : ".sh",
};
