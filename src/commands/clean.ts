import { FWORDS } from "../constants/fwords.ts";
import { CheckForPath } from "../functions/filesystem.ts";
import { LogStuff, Notification } from "../functions/io.ts";
import { GetAllProjects, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheCleanerConstructedParams } from "./constructors/command.ts";
import { PerformCleanup, PerformHardCleanup, PerformMaximCleanup, ShowReport, ValidateIntensity } from "./toolkit/cleaner.ts";
import type { CleanerIntensity } from "../types/config_params.ts";
import { GetElapsedTime } from "../functions/date.ts";

export type RESULT = {
    path: string;
    status: "Not found" | "Success" | "Partial success" | "Failed";
    elapsedTime: string;
    extras: undefined | {
        ignored?: string;
        failed?: string;
    };
};

export default async function TheCleaner(params: TheCleanerConstructedParams) {
    // params
    const { update, lint, prettify, destroy, commit } = params.flags;
    const { intensity, project } = params.parameters;

    const startup = new Date();
    const realIntensity: CleanerIntensity = ValidateIntensity(intensity);

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
        `Cleaning started at ${new Date().toLocaleString()}`,
        "working",
        "bright-green",
    );

    const results: RESULT[] = [];

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
                    extras: undefined,
                });
                continue;
            }

            Deno.chdir(project);

            console.log("");
            LogStuff(
                `Cleaning the ${NameProject(project)} ${FWORDS.MF}...`,
                "package",
            );
            const res = PerformCleanup(
                project,
                update,
                lint,
                prettify,
                destroy,
                commit,
                realIntensity,
            );

            const result: RESULT = {
                path: project,
                status: res.errors !== null ? "Partial success" : "Success",
                elapsedTime: GetElapsedTime(startTime),
                extras: undefined,
            };

            if (res.protection !== null) {
                result.extras = {
                    ignored: res.protection,
                };
            }
            if (res.errors !== null) {
                result.extras = {
                    ...result.extras,
                    failed: res.errors,
                };
            }

            results.push(result);
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
                extras: undefined,
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
    Notification(
        projects.length > 1 ? `All your ${FWORDS.MFN} projects have been cleaned!` : `Your ${FWORDS.MFN} project has been cleaned!`,
        `We did it! It took ${GetElapsedTime(startup)}. ${
            results.some((r) => (r.extras && r.extras.failed && r.extras.failed.trim().length > 0))
                ? "Errors happened, though. Check the report in your terminal session."
                : ""
        }`,
        elapsed,
    );
    ShowReport(results);
    return;
}
