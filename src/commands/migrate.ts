import { normalize, validate } from "@zakahacecosas/string-utils";
import { FULL_NAME } from "../constants.ts";
import { GetDateNow, GetElapsedTime } from "../functions/date.ts";
import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { GetProjectEnvironment } from "../functions/projects.ts";
import type { MANAGER_JS, ProjectEnvironment } from "../types/platform.ts";
import type { TheMigratorConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { FknError } from "../functions/error.ts";

function handler(
    from: MANAGER_JS,
    to: MANAGER_JS,
    env: ProjectEnvironment,
): void {
    try {
        if (env.runtime === "golang" || env.runtime === "rust") {
            throw new FknError(
                "Internal__ImproperAssignment",
                "This shouldn't have happened (internal error) - NonJS environment assigned JS-only task (migrate).",
            );
        }

        LogStuff("Please wait (this will take a while)...", "working");

        LogStuff("Updating dependencies (1/6)...", "working");
        FkNodeInterop.Features.Update(env);

        LogStuff("Removing node_modules (2/6)...", "working");
        Deno.removeSync(env.hall_of_trash, {
            recursive: true,
        });

        Deno.chdir(env.root);

        // this is not 100% reliable, reading the lockfile is better
        // since straightforward reading it could cause issues (and ngl i'm a bit lazy)
        // even tho the promise was to "read the lockfile" what we'll do is
        // on step 6/6 run "update" to SYNC the lockfile and the pkg file
        // it technically complies our promise, as this command fixes
        // the lockfile being in slightly newer versions
        // and is way easier for me to write

        // i'm a damn genius
        LogStuff("Migrating versions from previous package file (3/6)...", "working");
        LogStuff("A copy will be made (package.json.bak), just in case", "wink");
        if (env.main.path.endsWith("jsonc")) {
            LogStuff(
                "Your deno.jsonc's comments (if any) WON'T be preserved in final package file, but WILL be present in the .bak file. Sorry bro.",
                "bruh",
            );
        }
        const newPackageFile = from === "deno"
            ? FkNodeInterop.Generators.Deno(
                env.main.cpf,
                env.main.std,
            )
            : FkNodeInterop.Generators.NodeBun(
                env.main.cpf,
                env.main.std,
            );
        Deno.writeTextFileSync(
            JoinPaths(env.root, `${env.main.name}.jsonc.bak`),
            `// This is a backup of your previous project file. We (${FULL_NAME}) overwrote it at ${GetDateNow()}.\n${
                JSON.stringify(env.main.std)
            }`,
        );
        Deno.writeTextFileSync(
            env.main.path,
            JSON.stringify(newPackageFile),
        );

        LogStuff("Making a backup of your previous lockfile (4/6)...", "working");
        if (env.lockfile.path) {
            if (env.lockfile.name === "bun.lockb" && CheckForPath(JoinPaths(env.root, "bun.lock"))) {
                // handle case where bun.lockb was replaced with bun.lock
                Deno.renameSync(env.lockfile.path, JoinPaths(env.root, "bun.lockb.bak"));
                LogStuff(
                    "Your bun.lockb file will be backed up and replaced with a text-based lockfile (bun.lock).",
                    "bruh",
                );
            } else {
                Deno.writeTextFileSync(
                    JoinPaths(env.root, `${env.lockfile.name}.bak`),
                    Deno.readTextFileSync(env.lockfile.path),
                );
            }
            Deno.removeSync(env.lockfile.path);
        } else {
            LogStuff("No lockfile found, skipping backup.", "warn");
        }

        LogStuff("Installing modules with the desired manager (5/6)...", "working");
        FkNodeInterop.Installers.UniJs(env.root, to);

        LogStuff("Updating to ensure lockfile consistency (6/6)...", "working");
        FkNodeInterop.Features.Update(env);
    } catch (e) {
        LogStuff(`Migration threw an: ${e}`, "error");
    }
}

export default async function TheMigrator(params: TheMigratorConstructedParams): Promise<void> {
    const { projectPath, wantedManager } = params;
    const startup = new Date();

    if (!validate(wantedManager)) {
        throw new FknError(
            "Param__TargetInvalid",
            "No target (pnpm, npm, yarn, deno, bun) specified.",
        );
    }

    const desiredManager = normalize(wantedManager);

    const MANAGERS = ["pnpm", "npm", "yarn", "deno", "bun"];
    if (!MANAGERS.includes(normalize(desiredManager))) {
        throw new FknError(
            "Param__TargetInvalid",
            "Target isn't a valid package manager. Only JS environments (NodeJS, Deno, Bun) support migrate.",
        );
    }

    const workingEnv = await GetProjectEnvironment(projectPath);

    if (!MANAGERS.includes(workingEnv.manager)) {
        throw new FknError(
            "Interop__MigrateUnable",
            `${workingEnv.manager} is not a runtime we can migrate from. Only JS environments (NodeJS, Deno, Bun) support migrate.`,
        );
    }

    // TODO(@ZakaHaceCosas): does GPE even validate this
    // if it does, remove this
    // if it doesn't, make it do, then remove this
    if (!(CheckForPath(workingEnv.main.path))) {
        throw new FknError(
            "Env__NoPkgFile",
            "No package.json/deno.json(c) file found, cannot migrate. How will we install your modules without that file?",
        );
    }

    LogStuff(
        `Migrating ${workingEnv.names.full} to ${desiredManager} has a chance of messing your versions up.\nYour lockfile will be backed up and synced to ensure coherence.`,
        "warn",
    );

    handler(
        workingEnv.manager as MANAGER_JS,
        desiredManager as MANAGER_JS,
        workingEnv,
    );

    LogStuff(`That worked out! Enjoy using ${desiredManager} for ${workingEnv.names.full}`);
    const elapsed = Date.now() - startup.getTime();
    Notification(
        `Your project was migrated!`,
        `From ${workingEnv.manager} to ${desiredManager}, all set! It took ${GetElapsedTime(startup)}.`,
        elapsed,
    );

    return;
}
