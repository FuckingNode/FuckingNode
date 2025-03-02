import { FkNodeInterop } from "../src/commands/interop/interop.ts";
import { assertEquals } from "@std/assert";
import { VERSIONING } from "../src/constants.ts";
import { CONSTANTS } from "./constants.ts";
import { JoinPaths } from "../src/functions/filesystem.ts";
import type { FnCPF } from "../src/types/platform.ts";

Deno.test({
    name: "interop layer manages cargo pkg file",
    fn: async () => {
        const commonPkgFile = FkNodeInterop.PackageFileParsers.Cargo.CPF(
            await Deno.readTextFile(JoinPaths(CONSTANTS.INTEROP_PATH, "Cargo.toml")),
            [],
        );

        assertEquals(
            commonPkgFile,
            {
                name: "my_project",
                version: "0.1.0",
                rm: "cargo",
                perPlatProps: {
                    cargo: {
                        edition: "2021",
                    },
                },
                deps: [
                    { name: "serde", ver: "1.0", rel: "univ:dep", src: "crates.io" },
                    { name: "reqwest", ver: "0.11", rel: "univ:dep", src: "crates.io" },
                    { name: "tokio", ver: "1", rel: "univ:dep", src: "crates.io" },
                    { name: "criterion", ver: "0.3", rel: "univ:devD", src: "crates.io" },
                    { name: "mockito", ver: "0.31", rel: "univ:devD", src: "crates.io" },
                    { name: "bindgen", ver: "0.59", rel: "rst:buildD", src: "crates.io" },
                ],
                ws: [],
                internal: {
                    fknode: VERSIONING.APP,
                    fknodeCpf: "1.0.0",
                    fknodeIol: "1.0.0",
                },
            },
        );
    },
});

