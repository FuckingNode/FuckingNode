# Benchmarks

These are not final, they'll be occasionally updated. Until V5 release they're subject to change.

## V5

| benchmark               | time/iter (avg) | iter/s | (min … max)           | p75      | p99      | p995     |
| ----------------------- | --------------- | ------ | --------------------- | -------- | -------- | -------- |
| lister                  | 10.0 ms         | 100.4  | ( 9.3 ms … 11.7 ms)   | 10.0 ms  | 11.7 ms  | 11.7 ms  |
| lister (ignored)        | 9.5 ms          | 105.5  | ( 9.3 ms … 9.9 ms)    | 9.6 ms   | 9.9 ms   | 9.9 ms   |
| remover                 | 2.1 ms          | 468.3  | ( 2.0 ms … 2.5 ms)    | 2.2 ms   | 2.5 ms   | 2.5 ms   |
| adder                   | 19.3 ms         | 51.9   | ( 18.6 ms … 20.3 ms)  | 19.6 ms  | 20.3 ms  | 20.3 ms  |
| bulk adder              | 38.3 ms         | 26.1   | ( 37.4 ms … 40.2 ms)  | 38.7 ms  | 40.2 ms  | 40.2 ms  |
| git check for repo      | 37.3 ms         | 26.8   | ( 34.2 ms … 38.2 ms)  | 37.8 ms  | 38.2 ms  | 38.2 ms  |
| git get branches        | 41.4 ms         | 24.2   | ( 39.2 ms … 42.6 ms)  | 41.9 ms  | 42.6 ms  | 42.6 ms  |
| git get latest tag      | 55.4 ms         | 18.1   | ( 53.0 ms … 57.1 ms)  | 56.1 ms  | 57.1 ms  | 57.1 ms  |
| name a project          | 252.3 µs        | 3,963  | (245.4 µs … 1.4 ms)   | 249.4 µs | 315.6 µs | 335.4 µs |
| get project env         | 8.7 ms          | 114.3  | ( 8.6 ms … 9.3 ms)    | 8.8 ms   | 9.3 ms   | 9.3 ms   |
| stats                   | 9.0 ms          | 111.3  | ( 8.8 ms … 9.4 ms)    | 9.0 ms   | 9.4 ms   | 9.4 ms   |
| report                  | 388.2 µs        | 2,576  | (362.5 µs … 945.7 µs) | 386.8 µs | 583.7 µs | 777.5 µs |
| simply execute the root | 334.9 ms        | 3.0    | (314.7 ms … 374.3 ms) | 337.5 ms | 374.3 ms | 374.3 ms |

## V4.3.0

| benchmark          | time/iter (avg) | iter/s | (min … max)           | p75      | p99      | p995     |
| ------------------ | --------------- | ------ | --------------------- | -------- | -------- | -------- |
| lister             | 180.5 ms        | 5.5    | (177.6 ms … 187.0 ms) | 181.3 ms | 187.0 ms | 187.0 ms |
| lister (ignored)   | 178.0 ms        | 5.6    | (173.8 ms … 181.6 ms) | 180.0 ms | 181.6 ms | 181.6 ms |
| remover            | 16.4 ms         | 60.8   | ( 15.9 ms … 18.0 ms)  | 16.7 ms  | 18.0 ms  | 18.0 ms  |
| adder              | 489.7 ms        | 2.0    | (485.7 ms … 496.9 ms) | 492.8 ms | 496.9 ms | 496.9 ms |
| bulk adder         | 56.4 ms         | 17.7   | ( 55.4 ms … 57.3 ms)  | 57.1 ms  | 57.3 ms  | 57.3 ms  |
| git check for repo | 34.7 ms         | 28.8   | ( 32.7 ms … 36.0 ms)  | 35.5 ms  | 36.0 ms  | 36.0 ms  |
| git get branches   | 33.9 ms         | 29.5   | ( 33.0 ms … 35.2 ms)  | 34.2 ms  | 35.2 ms  | 35.2 ms  |
| git get latest tag | 38.5 ms         | 26.0   | ( 36.4 ms … 41.5 ms)  | 39.3 ms  | 41.5 ms  | 41.5 ms  |
| name a project     | 10.1 ms         | 99.5   | ( 9.7 ms … 12.1 ms)   | 10.1 ms  | 12.1 ms  | 12.1 ms  |
| get project env    | 9.6 ms          | 104.1  | ( 9.3 ms … 10.8 ms)   | 9.7 ms   | 10.8 ms  | 10.8 ms  |
| stats              | 30.3 ms         | 33.0   | ( 29.8 ms … 31.8 ms)  | 30.5 ms  | 31.8 ms  | 31.8 ms  |
| report             | 24.7 ms         | 40.5   | ( 23.5 ms … 25.5 ms)  | 25.0 ms  | 25.5 ms  | 25.5 ms  |
