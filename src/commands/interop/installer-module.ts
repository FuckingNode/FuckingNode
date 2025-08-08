import { Commander, ManagerExists } from "../../functions/cli.ts";
import { FknError } from "../../functions/error.ts";
import { CheckForPath, JoinPaths, ParsePath } from "../../functions/filesystem.ts";
import type { MANAGER_JS } from "../../types/platform.ts";

export const Installers = {
    UniJs: (path: string, manager: MANAGER_JS) => {
        Deno.chdir(ParsePath(path));
        if (!ManagerExists(manager)) throw new FknError("Env__MissingMotor", `${manager} is not installed!`);
        Commander(manager, ["install"]);
        return;
    },
    Golang: (path: string) => {
        Deno.chdir(ParsePath(path));
        if (!ManagerExists("go")) throw new FknError("Env__MissingMotor", `go is not installed!`);
        if (CheckForPath(JoinPaths(Deno.cwd(), "vendor"))) {
            Commander("go", ["mod", "vendor"]);
            return;
        }
        Commander("go", ["mod", "tidy"]);
        return;
    },
    Cargo: (path: string) => {
        Deno.chdir(ParsePath(path));
        if (!ManagerExists("cargo")) throw new FknError("Env__MissingMotor", `cargo is not installed!`);
        Commander("cargo", ["fetch"]);
        Commander("cargo", ["check"]);
        return;
    },
};
