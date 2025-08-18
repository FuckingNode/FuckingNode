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

- [x] Use the same default threshold for all notifications, and lower it
- [ ] New settings
  - [x] Enable/disable notifications
  - [ ] Customizable thresholds
- [ ] Allow to use caret separation in every `Cmd` type of key, to run several commands.
- [ ] Use a character (idk, maybe `*` or `+`) to specify that a command is a _script_ and runs via `npm run (x)` or equivalent. Without it, default to running a shell command. (Or maybe vice versa, use the character to indicate a shell command. Will think about it.)
- [ ] Allow for spread commands, using --flags instead of plaintext for specific arguments, e.g. `fkn add path1 path2 path3` or `fkclean project1 project2 project3 --intensity=normal`.
- [ ] Proper self-updating?
  - A (hopefully) viable is to store the install/update shell command in a script file that also has a directive to kill a specific PID provided on invocation. Then have us to invoke this script passing our own PID, so it kills the process before updating. This is to avoid what made previous self-updating never work, you cannot modify the binary of a running process (my old self didn't knew 😭).
  - Disable this feature if installed via a package manager.

## Proper error fixing

- [ ] ReferenceError.
  - This is code-related. Now that I am adding a few tests I'm stumbling across ReferenceErrors because of problems with variable initialization? Maybe I'm stupid and am doing something very wrong (possibly) but for what I've seen, I have many circular imports leading to use of variables before Deno initializes them. If whenever I get one I move whatever export is not initialized to an individual file, it fixes. So if a commit randomly moves an export and changes 20 files because of it it's because of this.

## Performance

- [ ] Find places where parallel operation (`async + Promise.all`) is viable to improve performance.
  - Do _not_ parallelize cleanup, tho. Keep that for V5, as it implies severe rewriting.

## Chores & development

- [ ] **Actually write some f\*cking tests.** TDD is the way to go.
- [ ] Cleanup the codebase (it's getting kinda messy ngl).
  - [x] Remove audit tests. That's actually _the only feature that shouldn't have a test suite._
  - [ ] Fix Nix hashing.
  - [ ] Review all code to follow my own f\*cking guidelines, there are different ways of coding mixed up in the same project :skull: (this means updating old code to match `CONTRIBUTING.md`).
