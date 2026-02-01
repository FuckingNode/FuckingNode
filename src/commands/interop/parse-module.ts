/**
 * @file This file includes parses for file formats that cannot be parsed using existing libraries that I'm aware of, e.g. Go.mod.
 * @author ZakaHaceCosas
 */
// deno-lint-ignore-file no-explicit-any

import { isObject } from "../../functions/projects.ts";
import { normalize, type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import type { CargoPkgFile, DenoPkgFile, FnCPF, FnCPFDependency, GolangPkgFile, MANAGER_JS, NodePkgFile } from "../../types/platform.ts";
import * as DenoJson from "../../../deno.json" with { type: "json" };
import { FknError } from "../../functions/error.ts";
import { parse as parseToml } from "@std/toml";
import { parse as parseJsonc } from "@std/jsonc";
import { ParsePath } from "../../functions/filesystem.ts";

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
        const lines = content.split("\n").map((s) => s.trim());
        const module: UnknownString = lines.find((l) => l.startsWith("module"))?.split(" ")[1];
        const go: UnknownString = lines.find((l) => l.startsWith("go"))?.split(" ")[1];
        const require: GolangPkgFile["require"] = {};

        for (const line of lines) {
            if (line.startsWith("require")) {
                // Process the `require` line by checking for multiple strings in one line or across multiple lines

                // If there's more than one part (URL + version)
                // If it's broken across multiple lines (next line might contain the version), concatenate
                const startIndex = lines.indexOf(line);
                let newIndex = startIndex + 1;

                while (newIndex < lines.length) {
                    const nextLine = lines[newIndex];
                    if (nextLine === undefined) break; // break if the line is invalid
                    const nextParts = nextLine.split(" ");

                    if (nextParts[0] === undefined || nextParts[1] === undefined) break; // break if invalid

                    const moduleName = nextParts[0];
                    const version = nextParts[1];
                    // double checks bc since we split by spaces, "//indirect" won't be in same position as "// indirect"
                    const isIndirect = (nextParts[2] || "").includes("indirect") || (nextParts[3] || "").includes("indirect");
                    require[moduleName] = {
                        version: version,
                        indirect: isIndirect,
                        // running on assumptions is not great
                        // but eh i THINK these are the only go dep sources
                        src: moduleName.includes("golang.org") ? "pkg.go.dev" : "github",
                    };

                    newIndex++; // Move to the next line after processing
                }
                lines[startIndex] = "";
            }
        }

        if (!validate(module)) throw new FknError("Env__PkgFileUnparsable", `Given go.mod lacks module.\n${content}`);
        if (!validate(go)) throw new FknError("Env__PkgFileUnparsable", `Given go.mod lacks go version.\n${content}`);

        const toReturn: GolangPkgFile = {
            module,
            go,
            require,
        };

        if (!isObject(toReturn)) throw new FknError("Env__PkgFileUnparsable", "Given go.mod contents are unparsable.");

        return toReturn;
    },
    CargoPkgFile: (content: string): CargoPkgFile => {
        const toReturn = parseToml(content);

        if (!isObject(toReturn)) throw new FknError("Env__PkgFileUnparsable", "Given Cargo.toml contents are unparsable.");

        return toReturn;
    },
    NodeBunPkgFile: (content: string): NodePkgFile => {
        const toReturn = parseJsonc(content);

        if (!isObject(toReturn)) throw new FknError("Env__PkgFileUnparsable", "Given package.json contents are unparsable.");

        return toReturn as NodePkgFile;
    },
    DenoPkgFile: (content: string): DenoPkgFile => {
        const toReturn = parseJsonc(content);

        if (!isObject(toReturn)) throw new FknError("Env__PkgFileUnparsable", "Given deno.json/deno.jsonc contents are unparsable.");

        return toReturn as DenoPkgFile;
    },
};

export function dedupeDependencies(deps: FnCPF["deps"]): FnCPF["deps"] {
    return deps.filter((dep, index, self) => index === self.findIndex((d) => d.name === dep.name));
}

export const findDependency = (target: string, deps: FnCPF["deps"]): FnCPF["deps"][0] | undefined => {
    return deps.find((dep) =>
        normalize(dep.name, { strict: true, preserveCase: true, removeCliColors: true })
            === normalize(target, { strict: true, preserveCase: true, removeCliColors: true })
    );
};

// * ###
// * "END" THIS CODE SUCKS
// * ###

