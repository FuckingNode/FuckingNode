import { I_LIKE_JS } from "../constants.ts";
import { CheckForPath } from "../functions/filesystem.ts";
import { LogStuff } from "../functions/io.ts";
import { GetAllProjects, NameProject, SpotProject } from "../functions/projects.ts";
import type { TheCleanerConstructedParams } from "./constructors/command.ts";
import { PerformCleanup, PerformHardCleanup, PerformMaximCleanup, ResolveLockfiles, ShowReport, ValidateIntensity } from "./toolkit/cleaner.ts";
import type { CleanerIntensity } from "../types/config_params.ts";
import { GetElapsedTime } from "../functions/date.ts";

export type tRESULT = { path: string; status: string; elapsedTime: string };

export default function TheCleaner(params: TheCleanerConstructedParams) {
    // params
    const { verbose, update, lint, prettify, destroy, commit } = params.flags;
    const { intensity, project } = params.parameters;

    // original path
    const originalLocation = Deno.cwd();
    const realIntensity: CleanerIntensity = ValidateIntensity(intensity);

    if (realIntensity === "hard-only") {
        PerformHardCleanup(verbose);
        return;
    }

    // read all projects
    const projects: string[] = GetAllProjects();

    if (realIntensity === "maxim-only") {
        PerformMaximCleanup(projects);
        return;
    }

    if (projects.length === 0) {
        LogStuff(
            `There isn't any ${I_LIKE_JS.MF} over here... yet...`,
            "moon-face",
        );
        return;
    }

    LogStuff(
        `Cleaning started at ${new Date().toLocaleString()}\n`,
        "working",
        "bright-green",
        verbose,
    );

    const workingProjects = project === 0 ? projects : [SpotProject(project)];

    const results: tRESULT[] = [];

    for (const project of workingProjects) {
        // start time of each cleanup
        const startTime = new Date();

        if (!CheckForPath(project)) {
            LogStuff(
                `Path not found: ${project}. You might want to update your list of ${I_LIKE_JS.MFS}.`,
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

        try {
            Deno.chdir(project);

            const lockfiles = ResolveLockfiles(project);

            // TODO - readd preliminary status (basically showing '... # * protected' in report and a log warning for the user)

            if (lockfiles.length > 0) {
                if (lockfiles.length === 1) {
                    LogStuff(
                        `Cleaning the ${NameProject(project)} ${I_LIKE_JS.MF}...`,
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
                        verbose,
                    );
                } else {
                    LogStuff(
                        `More than one lockfile is a bad practice; we can't handle this ${I_LIKE_JS.MF}.`,
                        "error",
                        "bright-yellow",
                    );
                    results.push({
                        path: project,
                        status: "Too many lockfiles.",
                        elapsedTime: GetElapsedTime(startTime),
                    });
                    continue;
                }
            } else if (CheckForPath("package.json")) {
                LogStuff(
                    `${project} has a package.json but not a lockfile. Can't ${I_LIKE_JS.FKN} clean.`,
                    "warn",
                    "bright-yellow",
                );
                results.push({
                    path: project,
                    status: "No lockfile.",
                    elapsedTime: GetElapsedTime(startTime),
                });
                continue;
            } else {
                LogStuff(
                    `No supported lockfile was found at ${project}. Skipping this ${I_LIKE_JS.MF}...`,
                    "warn",
                    "bright-yellow",
                );
                results.push({
                    path: project,
                    status: "No package.json.",
                    elapsedTime: GetElapsedTime(startTime),
                });
                continue;
            }

            results.push({
                path: project,
                status: /* preliminaryStatus ? `Success # ${preliminaryStatus}` : */ "Success",
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

    if (realIntensity === "hard") PerformHardCleanup(verbose);
    if (realIntensity === "maxim") PerformMaximCleanup(workingProjects);

    // go back home
    Deno.chdir(originalLocation);
    LogStuff(
        `All your ${I_LIKE_JS.MFN} JavaScript projects have been cleaned! Back to ${originalLocation}.`,
        "tick",
        "bright-green",
    );
    if (verbose) ShowReport(results);
    return;
}
