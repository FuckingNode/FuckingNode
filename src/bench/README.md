# Benchmarks

Benchmarks were taken on the last commit of each tag.

## V5.0.0

| benchmark               | time/iter (avg) | iter/s | (min … max)           | p75      | p99      | p995     |
| ----------------------- | --------------- | ------ | --------------------- | -------- | -------- | -------- |
| lister                  | 62.9 ms         | 15.9   | ( 59.5 ms … 69.2 ms)  | 64.9 ms  | 69.2 ms  | 69.2 ms  |
| lister (ignored)        | 62.4 ms         | 16.0   | ( 59.0 ms … 66.6 ms)  | 65.1 ms  | 66.6 ms  | 66.6 ms  |
| remover                 | 3.3 ms          | 301.0  | ( 2.8 ms … 4.3 ms)    | 3.5 ms   | 4.3 ms   | 4.3 ms   |
| adder                   | 23.1 ms         | 43.4   | ( 21.4 ms … 26.5 ms)  | 23.3 ms  | 26.5 ms  | 26.5 ms  |
| bulk adder              | 41.7 ms         | 24.0   | ( 37.4 ms … 49.8 ms)  | 44.7 ms  | 49.8 ms  | 49.8 ms  |
| git check for repo      | 56.6 ms         | 17.6   | ( 54.7 ms … 58.3 ms)  | 57.4 ms  | 58.3 ms  | 58.3 ms  |
| git get branches        | 61.0 ms         | 16.4   | ( 59.1 ms … 63.6 ms)  | 62.1 ms  | 63.6 ms  | 63.6 ms  |
| git get latest tag      | 79.9 ms         | 12.5   | ( 75.9 ms … 88.5 ms)  | 80.8 ms  | 88.5 ms  | 88.5 ms  |
| name a project          | 284.0 µs        | 3,522  | (246.8 µs … 32.5 ms)  | 252.2 µs | 327.3 µs | 512.7 µs |
| get project env         | 8.9 ms          | 112.4  | ( 8.6 ms … 10.6 ms)   | 9.0 ms   | 10.6 ms  | 10.6 ms  |
| stats                   | 9.1 ms          | 109.7  | ( 8.9 ms … 10.1 ms)   | 9.2 ms   | 10.1 ms  | 10.1 ms  |
| report                  | 373.1 µs        | 2,680  | (344.5 µs … 1.0 ms)   | 376.3 µs | 591.9 µs | 737.1 µs |
| simply execute the root | 320.4 ms        | 3.1    | (311.6 ms … 334.7 ms) | 326.7 ms | 334.7 ms | 334.7 ms |

## V4.3.0

| benchmark               | time/iter (avg) | iter/s | (min … max)           | p75      | p99      | p995     |
| ----------------------- | --------------- | ------ | --------------------- | -------- | -------- | -------- |
| lister                  | 94.9 ms         | 10.5   | ( 92.0 ms … 100.2 ms) | 96.5 ms  | 100.2 ms | 100.2 ms |
| lister (ignored)        | 93.9 ms         | 10.7   | ( 91.6 ms … 98.3 ms)  | 94.4 ms  | 98.3 ms  | 98.3 ms  |
| remover                 | 24.7 ms         | 40.5   | ( 17.6 ms … 69.6 ms)  | 21.5 ms  | 69.6 ms  | 69.6 ms  |
| adder                   | 400.7 ms        | 2.5    | (238.8 ms … 921.3 ms) | 353.3 ms | 921.3 ms | 921.3 ms |
| bulk adder              | 128.5 ms        | 7.8    | ( 82.4 ms … 310.5 ms) | 118.2 ms | 310.5 ms | 310.5 ms |
| git check for repo      | 100.9 ms        | 9.9    | ( 58.0 ms … 137.4 ms) | 118.1 ms | 137.4 ms | 137.4 ms |
| git get branches        | 132.1 ms        | 7.6    | ( 83.3 ms … 203.5 ms) | 147.4 ms | 203.5 ms | 203.5 ms |
| git get latest tag      | 156.2 ms        | 6.4    | ( 89.8 ms … 333.3 ms) | 178.2 ms | 333.3 ms | 333.3 ms |
| name a project          | 40.4 ms         | 24.8   | ( 13.8 ms … 78.7 ms)  | 54.2 ms  | 78.7 ms  | 78.7 ms  |
| get project env         | 20.9 ms         | 48.0   | ( 10.9 ms … 36.9 ms)  | 28.4 ms  | 36.9 ms  | 36.9 ms  |
| stats                   | 103.1 ms        | 9.7    | ( 56.5 ms … 164.0 ms) | 111.3 ms | 164.0 ms | 164.0 ms |
| report                  | 89.1 ms         | 11.2   | ( 47.8 ms … 139.5 ms) | 117.6 ms | 139.5 ms | 139.5 ms |
| simply execute the root | 2.2 s           | 0.5    | ( 1.0 s … 3.3 s)      | 2.8 s    | 3.3 s    | 3.3 s    |

## What we did to make V5 faster

- FuckingNode runs some checks every time before actually running. _Just_ parallelizing them made the entire CLI much, MUCH faster.
- Bulk adding projects (via glob patterns) was also parallelized. Made it 5% faster.
- Git-related and project environment-related operations used to check for filepaths _twice_, this duplication was removed.
  - For example, checking if a project has an active Git repo is now over 10 times faster.
- Optimized config filepaths.
  - Removed a useless lowercasing call when getting any path.
  - A string conversion needed for the project's list file happened whenever _any_ path was queried, now it only happens when we query that specific file.
  - All paths were initialized when querying any path, now only the base one (needed) is.
- Removed useless file existence checks where we already know a file exists.
- Removed some useless object mutations.
- "Naming a project" (when we show its name with colors and stuff) is actually a somewhat expensive operation. We slightly optimized it + removed duplicate calls.
  - Where possible, the overhead was moved to getting a project's environment (as otherwise this is done _twice_ from the naming flow), reducing workload. Not everywhere we can do this, though.
- `settings flush` should now be a few milliseconds faster (removed useless array check + parallelized filesize recovery calculations).
- Avoided unnecessary checks for spotting project paths.
- Removed duplicate calls to check for staged files via `commit`.
- Removed `logs.log`, removing a ton of file writes.
- Parallelized reading cleanup results for showing you the final report, very slightly speeding it up.
- Removed unnecessary array conversions and operations for parsing a project's `divineProtection` setting, as well as avoiding parsing entirely if the setting is not defined.
- Differentiating certain frequently queried settings (like on what runtime a project runs, for compatibility) was actually done through somewhat expensive operation with "sentinel strings" (`#disable`(cmd), `__DISABLE`(cfg), `__USE_DEFAULT`(cfg), and other values you could actually set in your `fknode.yaml`). They were replaced with proper type guards + strings were replaced with booleans (primitives, more efficient), as such slightly improving performance.
- Update some strings so they don't "name the project", reducing operations.
- Parallelized workspace lookup when adding a project.
- Optimized I/O, there were operations making several calls to `console.log`, when a single call (with `\n`s) is more efficient.
- Also removed useless `String.trim()` calls.
- Remove duplicate and unused properties from project environment objects.
