# Tasks

> [!TIP]
> These are all things I want to do.

## Workspaces and compatibility

- [x] Support in `fkadd` for basic globs, like `path/*` or `my-project-*`.
- [x] Work with lockfile-less projects.

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

### Golang

- [ ] `pkggen` is still missing.

## Better UX

- [x] Allow for DIR-based running; in simpler terms, compute things like `fkn stats` to `fkn stats --self` or `fkadd` to `fkadd --self`, so the `--self` flag isn't necessary (except for commands like `fkclean` where it does make sense to have it).

## Chores and trivial tasks

- [x] Rewrite audit to use JSON instead of raw strings (should've done this before...)
- [ ] Add error codes for all errors.
- [ ] Cleanup the codebase (it's getting kinda messy ngl).
  - [ ] Follow my own f\*cking guidelines, there are different ways of coding mixed up in the same project :skull: (this means updating old code to match `CONTRIBUTING.md`).
- [ ] Actually write some f\*cking tests.
