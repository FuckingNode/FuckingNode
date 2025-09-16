import { LogStuff, Notification } from "../functions/io.ts";
import { GetAllProjects, GetProjectEnvironment } from "../functions/projects.ts";
import type { TheCleanerConstructedParams } from "./constructors/command.ts";
import { PerformCleanup, PerformHardCleanup, PerformMaximCleanup, ShowReport, ValidateIntensity } from "./toolkit/cleaner.ts";
import type { CleanerIntensity } from "../types/config_params.ts";
import { GetElapsedTime } from "../functions/date.ts";

export type RESULT = {
    name: string;
    status: "Not found" | "Success" | "Partial success" | "Failed";
    elapsedTime: string;
    extras: undefined | {
        ignored: string | null;
        failed: string | null;
    };
};

export default async function TheCleaner(params: TheCleanerConstructedParams): Promise<void> {
    // params
    const { update, lint, prettify, destroy, commit } = params.flags;
    const { intensity, project } = params.parameters;

    const startup = new Date();
    const realIntensity: CleanerIntensity = ValidateIntensity(intensity);

    if (realIntensity === "hard-only") {
        PerformHardCleanup();
        return;
    }

    // read all projects
    const projects = project === 0 ? GetAllProjects() : [project];

    if (realIntensity === "maxim-only") {
        await PerformMaximCleanup(projects);
        return;
    }

    if (projects.length === 0) {
        LogStuff(
            "There isn't any motherfucker over here... yet...",
            "moon-face",
        );
        return;
    }

    LogStuff(
        `Cleaning started at ${new Date().toLocaleString()}\n`,
        "working",
        "bright-green",
    );

    const results: RESULT[] = [];

    for (const project of projects) {
        // start time of each cleanup
        const startTime = new Date();
        const env = await GetProjectEnvironment(project);
        const projectName = env.names.nameVer;
        try {
            Deno.chdir(project);

            LogStuff(
                `Cleaning the ${projectName} motherfucker...`,
                "package",
            );
            const res = PerformCleanup(
                update,
                lint,
                prettify,
                destroy,
                commit,
                realIntensity,
                env,
            );

            const result: RESULT = {
                name: projectName,
                status: res.errors !== null ? "Partial success" : "Success",
                elapsedTime: GetElapsedTime(startTime),
                extras: {
                    ignored: res.protection,
                    failed: res.errors,
                },
            };

            results.push(result);
        } catch (e) {
            LogStuff(
                `Error while working around with ${projectName}: ${e}\n`,
                "error",
                "red",
            );
            results.push({
                name: projectName,
                status: "Failed",
                elapsedTime: GetElapsedTime(startTime),
                extras: undefined,
            });
            continue;
        }
    }

    if (realIntensity === "hard" || realIntensity === "maxim") PerformHardCleanup();
    if (realIntensity === "maxim") await PerformMaximCleanup(projects);

    LogStuff(
        projects.length > 1 ? `All your motherfucking projects have been cleaned!` : `Your motherfucking project has been cleaned!`,
        "tick",
        "bright-green",
    );
    const elapsed = Date.now() - startup.getTime();
    Notification(
        projects.length > 1 ? `All your motherfucking projects have been cleaned!` : `Your motherfucking project has been cleaned!`,
        `We did it! It took ${GetElapsedTime(startup)}.${
            results.some((r) => (r.extras && r.extras.failed && r.extras.failed.trim().length > 0))
                ? " Errors happened, though. Check the report in your terminal session."
                : ""
        }`,
        elapsed,
    );
    ShowReport(results);
    return;
}
