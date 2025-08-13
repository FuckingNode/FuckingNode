import { FWORDS } from "../constants/fwords.ts";
import { CheckForPath } from "../functions/filesystem.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { GetAllProjects, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheCleanerConstructedParams } from "./constructors/command.ts";
import { PerformCleanup, PerformHardCleanup, PerformMaximCleanup, ShowReport, ValidateIntensity } from "./toolkit/cleaner.ts";
import type { CleanerIntensity } from "../types/config_params.ts";
import { GetElapsedTime } from "../functions/date.ts";

export type tRESULT = { path: string; status: string; elapsedTime: string };

export default async function TheCleaner(params: TheCleanerConstructedParams) {
    // params
    const { update, lint, prettify, destroy, commit } = params.flags;
    const { intensity, project } = params.parameters;

    const realIntensity: CleanerIntensity = ValidateIntensity(intensity);
    const startup = new Date();

    if (realIntensity === "hard-only") {
        await PerformHardCleanup();
        return;
    }

    // read all projects
    const projects = project === 0 ? GetAllProjects() : [SpotProject(project)];

    if (realIntensity === "maxim-only") {
        await PerformMaximCleanup(projects);
        return;
    }

    if (projects.length === 0) {
        LogStuff(
            `There isn't any ${FWORDS.MF} over here... yet...`,
            "moon-face",
        );
        return;
    }

    LogStuff(
        `Cleaning started at ${new Date().toLocaleString()}\n`,
        "working",
        "bright-green",
    );

    const results: tRESULT[] = [];

    for (const project of projects) {
        // start time of each cleanup
        const startTime = new Date();
        try {
            if (!CheckForPath(project)) {
                LogStuff(
                    `Path not found: ${project}. You might want to update your list of ${FWORDS.MFS}.`,
                    "error",
                    "red",
                );
                results.push({
                    path: project,
                    status: "Not found",
                    elapsedTime: GetElapsedTime(startTime),
                });
                continue;
            }

            Deno.chdir(project);

            // TODO - readd preliminary status (basically showing '... # * protected' in report and a log warning for the user)

            LogStuff(
                `Cleaning the ${NameProject(project)} ${FWORDS.MF}...`,
                "package",
            );
            PerformCleanup(
                project,
                update,
                lint,
                prettify,
                destroy,
                commit,
                realIntensity,
            );

            const status = "Success"; // preliminaryStatus ? `Success # ${preliminaryStatus}` : "Success";

            results.push({
                path: project,
                status,
                elapsedTime: GetElapsedTime(startTime),
            });
        } catch (e) {
            LogStuff(
                `Error while working around with ${NameProject(project, "name")}: ${e}`,
                "error",
                "red",
            );
            results.push({
                path: project,
                status: "Failed",
                elapsedTime: GetElapsedTime(startTime),
            });
            continue;
        }
    }

    if (realIntensity === "hard" || realIntensity === "maxim") await PerformHardCleanup();
    if (realIntensity === "maxim") await PerformMaximCleanup(projects);

    LogStuff(
        projects.length > 1 ? `All your ${FWORDS.MFN} projects have been cleaned!` : `Your ${FWORDS.MFN} project has been cleaned!`,
        "tick",
        "bright-green",
    );
    const elapsed = Date.now() - startup.getTime();
    if ((elapsed > 180000)) {
        Notification(
            projects.length > 1 ? `All your ${FWORDS.MFN} projects have been cleaned!` : `Your ${FWORDS.MFN} project has been cleaned!`,
            `It took ${GetElapsedTime(startup)}, but we did it!`,
        );
    }
    ShowReport(results);
    return;
}
