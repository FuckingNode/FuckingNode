/** Info on the user's platform. */
export const LOCAL_PLATFORM: {
    /** What system platform we're on. `"chad"` = POSIX, `"windows"` = WINDOWS. */
    SYSTEM: "windows" | "chad";
    /** Local user's username. */
    USER: string | undefined;
    /** APPDATA or whatever it is equivalent to on Linux & macOS. */
    APPDATA: string | undefined;
} = {
    SYSTEM: (Deno.build.os === "windows"
            || globalThis.Deno?.build.os === "windows"
            || globalThis.navigator?.userAgent?.includes("Windows")
            || globalThis.process?.platform?.startsWith("win"))
        ? "windows"
        : "chad",
    USER: (Deno.env.get("USERNAME") || Deno.env.get("USER")),
    APPDATA: (
        Deno.env.get("APPDATA")
        || Deno.env.get("XDG_CONFIG_HOME")
        || `${Deno.env.get("HOME") ?? ""}/.config/` // this is a fallback
    ),
};
