# Tasks

> [!TIP]
> These are all things I want to do. Most tasks are major-release oriented, as patches just fix bugs and minors just bring in random improvements that come to my mind - or at least that's the idea.

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

## Better UX

- [ ] Allow for spread commands, using --flags instead of plaintext for specific arguments, e.g. `fkn add path1 path2 path3` or `fkclean project1 project2 project3 --intensity=normal`.
- [x] Proper self-updating.
  - [ ] Disable this feature if installed via a package manager.

## Chores & development

- [ ] **Actually write some f\*cking tests.** TDD is the way to go.
- [ ] Cleanup the codebase (it's getting kinda messy ngl).
  - [x] Remove audit tests. That's actually _the only feature that shouldn't have a test suite._
  - [x] Fix Nix hashing.
  - [ ] Review all code to follow my own f\*cking guidelines, there are different ways of coding mixed up in the same project :skull: (this means updating old code to match `CONTRIBUTING.md`).
