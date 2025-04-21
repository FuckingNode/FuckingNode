# Tasks

> [!TIP]
> These are all things I want to do.

## Workspaces

- [ ] Support for globs, or however you call strings like `path/*` or `my-project-*`.
- [ ] Manage lockfile-less workspaces.

## Cross-runtime support

### Cargo

- [ ] Sources are MOSTLY `crates.io` but not always, may be local deps, Git-based deps, or remote tarball-based deps.

```toml
[dependencies]
# we understand this
from_crates = "1.0"
# we DON'T understand this
locally = { path = "../local_crate" }
from_git = { git = "https://github.com/FuckingNode/FuckingRust.git", branch = "dev" }
from_tarball = { url = "https://somewhere.com/some_crate-1.0.0.tar.gz" }
```

- [ ] Linting CAN be supported via a _glue fix_. The same we use on this repository, actually.

```js
// get files using a dir walking function or something
for (const file of files_in_project) {
    // something like this
    FkNodeInterop.Features.Lint(file);
}
```

### Golang

- [ ] `pkggen` is still missing.

### Deno

- [ ] Linting CAN be supported here too. Read [Cargo](#cargo) section to see what I mean.

## Chores and trivial tasks

- [X] Rewrite audit to use JSON instead of raw strings (should've done this before...)
- [ ] Add error codes for all errors.
- [ ] Cleanup the codebase (it's getting kinda messy ngl).
- [ ] [ ] Follow my own f\*cking guidelines, there are different ways of coding mixed up in the same project :skull: (this means updating old code to match `CONTRIBUTING.md`).
- [ ] ~~Actually write some f\*cking tests.~~ (not happening)
