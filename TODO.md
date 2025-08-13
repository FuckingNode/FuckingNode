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

### Golang

- [ ] `pkggen` is still missing.

## Features

- [ ] Dual release, so that the same package is released to both npm and jsr. Requires expanding the FnCPF spec.

## Better UX

- [ ] Use the same default threshold for all notifications, and lower it
- [ ] New settings
  - [ ] Enable/disable notifications
  - [ ] Customizable thresholds
- [ ] Allow to use caret separation in every `Cmd` type of key, to run several commands.
- [ ] Use a character (idk, maybe `*` or `+`) to specify that a command is a _script_ and runs via `npm run (x)` or equivalent. Without it, default to running a shell command. (Or maybe vice versa, use the character to indicate a shell command. Will think about it.)
- [ ] Allow for spread commands, using --flags instead of plaintext for specific arguments, e.g. `fkn add path1 path2 path3` or `fkclean project1 project2 project3 --intensity=normal`.
- [ ] Proper self-updating?
  - A (hopefully) viable is to store the install/update shell command in a script file that also has a directive to kill a specific PID provided on invocation. Then have us to invoke this script passing our own PID, so it kills the process before updating. This is to avoid what made previous self-updating never work, you cannot modify the binary of a running process (my old self didn't knew 😭).
  - Disable this feature if installed via a package manager.

## Proper error fixing

- [ ] Fix handling of command output.
  - The codebase mix piping and inheritance. _Piping it lets us store, use, and dump it (which is what we want), but doing that CLI-wide removes the ability to use live / verbose logs, making stuff look worse & more confusing. Inheriting it gives a better, more contextualized look, but is suboptimal._

  Intention is to pipe it everywhere. Doesn't look as good, but works better, which is what matters.

## Performance

- [ ] Find places where parallel operation (`async + Promise.all`) is viable to improve performance.
  - [ ] Do _not_ parallelize cleanup. Keep that for V5, as it implies severe rewriting.

## Chores & development

- [ ] **Actually write some f\*cking tests.** TDD is the way to go.
- [ ] Cleanup the codebase (it's getting kinda messy ngl).
  - [ ] Remove audit tests. That's actually _the only feature that shouldn't have a test suite._
  - [ ] Either fix Nix hashing or drop Nix support (preferably the 1st one).
  - [ ] Follow my own f\*cking guidelines, there are different ways of coding mixed up in the same project :skull: (this means updating old code to match `CONTRIBUTING.md`).
