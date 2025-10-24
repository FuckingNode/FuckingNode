import { FknError } from "../../functions/error.ts";
import { deepMerge } from "../../functions/projects.ts";
import type { CargoDependency, CargoPkgFile, DenoPkgFile, FnCPF, GolangPkgFile, NodePkgFile } from "../../types/platform.ts";

const getNodeBunDeps = (cpf: FnCPF, desiredRel: FnCPF["deps"][0]["rel"]) => {
    return Object.fromEntries(
        cpf.deps.map((d) => {
            if (d.rel !== desiredRel) return "__REM";
            return [d.name, d.ver];
        }).filter((d) => d !== "__REM"),
    );
};

const getDenoDeps = (cpf: FnCPF) => {
    return Object.fromEntries(
        cpf.deps.map((d) => {
            // assuming
            // 1. deno deps can only be univ:dep
            // 2. deno deps can only be sourced from npm or jsr
            // 3. i think i built the FnCPF parser right and it keeps the @ of @scope/pkg, right?
            // i tested export at a random project (sokora) and it showed up, so i'll assume this works
            if (d.rel !== "univ:dep") return "__REM";
            return [d.name, `${d.src}:${d.name}@${d.ver}`]; // e.g. @ZakaHaceCosas/string-utils: "@ZakaHaceCosas/string-utils@^1.5.0"
        }).filter((d) => d !== "__REM"),
    );
};

// warning: this does not preserve additional data
const getCargoDeps = (cpf: FnCPF, desiredRel: FnCPF["deps"][0]["rel"]): Record<string, CargoDependency> => {
    return Object.fromEntries(
        cpf.deps.map((d) => {
            if (d.rel !== desiredRel) return "__REM";
            return [d.name, d.ver];
        }).filter((d) => d !== "__REM"),
    );
};

type ExtraProps<T> = T & Record<string, unknown>;

/**
 * Generates standard package files from a FnCPF.
 */
export const Generators: {
    NodeBun: (cpf: FnCPF, additionalParams?: object) => ExtraProps<NodePkgFile>;
    Deno: (cpf: FnCPF, additionalParams?: object) => ExtraProps<DenoPkgFile>;
    Golang: (cpf: FnCPF) => GolangPkgFile;
    Cargo: (cpf: FnCPF, additionalParams?: object) => ExtraProps<CargoPkgFile>;
} = {
    /** Generates a `package.json` from a FnCPF. */
    NodeBun: (cpf: FnCPF, additionalParams?: object): ExtraProps<NodePkgFile> => {
        const generatedPkgFile: ExtraProps<NodePkgFile> = {
            name: cpf.name,
            version: cpf.version,
            dependencies: getNodeBunDeps(cpf, "univ:dep"),
            devDependencies: getNodeBunDeps(cpf, "univ:devD"),
            peerDependencies: getNodeBunDeps(cpf, "js:peer"),
            workspaces: cpf.ws,
        };

        return deepMerge(generatedPkgFile, additionalParams);
    },
    /** Generates a `deno.json` from a FnCPF. */
    Deno: (cpf: FnCPF, additionalParams?: object): ExtraProps<DenoPkgFile> => {
        const generatedPkgFile: ExtraProps<DenoPkgFile> = {
            name: cpf.name,
            version: cpf.version,
            imports: getDenoDeps(cpf),
            workspaces: cpf.ws,
        };

        return deepMerge(generatedPkgFile, additionalParams);
    },
    Golang: (cpf: FnCPF): GolangPkgFile => {
        if (!cpf.plat.edt) {
            throw new FknError(
                "Env__PkgFileUnparsable",
                "Required parameter 'go 1.X.X' (CPF equiv: 'plat.edt') not present in FnCPF. Attempt to generate GolangPkgFile failed.",
            );
        }
        if (!cpf.name) {
            throw new FknError(
                "Env__PkgFileUnparsable",
                "Required parameter 'module X' (CPF equiv: 'name') not present in FnCPF. Attempt to generate GolangPkgFile failed.",
            );
        }

        return {
            module: cpf.name,
            go: cpf.plat.edt,
            require: Object.fromEntries(cpf.deps.map((d) => {
                if (d.src !== "pkg.go.dev" && d.src !== "github") {
                    throw new FknError(
                        "Env__PkgFileUnparsable",
                        `No source for Golang dependency ${d} (at module ${cpf.name}).`,
                    );
                }
                return [d.name, {
                    version: d.ver,
                    indirect: d.rel === "go:ind",
                    src: d.src,
                }];
            })),
        };
    },
    /** Generates a `Cargo.toml` from a FnCPF. */
    Cargo: (cpf: FnCPF, additionalParams?: object): ExtraProps<CargoPkgFile> => {
        const generatedPkgFile: ExtraProps<CargoPkgFile> = {
            "package": cpf.plat.edt
                ? {
                    name: cpf.name,
                    version: cpf.version,
                    edition: cpf.plat.edt,
                }
                : {
                    name: cpf.name,
                    version: cpf.version,
                },
            "dependencies": getCargoDeps(cpf, "univ:dep"),
            "dev-dependencies": getCargoDeps(cpf, "univ:devD"),
            "build-dependencies": getCargoDeps(cpf, "rst:buildD"),
            "workspace": { members: cpf.ws },
        };

        return deepMerge(generatedPkgFile, additionalParams);
    },
};
