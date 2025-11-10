import { LogStuff } from "../functions/io.ts";
import { GetAllProjects } from "../functions/projects.ts";
import { PerformAuditing } from "./toolkit/auditer.ts";
import type { FkNodeSecurityAudit } from "../types/audit.ts";
import type { TheAuditerConstructedParams } from "./_interfaces.ts";
import { normalize, testFlag, validate } from "@zakahacecosas/string-utils";
import { bold, italic } from "@std/fmt/colors";

export default async function TheAuditer(params: TheAuditerConstructedParams): Promise<void> {
    const { project } = params;

    const shouldAuditAll = !validate(project)
        || testFlag(project, "all", { allowQuickFlag: true, allowSingleDash: true, allowNonExactString: true })
        || normalize(project) === "--";

    if (shouldAuditAll) {
        const projects = GetAllProjects();
        LogStuff(
            "Audit is only supported for NodeJS and BunJS projects as of now.",
            "heads-up",
        );
        const report: {
            project: string;
            audit: FkNodeSecurityAudit;
        }[] = [];
        for (const project of projects) {
            const res = await PerformAuditing(project);
            if (typeof res === "number") continue;
            report.push({
                project: project,
                audit: res,
            });
        }

        const reportDetails = report.map((item) => {
            const string = `${item.audit.name} # ${bold(`${item.audit.percentage.toFixed(2)}%`)} risk factor`;
            return string;
        });
        if (reportDetails.length === 0) {
            LogStuff("Not a single project has security issues. Great!", "tick-clear");
            return;
        }
        LogStuff(
            `Report\n${reportDetails.join("\n")}`,
            "chart",
        );
    } else {
        await PerformAuditing(project);
    }

    LogStuff("Audit complete!", "tick-clear");
    LogStuff(
        italic("Keep in mind our report simply can't be 100% accurate - the best option is always to fix vulnerabilities."),
        "heads-up",
    );
}
