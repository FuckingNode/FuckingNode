// this'll hopefully make it to the next major release
// HOPEFULLY

import { GetAppPath } from "../config.ts";
import { JoinPaths } from "../filesystem.ts";

interface FKNInstructionModule {
    ext: {
        main_name: string;
        main_fmt: "json" | "yaml" | "toml" | "xml" | "ini" | "matcher!";
        lock_name: string;
        rt_ident: string;
        rt_color: number;
        mgr_cmd: string;
        commands: {
            /** Exec, to run files. If null, mgr_cmd is directly used (cmd file). */
            exec: string[] | null;
            /** Run-a-script. If null, it's considered unsupported. */
            script: string[] | null;
            /** Dep update cmd. */
            update: string[];
            /** Clean cmds. If null, unsupported. */
            clean: string[][] | null;
            /** Audit cmd. If null, unsupported */
            audit: string[] | null;
            /** Package publish cmd. */
            publish: string[] | null;
        };
    };
    finder: {
        name: string;
        ver: string;
    };
    manifest: {
        name: string;
        ver: string;
        desc: string;
        implements: string[];
    };
    spec: string;
}

export function ParseFIM(ext: string): FKNInstructionModule {
    const s1 = ext.split("[FIM]")[1];
    if (!s1) throw `No step 1 ([FIM] declaration) in FuckingNode instruction module.`;
    const s2 = s1.split("[MSD]")[0];
    if (!s2) throw `No step 2 ([FIM]-[MSD] stuff) in FuckingNode instruction module.`;
    const s3 = s1.split("[MSD]")[1];
    if (!s3) throw `No step 3 ([MSD] declaration) in FuckingNode instruction module.`;
    const s4 = s1.split("[EXT]")[1];
    if (!s4) throw `No step 4 ([EXT] declaration) in FuckingNode instruction module.`;
    const s5 = s3.split("[EXT]")[0];
    if (!s5) throw `No step 5 ([MSD]-[EXT] stuff) in FuckingNode instruction module.`;

    const Extension = s2.trim();
    const _def = s5.trim().split("\n");
    const _spec = s4.trim().split("\n").pop();
    if (!_spec) throw `No #SPECIFICATION_VERSION specified at EOF-1.`;
    const spec = _spec.replace("#", "");
    const finder = Object.fromEntries(
        _def.map((s) => [s.split("|")[0]?.trim(), s.split("|")[1]?.trim()]),
    );

    return {
        ext: JSON.parse(Extension),
        finder,
        manifest: JSON.parse(s4.replace(/#\d+\.\d+\.\d+/, "")),
        spec,
    };
}

// exported for TS compiler to shut the hell up
export function GetKey(key: string, json: unknown): unknown {
    if (typeof json !== "object") throw `Cannot get KEY ${key}. JSON-ish object is not an actual object (${typeof json})`;
    if (!json || json === undefined) throw `Cannot get KEY ${key}. JSON-ish object is null or undefined.`;
    // deno-lint-ignore no-explicit-any
    let i = json as any;
    for (const k of key.split("/")) i = i[k];
    return i;
}

// GetKey("foo", "bar");
// await GetProjectEnvironment("tests/environment/nodes");

/** Returns all modules, using the ident file as the key. */
export async function GetNodes(): Promise<Record<string, FKNInstructionModule>> {
    const modPath = GetAppPath("NODES");
    const dir = await Array.fromAsync(Deno.readDir(modPath));

    const modules = await Promise.all(dir.map((s) => Deno.readTextFile(JoinPaths(modPath, s.name))));

    return Object.fromEntries(
        modules.map((m) => ParseFIM(m)).map((m) => [m.ext.main_name, m]),
    );
}
