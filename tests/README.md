# Test suite

This is FuckingNode's test suite. It's relatively small and doesn't cover most of the app, but we're trying to slowly extend coverage.

The `tests/environment` path contains "real" projects for some of the tests.

## Things to note

You should expect these things to happen. If they don't, something's wrong regardless of whether tests pass or not (they might pass despite this not happening).

- A system UI notification saying "I'm a test!" should show up.
- FuckingNode's website should launch in your browser.

Some tests might fail in any of these scenarios:

- Any of the supported package managers / runtimes is not locally installed.