Deno.test({
    name: "interop layer manages golang pkg file",
    fn: async () => {
        const commonPkgFile = FkNodeInterop.PackageFileParsers.Golang.CPF(
            await Deno.readTextFile(JoinPaths(CONSTANTS.INTEROP_PATH, "go.mod")),
            "v1.1.0",
            [],
        );

        assertEquals(
            commonPkgFile,
            {
                name: "vuelto.pp.ua",
                version: "v1.1.0",
                rm: "golang",
                perPlatProps: { cargo: { edition: undefined } },
                deps: [
                    {
                        name: "github.com/faiface/beep",
                        ver: "v1.1.0",
                        rel: "univ:dep",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "github.com/go-gl/glfw/v3.3/glfw",
                        ver: "v0.0.0-20231124074035-2de0cf0c80af",
                        rel: "univ:dep",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "github.com/hajimehoshi/go-mp3",
                        ver: "v0.3.0",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "github.com/hajimehoshi/oto",
                        ver: "v0.7.1",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "github.com/pkg/errors",
                        ver: "v0.9.1",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "golang.org/x/exp",
                        ver: "v0.0.0-20190306152737-a1d7652674e8",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "golang.org/x/image",
                        ver: "v0.18.0",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "golang.org/x/mobile",
                        ver: "v0.0.0-20190415191353-3e0bab5405d6",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                    {
                        name: "golang.org/x/sys",
                        ver: "v0.17.0",
                        rel: "go:ind",
                        src: "pkg.go.dev",
                    },
                ],
                ws: [],
                internal: {
                    fknode: VERSIONING.APP,
                    fknodeCpf: "1.0.0",
                    fknodeIol: "1.0.0",
                },
            },
        );
    },
});

Deno.test({
    name: "interop layer manages node/bun CPF",
    fn: async () => {
        const commonPkgFile = FkNodeInterop.PackageFileParsers.NodeBun.CPF(
            await Deno.readTextFile(JoinPaths(CONSTANTS.INTEROP_PATH, "package.json")),
            "pnpm",
            [],
        );

        assertEquals(
            commonPkgFile,
            {
                name: "test",
                version: "0.59.123",
                rm: "pnpm",
                perPlatProps: { cargo: { edition: undefined } },
                deps: [
                    {
                        name: "eslint",
                        ver: "^7.32.0",
                        rel: "univ:dep",
                        src: "npm",
                    },
                    {
                        name: "typescript",
                        ver: "^4.4.3",
                        rel: "univ:devD",
                        src: "npm",
                    },
                    {
                        name: "react",
                        rel: "js:peer",
                        src: "npm",
                        ver: "^17.0.2",
                    },
                ],
                ws: [],
                internal: {
                    fknode: VERSIONING.APP,
                    fknodeCpf: "1.0.0",
                    fknodeIol: "1.0.0",
                },
            },
        );
    },
});

Deno.test({
    name: "interop layer manages deno CPF",
    fn: async () => {
        const commonPkgFile = FkNodeInterop.PackageFileParsers.Deno.CPF(
            await Deno.readTextFile(JoinPaths(CONSTANTS.INTEROP_PATH, "_deno.json")),
            [],
        );

        assertEquals(
            commonPkgFile,
            {
                name: "@zakahacecosas/string-utils",
                version: "1.7.0",
                rm: "deno",
                perPlatProps: { cargo: { edition: undefined } },
                deps: [
                    {
                        name: "@std/fs",
                        ver: "^1.0.10",
                        rel: "univ:dep",
                        src: "jsr",
                    },
                ],
                ws: [],
                internal: {
                    fknode: VERSIONING.APP,
                    fknodeCpf: "1.0.0",
                    fknodeIol: "1.0.0",
                },
            },
        );
    },
});

const PKGGEN_TEST_FNCPF: FnCPF = {
    name: "test",
    version: "0.59.123",
    rm: "npm",
    perPlatProps: {
        cargo: {
            edition: undefined,
        },
    },
    deps: [
        {
            name: "eslint",
            ver: "^7.32.0",
            rel: "univ:dep",
            src: "npm",
        },
        {
            name: "typescript",
            ver: "^4.4.3",
            rel: "univ:devD",
            src: "npm",
        },
    ],
    ws: [],
    internal: {
        fknode: VERSIONING.APP,
        fknodeCpf: VERSIONING.CPF,
        fknodeIol: VERSIONING.IOL,
    },
};

Deno.test({
    name: "pkggen module generates node/bun pkg file",
    fn: () => {
        assertEquals(
            FkNodeInterop.Generators.NodeBun(PKGGEN_TEST_FNCPF, {
                author: "me",
                license: "MIT",
            }),
            {
                name: "test",
                version: "0.59.123",
                author: "me",
                license: "MIT",
                dependencies: {
                    eslint: "^7.32.0",
                },
                devDependencies: {
                    typescript: "^4.4.3",
                },
                peerDependencies: {},
                workspaces: [],
            },
        );
    },
});

Deno.test({
    name: "pkggen module generates deno pkg file",
    fn: () => {
        assertEquals(
            FkNodeInterop.Generators.Deno(PKGGEN_TEST_FNCPF, {
                "lock": true,
            }),
            {
                name: "test",
                lock: true,
                version: "0.59.123",
                imports: {
                    eslint: "npm:eslint@^7.32.0",
                },
                workspaces: [],
            },
        );
    },
});

Deno.test({
    name: "pkggen module generates cargo pkg file",
    fn: () => {
        assertEquals(
            FkNodeInterop.Generators.Cargo(PKGGEN_TEST_FNCPF, {
                package: {
                    edition: "2021",
                },
            }),
            {
                package: {
                    name: "test",
                    version: "0.59.123",
                    edition: "2021",
                },
                "build-dependencies": {},
                // now this is fun, a rust project depending on typescript 4.4.3
                "dev-dependencies": {
                    typescript: "^4.4.3",
                },
                dependencies: {
                    eslint: "^7.32.0",
                },
                workspace: {
                    members: [],
                },
            },
        );
    },
});
