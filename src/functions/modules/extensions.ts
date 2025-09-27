// i doubt this even makes it to the next major release, it looks SO complex...

import { replace, validate, validateAgainst } from "@zakahacecosas/string-utils";
import { toFileUrl } from "@std/path/to-file-url";
import { GetAllProjects } from "../projects.ts";

/** Runs a FuckingNode Extension Module */
export async function RunFEM(instructions: string): Promise<unknown> {
    const tmp = await Deno.makeTempFile({ suffix: ".fknode-ext.ts" });

    const ins = parseInstructions(instructions);

    await Deno.writeTextFile(
        tmp,
        ins,
    );

    return new Promise((resolve, reject) => {
        const worker = new Worker(
            toFileUrl(tmp),
            {
                type: "module",
                deno: { permissions: "none" },
            },
        );

        worker.onmessage = (e) => {
            const data = e.data;
            if (data.signal === "LOG") console.log(`[EXT] ${data.msg}`);
            if (data.signal === "TERM") {
                worker.terminate();
                resolve(data.result);
            }
        };

        worker.onerror = (err) => {
            worker.terminate();
            reject(err);
        };

        worker.postMessage({
            client: {
                ver: "5.0.0-dev",
                rt: Deno.version.deno,
            },
        });
    });
}

function parseInstructions(s: string): string {
    const args = s.trim().split("\n").filter(validate).map((s) => s.trim());
    if (args.shift() !== "[FEM]") throw `Not a FEM`;
    const messages: string[] = [];

    for (const arg of args) {
        const pref = arg.split(" ")[0];
        if (!pref) throw `ERROR: No pref on line idx ${args.indexOf(arg)}`;
        if (pref === "[LOG]") {
            const msg = arg.split(" ").slice(1).join(" ");
            if (!validate(msg)) continue;
            messages.push(
                `self.postMessage({
                    signal: "LOG",
                    msg: \`${
                    replace(msg, {
                        "~CLIENT/VER": "${ev.client.ver}",
                        "~CLIENT/RT": "${ev.client.rt}",
                    })
                }\`
                })`,
            );
        } else if (pref === "[GET]") {
            const query = arg.split(" ")[1];
            if (!validate(query)) continue;
            if (query === ":PROJECTS") {
                const spec = arg.split(" ")[2];
                if (!validateAgainst(spec, ["-", "limit", "exclude"])) continue;
                messages.push(
                    `const ${arg.split(" ")[3]?.replace(">", "")}: string[] = [${
                        GetAllProjects(spec === "-" ? false : spec).map((p) => `"${p.replace(/\\/g, "\\\\")}"`).join(", ")
                    }]\n`,
                );
            }
        }
    }

    return `
self.onmessage = (_ev) => {
    const ev = _ev.data;

    ${messages.join("\n")}

    self.postMessage({
        signal: "TERM",
    });
};
    `;
}

await RunFEM(
    Deno.readTextFileSync("./my-extension.fknode"),
);
