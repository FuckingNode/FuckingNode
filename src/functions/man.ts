// deno-lint-ignore-file no-unreachable
import { FknError } from "./error.ts";

export function SetupUnixMan(): void {
    throw new FknError(
        "Internal__Lazy",
        "Man setup is yet to be added.",
    );

    // @ts-ignore unreachable code is "bad"
    Deno.writeTextFileSync(
        "/usr/share/man/man1/fuckingnode.1",
        "TODO", // TODO(@ZakaHaceCosas): embed man.1 file
    );
    new Deno.Command(
        "sudo",
        {
            args: ["mandb"],
        },
    ).outputSync();
}
