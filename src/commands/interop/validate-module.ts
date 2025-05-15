import type { CargoPkgFile, DenoPkgFile, GolangPkgFile, NodePkgFile } from "../../types/platform.ts";
import { parse } from "@std/semver";
import { isObject } from "../../functions/projects.ts";
import { validate } from "@zakahacecosas/string-utils";

/** Bare-minimum validation. */
export const BareValidators = {
    // deno-lint-ignore no-explicit-any
    Cargo: (obj: any): obj is CargoPkgFile => {
        return isObject(obj) && obj["package"] && validate(obj["package"]["name"]);
    },

    // deno-lint-ignore no-explicit-any
    Golang: (obj: any): obj is GolangPkgFile => {
        return isObject(obj) && validate(obj["module"]) &&
            validate(obj["go"]);
    },

    // deno-lint-ignore no-explicit-any
    Deno: (obj: any): obj is DenoPkgFile => {
        try {
            parse(obj.version);
        } catch {
            return false;
        }

        return isObject(obj) && validate(obj["name"]) && validate(obj["version"]);
    },

    // deno-lint-ignore no-explicit-any
    NodeBun: (obj: any): obj is NodePkgFile => {
        try {
            parse(obj.version);
        } catch {
            return false;
        }

        return isObject(obj) && validate(obj["name"]) && validate(obj["version"]);
    },
};
