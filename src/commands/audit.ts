import { APP_NAME } from "../constants.ts";
import { ColorString, LogStuff } from "../functions/io.ts";
import { GetAllProjects, NameProject } from "../functions/projects.ts";
import { PerformAuditing } from "./toolkit/auditer.ts";
import type { FkNodeSecurityAudit } from "../types/audit.ts";
import type { TheAuditerConstructedParams } from "./constructors/command.ts";
import { StringUtils } from "@zakahacecosas/string-utils";

export default function TheAuditer(params: TheAuditerConstructedParams) {
    const { project } = params;

    const shouldAuditAll = !StringUtils.validate(project) ||
        StringUtils.testFlag(project, "all", { allowQuickFlag: true, allowSingleDash: true, normalize: true }) ||
        StringUtils.normalize(project) === "--";

    if (shouldAuditAll) {
        const projects = GetAllProjects();
        LogStuff(
            `${APP_NAME.CASED} Audit is only supported for NodeJS projects as of now.`,
            "heads-up",
        );
        const report: {
            project: string;
            audit: FkNodeSecurityAudit;
        }[] = [];
        for (const project of projects) {
            const res = PerformAuditing(project);
            if (typeof res === "number") continue;
            report.push({
                project: project,
                audit: res,
            });
        }

        const reportDetails = report.map((item) => {
            const name = NameProject(item.project, "name-ver");
            const string = `${name} # ${ColorString(`${item.audit.percentage.toFixed(2)}%`, "bold")} risk factor`;
            return string;
        });
        console.log("");
        if (reportDetails.length > 0) {
            LogStuff(
                `Report\n${reportDetails.join("\n")}`,
                "chart",
            );
        } else {
            LogStuff("Not a single project has security issues. Great!\n", "tick");
        }
    } else {
        PerformAuditing(project);
    }

    LogStuff("Audit complete!", "tick-clear");
    LogStuff(
        ColorString(
            "Keep in mind our report simply can't be 100% accurate - the best option is always to fix vulnerabilities.",
            "italic",
        ),
        "heads-up",
    );
}
