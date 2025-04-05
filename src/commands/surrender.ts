import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";
import { GetProjectEnvironment, RemoveProject, SpotProject } from "../functions/projects.ts";
import type { TheSurrendererConstructedParams } from "./constructors/command.ts";
import { ColorString, Interrogate, LogStuff } from "../functions/io.ts";
import { NameProject } from "../functions/projects.ts";
import { APP_URLs, FULL_NAME } from "../constants.ts";
import { Git } from "../functions/git.ts";
import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { FkNodeInterop } from "./interop/interop.ts";

const deprecationNotices = [
    "# This project is no longer maintained\n\nThis repository is archived and will not receive updates or bug fixes.",
    "# 🚨 Deprecation Notice\n\nThis project is deprecated and no longer actively supported. Use at your own risk.",
    "# 🛑 No Longer Supported\n\nDevelopment has ceased, and this project is no longer maintained.",
    "# ❗ Important: Project Deprecated\n\nThis repository is no longer maintained. Consider looking for alternatives.",
    "# ⚠️ Project Sunset\n\nThis project has reached the end of its lifecycle and will not receive further updates.",
    "# ⛔ Archived Repository\n\nThis project is no longer in active development and will not be updated.",
    "# 🚫 End of Life\n\nThis project has reached end of life, it is deprecated and thus no longer supported.",
    "# ❗ Deprecated Codebase\n\nThis project is outdated and should not be used for new developments.",
];

export default async function TheSurrenderer(params: TheSurrendererConstructedParams) {
    const project = SpotProject(params.project);

    if (
        !(Interrogate(
            `Are you 100% sure that ${NameProject(project, "all")} ${
                ColorString("should be deprecated?\nThis is not something you can really undo...", "orange")
            }`,
            "warn",
        ))
    ) return;

    const cwd = Deno.cwd();
    Deno.chdir(project);

    const valid = (str: UnknownString): str is string => {
        if (!StringUtils.validate(str)) return false;
        const normalized = StringUtils.normalize(str);
        return normalized !== "--" && normalized !== "-";
    };

    const alternatives = valid(params.alternative)
        ? `\n\nThe maintainer of this repository has provided the following alternative: ${params.alternative.trim()}`
        : "";
    const note = valid(params.message) ? `\n\nThis note was left by the maintainer of this repository: ${params.message.trim()}` : "";
    const learnMore = valid(params.learnMoreUrl)
        ? `\n\nYou may find here additional information regarding this project's deprecation: ${params.learnMoreUrl.trim()}`
        : "";
    const bareMessage = deprecationNotices[Math.floor(Math.random() * deprecationNotices.length)] + note + alternatives +
        learnMore +
        `\n\n###### This project was _automatically deprecated_ using the ${FULL_NAME} CLI utility (found at [this repo](${APP_URLs.REPO})), and this message was auto-generated based on their input - so if something feels off, it might be because of that. Below proceeds the old README from this project, unedited\n${
            "-".repeat(30)
        }`;

    const message = params.isGitHub ? `> [!CAUTION]\n${bareMessage.split("\n").map((s) => `> ${s}`).join("\n")}\n` : bareMessage;
    console.log("");
    const confirmation = Interrogate(
        `(IMPORTANT) Here's what we'll do:\n- Commit ALL UNCOMMITTED changes to the CURRENTLY SELECTED branch AND PUSH them\n- Add a note to your project's README (see below)\n- Once we're sure all your code is pushed, locally DELETE ALL THE PROJECT's FILES\n${
            ColorString("Please confirm one last time that you wish to proceed", "bright-yellow")
        }.\n\n--- MESSAGE TO BE PREPENDED TO README.md ---\n${message}`,
        "heads-up",
    );
    if (
        confirmation === false
    ) return;

    const commitOne = Git.Commit(
        project,
        `Add all uncommitted changes (automated by ${FULL_NAME})`,
        "all",
        [],
    );

    if (commitOne === 1) throw new Error("Error committing all not added changes.");

    const env = GetProjectEnvironment(project);

    const README = JoinPaths(env.root, "README.md");

    if (CheckForPath(README)) await Deno.writeTextFile(README, `${message}\n${await Deno.readTextFile(README)}`);

    const commitTwo = Git.Commit(
        project,
        `Add deprecation notice (automated by ${FULL_NAME})`,
        "all",
        [],
    );

    if (commitTwo === 1) throw new Error("Error committing README changes.");

    FkNodeInterop.Features.Update({ env, verbose: true });

    const commitThree = Git.Commit(
        project,
        "Update dependencies one last time",
        "all",
        [],
    );

    if (commitThree === 1) throw new Error("Error committing last dependency update.");

    const finalPush = Git.Push(project, (Git.GetBranches(project)).current);

    if (finalPush === 1) {
        throw new Error("Error pushing changes (ERROR SHOULD APPEAR ABOVE THIS, OPEN A GITHUB ISSUE OTHERWISE).");
    }

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
        if (!CheckForPath(env.root)) throw new Error(`Turns out the CLI cannot find the path to ${env.root}?`);
        Deno.removeSync(env.root, { recursive: true });
    }

    LogStuff(
        `${
            rem
                ? "Done. He will be missed."
                : "Okay. The deprecated source code is still where you left it."
        }\nYou should now head over to the GitHub repository -> Settings -> Archive, to make this even more official.\n\nPS. try harder next time; eventually you'll get a successful project that doesn't end up deprecated!`,
    );

    RemoveProject(project);

    Deno.chdir(cwd);
}
