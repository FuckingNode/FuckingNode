import { type UnknownString, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { LogStuff } from "../../functions/io.ts";
import { FknError } from "../../functions/error.ts";

export const ALIASES: Record<string, (arg: string) => string> = {
    gh: (repo: string) => `https://github.com/${repo}.git`,
    gl: (repo: string) => `https://gitlab.com/${repo}.git`,
    bb: (repo: string) => `https://bitbucket.org/${repo}.git`,
    sr: (repo: string) => `https://sourceforge.net/p/${repo}.git`,
    bbp: (repo: string) => `https://bitbucket.org/${repo}/pipelines.git`,
    gist: (repo: string) => `https://gist.github.com/${repo}.git`,
    cb: (repo: string) => `https://codeberg.org/${repo}.git`,
    gt: (repo: string) => `https://gitee.com/${repo}.git`,
    fg: (repo: string) => `https://framagit.org/${repo}.git`,
    op: (repo: string) => `https://git.openprivacy.ca/${repo}.git`,
};

export function GenerateGitUrl(str: UnknownString): {
    full: string;
    name: string;
} {
    if (!validate(str)) throw new FknError("Param__WhateverUnprovided", "Git URL is required!");

    const gitUrlRegex = /^(https?:\/\/.*?\/)([^\/]+)(?:\.git)?$/;
    const regexMatch = str.match(gitUrlRegex);
    if (regexMatch && regexMatch[2]) {
        const splitted = str.split(".").filter((s) => s.trim() !== "");
        const userForgotDotGit = splitted[splitted.length - 1] !== "git";

        const splitIndex = validateAgainst(
                splitted[splitted.length - 1],
                [
                    "gi",
                    "g",
                    "gti",
                    "igt",
                    "itg",
                    "tig",
                ],
            )
            ? splitted.length - 1
            : splitted.length;

        const workingGitUrl = userForgotDotGit
            ? (splitted.splice(0, splitIndex).filter((s) => s.trim() !== "").join(".") + ".git")
            // still use .join() to handle repo..git or repo...git
            : splitted.join(".");

        const strictGitUrlRegex = /^(https?:\/\/.*?\/)([^\/]+)\.git$/;

        if (!strictGitUrlRegex.test(workingGitUrl)) {
            throw new FknError("Param__GitTargetInvalid", `${str} is not a valid Git URL!`);
        }
        if (userForgotDotGit) {
            LogStuff(
                "Psst... You forgot '.git' at the end. No worries, we can still read it.",
                "bruh",
                "italic",
            );
        }
        const splittedUrl = workingGitUrl
            .split("/");
        const twiceSplittedUrl = splittedUrl[splittedUrl.length - 1]!
            .split(".")!;
        const name = twiceSplittedUrl.splice(0, twiceSplittedUrl.length - 1).filter((s) => s.trim() !== "").join(".");
        return { full: workingGitUrl, name };
    }

    if (!str.includes(":")) throw new FknError("Param__GitTargetInvalid", "Git URL must be a valid URL or scope!");

    const [alias, repo] = str.split(":");

    if (!validate(alias)) throw new FknError("Param__GitTargetAliasInvalid", "Missing alias.");
    if (!validate(repo)) throw new FknError("Param__GitTargetAliasInvalid", "Missing repository.");

    if (!ALIASES[alias]) {
        throw new FknError(
            "Param__GitTargetAliasInvalid",
            `Alias '${alias}' is not recognized.\nValid aliases are ${
                Object.keys(ALIASES).join(", ")
            }.\nRun 'compat kickstart' to see where does each alias point to.`,
        );
    }

    const parts = repo.split("/");
    if (parts.length !== 2) throw new FknError("Param__GitTargetAliasInvalid", "Git shorthand must be in a 'owner/repo' format.");

    return GenerateGitUrl(ALIASES[alias](repo));
}
