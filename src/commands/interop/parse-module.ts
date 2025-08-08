/**
 * @file This file includes parses for file formats that cannot be parsed using existing libraries that I'm aware of, e.g. Go.mod.
 * @author ZakaHaceCosas
 */

import { normalize, type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import type { CargoPkgFile, DenoPkgFile, FnCPF, GolangPkgFile, MANAGER_JS, NodePkgFile } from "../../types/platform.ts";
import { VERSION } from "../../constants.ts";
import { FknError } from "../../functions/error.ts";
import { parse as parseToml } from "@std/toml";
import { parse as parseJsonc } from "@std/jsonc";
import { FkNodeInterop } from "./interop.ts";

/**
 * gets a Golang require-like string:
 * ```go
 * require (
 *      "entry"
 *      "another-entry"
 * )
 * ```
 * and returns all entries in a string array.
 *
 * ### things to note
 * - by design, parens are included, so it'll always be `["(", ..., ")"]`
 * - capable of handling multiple requires (e.g "`require () require ()`")
 *
 * @export
 * @param {string[]} content string[] (assumes you splitted lines with something like `.split("\n")`)
 * @param {string} kw keyword to use as "key" in `key(vals)`
 * @returns {string[]}
 */
export function internalGolangRequireLikeStringParser(content: string[], kw: string): string[] {
    const toReturn: string[] = [];
    let requireCount = 0;

    content.map((line) => {
        const l = normalize(line);
        if (l === `${normalize(kw, { strict: true, removeCliColors: true })} (`) {
            if (requireCount === 0) toReturn.push(l);
            requireCount++;
        } else if (l === ")") {
            // nah
        } else {
            toReturn.push(l); // Push lines outside of require block
        }
    });

    toReturn.push(")");
    return toReturn;
}

// * ###
// * BEGIN THIS CODE SUCKS
// * ###
const internalParsers = {
    GolangPkgFile: (content: string): GolangPkgFile => {
        const lines = content.trim().split("\n");
        let module: UnknownString = "";
        let go: UnknownString = "";
        const require: GolangPkgFile["require"] = {};

        const parsedLines = internalGolangRequireLikeStringParser(lines, "require").filter((line) => line.trim() !== "");

        for (const line of parsedLines) {
            // ?? we assume that module & go version are defined
            if (line.trim().startsWith("module")) {
                module = line.split(" ")[1]?.trim();
                // ?? "__NO_GOLANG_MODULE";
            } else if (line.trim().startsWith("go")) {
                const match = line.trim().match(/go\s+(\d+\.\d+)/);
                // not mine
                go = match ? match[0] : "__NO_GOLANG_VERSION";
                // ?? "__NO_GOLANG_MODULE";
            } else if (line.trim().startsWith("require")) {
                // Process the `require` line by checking for multiple strings in one line or across multiple lines

                // If there's more than one part (URL + version)
                // If it's broken across multiple lines (next line might contain the version), concatenate
                const index = parsedLines.indexOf(line);
                let newIndex = index + 1;

                while (newIndex < parsedLines.length) {
                    const nextLine = parsedLines[newIndex]?.trim();

                    if (nextLine === undefined) {
                        break; // break if the line is invalid
                    }

                    const nextParts = nextLine.split(/\s+/);

                    if (nextParts[0] === undefined || nextParts[1] === undefined) {
                        break; // break if invalid
                    }

                    const moduleName = nextParts[0].trim();
                    const version = nextParts[1].trim();
                    const isIndirect = (nextParts[2] ?? "").includes("indirect") || (nextParts[3] ?? "").includes("indirect");
                    require[moduleName] = {
                        version: version,
                        indirect: isIndirect,
                    };

                    newIndex++; // Move to the next line after processing
                }
            }
        }

        if (!validate(module) || !validate(go)) {
            throw new FknError("Env__PkgFileUnparsable", `Given go.mod contents are unparsable.\n${content}`);
        }

        const toReturn: GolangPkgFile = {
            module,
            go,
            require,
        };

        if (!FkNodeInterop.BareValidators.Golang(toReturn)) {
            throw new FknError("Env__PkgFileUnparsable", `Given go.mod contents are unparsable.`);
        }

        return toReturn;
    },
    CargoPkgFile: (content: string): CargoPkgFile => {
        const toReturn = parseToml(content);

        if (!FkNodeInterop.BareValidators.Cargo(toReturn)) {
            throw new FknError("Env__PkgFileUnparsable", `Given Cargo.toml contents are unparsable.`);
        }

        return toReturn;
    },
    NodeBunPkgFile: (content: string): NodePkgFile => {
        const toReturn = parseJsonc(content);

        if (!FkNodeInterop.BareValidators.NodeBun(toReturn)) {
            throw new FknError("Env__PkgFileUnparsable", `Given package.json contents are unparsable.`);
        }

        return toReturn;
    },
    DenoPkgFile: (content: string): DenoPkgFile => {
        const toReturn = parseJsonc(content);

        if (!FkNodeInterop.BareValidators.Deno(toReturn)) {
            throw new FknError("Env__PkgFileUnparsable", `Given deno.json/deno.jsonc contents are unparsable.`);
        }

        return toReturn;
    },
};

export const dedupeDependencies = (deps: FnCPF["deps"]) => {
    return deps.filter((dep, index, self) => index === self.findIndex((d) => d.name === dep.name));
};

export const findDependency = (target: string, deps: FnCPF["deps"]): FnCPF["deps"][0] | undefined => {
    return deps.find((dep) =>
        normalize(dep.name, { strict: true, preserveCase: true, removeCliColors: true }) ===
            normalize(target, { strict: true, preserveCase: true, removeCliColors: true })
    );
};

// * ###
// * "END" THIS CODE SUCKS
// * ###

export const Parsers = {
    Golang: {
        STD: internalParsers.GolangPkgFile,
        CPF: (content: string, version: string | undefined, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.GolangPkgFile(content);

            const deps: FnCPF["deps"] = [];

            Object.entries(parsedContent.require ?? []).map(
                ([k, v]) => {
                    deps.push(
                        {
                            name: k,
                            ver: v.version,
                            rel: v.indirect === true ? "go:ind" : "univ:dep",
                            src: "pkg.go.dev",
                        },
                    );
                },
            );

            return {
                name: parsedContent.module,
                version: version === undefined ? "Unknown" : version,
                rm: "golang",
                perPlatProps: {
                    cargo_edt: "__NTP",
                },
                ws,
                deps: dedupeDependencies(deps),
                fknVer: VERSION,
            };
        },
    },
    Cargo: {
        STD: internalParsers.CargoPkgFile,
        CPF: (content: string, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.CargoPkgFile(content);

            const deps: FnCPF["deps"] = [];

            function processCargoDependencies(
                depsObject: CargoPkgFile["dependencies"] | undefined,
                rValue: FnCPF["deps"][0]["rel"],
                depsArray: { name: string; ver: string; rel: string; src: string }[],
            ) {
                Object.entries(depsObject ?? {}).forEach(([k, v]) => {
                    depsArray.push({
                        name: k,
                        ver: typeof v === "object" ? String(v.version) : String(v),
                        rel: rValue,
                        src: "crates.io",
                    });
                });
            }

            processCargoDependencies(parsedContent.dependencies, "univ:dep", deps);
            processCargoDependencies(parsedContent["dev-dependencies"], "univ:devD", deps);
            processCargoDependencies(parsedContent["build-dependencies"], "rst:buildD", deps);

            const name =
                (typeof parsedContent.package?.name === "string"
                    ? parsedContent.package?.name
                    : parsedContent.package?.name?.workspace === true
                    ? parsedContent.workspace?.package?.name
                    : "unknown-name") ??
                    "unknown-name";
            const version =
                (typeof parsedContent.package?.version === "string"
                    ? parsedContent.package?.version
                    : parsedContent.package?.version?.workspace === true
                    ? parsedContent.workspace?.package?.version
                    : "unknown-ver") ??
                    "unknown-ver";
            const cargo_edt =
                (typeof parsedContent.package?.edition === "string"
                    ? parsedContent.package?.edition
                    : parsedContent.package?.edition?.workspace === true
                    ? parsedContent.workspace?.package?.edition
                    : "unknown-edt") ??
                    "unknown-edt";

            return {
                name,
                version,
                rm: "cargo",
                perPlatProps: {
                    cargo_edt,
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: VERSION,
            };
        },
    },
    NodeBun: {
        STD: internalParsers.NodeBunPkgFile,
        CPF: (content: string, rt: Exclude<MANAGER_JS, "deno">, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.NodeBunPkgFile(content);

            if (!parsedContent.name) {
                throw new FknError(
                    "Env__PkgFileUnparsable",
                    "Invalid package.json file",
                );
            }

            const deps: FnCPF["deps"] = [];
            function processNodeDependencies(
                depsObject: NodePkgFile["dependencies"] | undefined,
                rValue: FnCPF["deps"][0]["rel"],
                depsArray: { name: string; ver: string; rel: string; src: string }[],
            ) {
                Object.entries(depsObject ?? {}).map(([k, v]) => {
                    depsArray.push({ name: k, ver: v, rel: rValue, src: "npm" });
                });
            }
            processNodeDependencies(parsedContent.dependencies, "univ:dep", deps);
            processNodeDependencies(parsedContent.devDependencies, "univ:devD", deps);
            processNodeDependencies(parsedContent.peerDependencies, "js:peer", deps);

            return {
                name: parsedContent.name,
                version: parsedContent.version ?? "0.0.0",
                rm: rt,
                perPlatProps: {
                    cargo_edt: "__NTP",
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: VERSION,
            };
        },
    },
    Deno: {
        STD: internalParsers.DenoPkgFile,
        CPF: (content: string, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.DenoPkgFile(content);

            const denoImportRegex = /^(?<source>[a-z]+):(?<package>@[a-zA-Z0-9_\-/]+)@(?<version>[~^<>=]*\d+\.\d+\.\d+)$/;
            // regex not mine. deno uses platform:@scope/package@version imports so we gotta do that.

            const deps: FnCPF["deps"] = [];

            Object.values(parsedContent.imports ?? {}).map((v) => {
                const t = v.match(denoImportRegex); // Directly use the match result
                if (
                    t && t.groups && t.groups["package"] && t.groups["version"] &&
                    validateAgainst(t.groups["source"], ["npm", "jsr"])
                ) {
                    deps.push({
                        name: t.groups["package"], // Scope/package
                        ver: t.groups["version"], // Version
                        src: t.groups["source"], // Platform
                        rel: "univ:dep",
                    });
                }
            });

            return {
                name: parsedContent.name ?? "__ERROR_NOT_PROVIDED",
                version: parsedContent.version ?? "0.0.0",
                rm: "deno",
                perPlatProps: {
                    cargo_edt: "__NTP",
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: VERSION,
            };
        },
    },
};