export const PackageFileParsers = {
    Golang: {
        STD: internalParsers.GolangPkgFile,
        CPF: (content: string, version: string | undefined, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.GolangPkgFile(content);

            const deps: FnCPF["deps"] = [];

            Object.entries(parsedContent.require ?? []).map(
                ([k, v]) => {
                    if (!v.src) {
                        throw new FknError(
                            "Env__PkgFileUnparsable",
                            `No source for Golang dependency ${v} (at module ${parsedContent.module}).`,
                        );
                    }
                    deps.push(
                        {
                            name: k,
                            ver: v.version,
                            rel: v.indirect === true ? "go:ind" : "univ:dep",
                            src: v.src,
                        },
                    );
                },
            );

            return {
                name: parsedContent.module,
                version: version === undefined ? "Unknown" : version,
                rm: "go",
                plat: {
                    edt: parsedContent.go,
                },
                ws,
                deps: dedupeDependencies(deps),
                fknVer: DenoJson.default.version,
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
                depsArray: FnCPFDependency[],
            ): void {
                if (!depsObject) return;
                Object.entries(depsObject).forEach(([k, _v]) => {
                    // typing is hard
                    const v: any = _v as any;
                    if (typeof v === "string") {
                        depsArray.push({
                            name: k,
                            ver: v,
                            rel: rValue,
                            src: "crates.io",
                        });
                        return;
                    }
                    if ((v as any)["path"]) {
                        const path = ParsePath(v["path"]);
                        depsArray.push({
                            name: k,
                            ver: "undefined",
                            rel: "rst:localD",
                            src: `rs-local://${path}`,
                        });
                        return;
                    }
                    if ((v as any)["git"]) {
                        depsArray.push({
                            name: k,
                            ver: "undefined",
                            rel: "rst:git",
                            src: `git:${v["branch"] ? `${v["branch"]}@` : ""}${v["git"]}` as any,
                        });
                        return;
                    }
                    if ((v as any)["url"]) {
                        depsArray.push({
                            name: k,
                            ver: "undefined",
                            rel: "rst:tar",
                            src: v["url"],
                        });
                        return;
                    }
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
                    : "unknown-name")
                    ?? "unknown-name";
            const version =
                (typeof parsedContent.package?.version === "string"
                    ? parsedContent.package?.version
                    : parsedContent.package?.version?.workspace === true
                    ? parsedContent.workspace?.package?.version
                    : "unknown-ver")
                    ?? "unknown-ver";
            const edt =
                (typeof parsedContent.package?.edition === "string"
                    ? parsedContent.package?.edition
                    : parsedContent.package?.edition?.workspace === true
                    ? parsedContent.workspace?.package?.edition
                    : null)
                    ?? null;

            return {
                name,
                version,
                rm: "cargo",
                plat: {
                    edt,
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: DenoJson.default.version,
            };
        },
    },
    NodeBun: {
        STD: internalParsers.NodeBunPkgFile,
        CPF: (content: string, rt: Exclude<MANAGER_JS, "deno">, ws: string[]): FnCPF => {
            const parsedContent = internalParsers.NodeBunPkgFile(content);

            const deps: FnCPF["deps"] = [];
            function processNodeDependencies(
                depsObject: NodePkgFile["dependencies"] | undefined,
                rValue: FnCPF["deps"][0]["rel"],
                depsArray: { name: string; ver: string; rel: string; src: string }[],
            ): void {
                Object.entries(depsObject ?? {}).map(([k, v]) => {
                    depsArray.push({ name: k, ver: v, rel: rValue, src: "npm" });
                });
            }
            processNodeDependencies(parsedContent.dependencies, "univ:dep", deps);
            processNodeDependencies(parsedContent.devDependencies, "univ:devD", deps);
            processNodeDependencies(parsedContent.peerDependencies, "js:peer", deps);

            return {
                name: parsedContent.name,
                version: parsedContent.version ?? "Unknown",
                rm: rt,
                plat: {
                    edt: null,
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: DenoJson.default.version,
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
                    t && t.groups && t.groups["package"] && t.groups["version"]
                    && validateAgainst(t.groups["source"], ["npm", "jsr"])
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
                name: parsedContent.name,
                version: parsedContent.version ?? "Unknown",
                rm: "deno",
                plat: {
                    edt: null,
                },
                deps: dedupeDependencies(deps),
                ws,
                fknVer: DenoJson.default.version,
            };
        },
    },
};
