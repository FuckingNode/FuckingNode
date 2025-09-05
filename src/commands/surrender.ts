import { normalize, reveal, type UnknownString, validate } from "@zakahacecosas/string-utils";
import { GetProjectEnvironment, RemoveProject } from "../functions/projects.ts";
import type { TheSurrendererConstructedParams } from "./constructors/command.ts";
import { Interrogate, LogStuff } from "../functions/io.ts";
import { APP_URLs, FULL_NAME } from "../constants.ts";
import { Commit, GetBranches, Push } from "../functions/git.ts";
import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { ColorString } from "../functions/color.ts";

const deprecationNotices: ((proj: string) => string)[] = [
    (p) =>
        `# This project is no longer maintained\n\nThis repository is archived and ${p} will not receive updates or bug fixes anymore. Sorry.`,
    (p) =>
        `# Deprecation notice\n\nThis project is deprecated and no longer actively supported. ${p} will not receive security patches or bug fixes anymore. **Use at your own risk.**`,
    (p) => `# ${p} is no longer supported\n\nDevelopment has ceased, and the ${p} project is no longer maintained.`,
    (p) => `# Project Sunset\n\n**${p} is being sunset**; it has reached the end of its lifecycle and will not receive further updates.`,
    (p) => `# End of Life notice\n\nThis project, **${p}** has reached *End of Life* (EOL). It is deprecated and thus no longer supported.`,
];

// TODO(@ZakaHaceCosas): make this into a jsr package or something, idk
function shuffle<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

export default async function TheSurrenderer(params: TheSurrendererConstructedParams): Promise<void> {
    const env = await GetProjectEnvironment(params.project);

    if (
        !Interrogate(
            `Are you 100% sure that ${env.names.full} ${ColorString("should be deprecated?\nThis is not something you can undo!", "orange")}`,
            "warn",
        )
    ) return;

    Deno.chdir(env.root);

    function valid(str: UnknownString): str is string {
        if (!validate(str)) return false;
        const normalized = normalize(str);
        return normalized !== "--" && normalized !== "-";
    }

    const alternatives = valid(params.alternative) ? `\n\nThe following alternative(s) are recommended: ${params.alternative.trim()}` : "";
    const note = valid(params.message) ? `\n\nThis note was left by the maintainer of this repository: ${params.message.trim()}` : "";
    const learnMore = valid(params.learnMoreUrl)
        ? `\n\nYou may find here additional information regarding **${env.main.cpf.name}**'s deprecation: ${params.learnMoreUrl.trim()}`
        : "";
    const bareMessage = shuffle(deprecationNotices)(env.main.cpf.name) + note
        + alternatives
        + learnMore
        + `\n\n###### This project was _automatically deprecated_ using the ${FULL_NAME} CLI utility (found at [this repo](${APP_URLs.REPO})), and this message was generated from a template. If something feels off, it might be because of that. Below proceeds the old README from this project, unedited.\n${
            "-".repeat(30)
        }`;
    const message = (params.gfm || params.glfm)
        ? `${params.gfm ? "> [!CAUTION]" : ">>> [!warning] Caution"}\n${
            bareMessage.split("\n").map((s) => params.gfm ? `> ${s}` : s).join("\n")
        }\n${params.glfm ? ">>>\n" : ""}`
        : bareMessage;

    if (
        !Interrogate(
            `(IMPORTANT) Here's what we'll do:\n- Commit ALL UNCOMMITTED changes to the CURRENTLY SELECTED branch AND PUSH them\n- Add a note to your project's README (see below)\n- Once we're sure all your code is pushed, locally DELETE ALL THE PROJECT's FILES\n${
                ColorString("Please confirm one last time that you wish to proceed", "bright-yellow")
            }.\n\n--- MESSAGE TO BE PREPENDED TO README.md ---\n${message}`,
            "heads-up",
        )
    ) return;

    await reveal("3,2,1.", 500);

    Commit(
        env.root,
        `Add all uncommitted changes (automated by ${FULL_NAME})`,
        "all",
        [],
    );

    const README = JoinPaths(env.root, "README.md");

    if (CheckForPath(README)) Deno.writeTextFileSync(README, `${message}\n${Deno.readTextFileSync(README)}`);

    Commit(
        env.root,
        `Add deprecation notice (automated by ${FULL_NAME})`,
        "all",
        [],
    );

    FkNodeInterop.Features.Update(env);

    Commit(
        env.root,
        `Update dependencies one last time (automated by ${FULL_NAME})`,
        "all",
        [],
    );

    Push(env.root, GetBranches(env.root).current);

    LogStuff("Project deprecated successfully, sir.", "comrade", "red");
    const rem = Interrogate(
        "If you DO want us to auto-remove the entire source code and node_modules from your local drive, hit 'y'. Hit 'n' otherwise (idk, you might want to keep the code as a memorial?)",
        "ask",
    );

    if (rem === true) {
        if (
            !Interrogate(
                "You cannot undo this. You should check that all commits were pushed successfully first. Once done, confirm again, please.",
                "warn",
            )
        ) return;
        Deno.removeSync(env.root, { recursive: true });
    }

    await RemoveProject(env.root);

    LogStuff(
        `${
            rem
                ? "Done. He will be missed."
                : "Okay. The deprecated source code is still where you left it."
        }\nYou should now head over to the GitHub repository -> Settings -> Archive, to make this even more official.\n\nPS. try harder next time; eventually you'll get a successful project that doesn't end up deprecated!`,
    );
}
