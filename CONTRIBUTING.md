# Contributing

These are basic guidelines & info we hope you'll find useful for contributing to the project. For installer-script-related or documentation-related contributions, head to [this repository instead](https://github.com/FuckingNode/fuckingnode.github.io).

## Dev tools

1. Install [Deno (latest version)](https://deno.com) if you haven't. ~~Your welcome for not choosing that one JS runtime that we're trying to fix and that would fill up your disk with `node_modules/`~~.
2. Make a fork of the repo and clone it locally. You'll work from the default `master` branch.
3. Start writing code :smile:.
4. To test, run with `deno -A src/main.ts <args>` (e.g. `deno -A src/main.ts clean -- --verbose`).

## Making good contributions

You already know how this works.

1. Test your code before making a PR so nothing breaks.
2. Update the CHANGELOG to reflect what you did in a meaningful way.
3. If you add new functions, types, whatsoever, don't forget to use JSDoc so we all know what they do.
4. Ensure everything that can be typed is typed.

## Following our guidelines

We at F\*ckingNode want our code NOT to be F\*ckingUnreadable, hence we enforce some code style guidelines.

### Use these naming patterns

Functions, classes, ~~namespaces~~, and most types use `PascalCase`. E.g., `async function GetData(): Promise<UserData> {}`.

Variables use `camelCase`. E.g., `const userData = await GetData();`.

Reusable constants, debug-specific functions (like `DEBUG_LOG()`), and specific types use `CONSTANT_CASE`. E.g., `export const VERSION = "1.2.3"`.

### Spacing, trailing commas, and string delimitation

Use 4 spaces per indentation level. The commonly used 2 spaces convention gives - from our humble point of view - not enough space for code to breathe _for us_, as [despite our recommendation for nesting the least possible](#avoid-nesting), in some cases we can't avoid 6 or even more indentation levels, and need to make that readable.

Use trailing commas everywhere possible;.

Delimit strings using double quotes (`"`), or backticks for template literals. Never use single quotes.

### Type everything you should type

Explicitly type everything, except for primitive types and void / non-returning functions. Here:

```ts
export function GetUserDataSync() {
    // ...
}
export const SUPPORTED_PLATFORMS = ["win64", "linux64" /* ... */];
export const IS_BETA = false;
```

`GetUserDataSync()` likely returns an object which _should_ be typed. `SUPPORTED_PLATFORMS` returns a "strange" data structure, which _should_ be typed as well. `IS_BETA` however returns a simple, primitive boolean, so it _should not_ be typed.

### Import properly

Use the `type` keyword (`import type { SomeType } from "./somewhere.ts`) when importing types.

Import order doesn't matter, except on the entry point (`src/main.ts`). As soon as you open it you'll realize each app feature is imported _first_, and then, separated by a comment, the rest of imports needed by the entry point are present. If you're gigachad enough to contribute an entire new feature to the CLI (thank you btw!), ensure you place the import in the right spot.

### Declare functions properly

Wherever you get to choose between `const x = () => {}` and `function x() {}`, declare a function. There were some nerdy differences between each way of doing it, but functions do everything you need and use less characters, so prefer them.

"Wherever you get to choose" is said because, for example, in `someArray.map()`, you can't do `.map(function x() { /* stuff */ });`, so you'd have to use an arrow function (or directly pass a callback if possible).

Another case where you can't choose is function objects, like the `FkNodeInterop` module.

### Error handling

F\*ckingNode is wrapped in an error boundary (`GenericErrorHandler()`), so no need to try/catch every function. When throwing an error, `throw new Error()` is perfectly fine, however you'll see we sometimes use `FknError()` instead. It's a superset of `Error` with error codes and hints for our users. If you can and care, mind adding an error code and throwing a FknError instead.

Keep in mind the error boundary stops execution immediately. Places where you know an error might happen and want execution to continue somehow are the only places where you should use try/catch blocks.

### Comment in a readable manner

Both single and multiline comments are valid. Our only rule is:

```ts
/*
 * This works
 */

// this works
const hi = "hi, CONTRIBUTING.md reader!";

const bye = "bye, CONTRIBUTING.md reader!"; // THIS DOES NOT! NOT EVERYONE HAS A 4K MONITOR TO READ THIS COMMENT WITHOUT SCROLLING OR ENABLING LINE WRAP!
```

### Avoid nesting

Look at this mess (it's an example):

```ts
async function StartUp() {
    if (User.isAuthenticated) {
        if (User.isAdmin) {
            await handle_startup().then(async () => {
                await login("admin");
            });
        } else {
            await handle_startup().then(async () => {
                await login("user");
            });
        }
    } else {
        throw new Error("User ain't authenticated!");
    }
}
```

We could avoid nesting using `if` the smart 🗿 way:

```ts
async function StartUp() {
    if (!User.isAuthenticated) throw new Error("User ain't authenticated!");
    await startup();
    if (User.isAdmin) {
        await login("admin");
    } else {
        await login("user");
    }
}
```

We can avoid even another level by using ternary operators:

```ts
async function StartUp() {
    if (!User.isAuthenticated) throw new Error("User ain't authenticated!");
    await startup();
    await login(User.isAdmin ? "admin" : "user");
}
```

Got the idea? Use any method you can think of to ensure your code can be read like a normal text, with the least nesting possible.

### Know where to `switch` and where to `if`

Both statements do the same with one difference: `switch`es are more readable, `if`s are nested one level less. So, which one do we recommend?

The answer is simple: both, depending on (1) the amount of cases that can appear and (2) what makes more sense to use.

Places where _not too many_ cases are possible and/or an `else`/`default` statement would be used, should use `if else` directives, while cases where A LOT of options are possible and/or there isn't a "default" one, should use `switch`.

> Other than that, as long as your code doesn't suck, anything will do.

Thank you so much for contributing. Happy coding!
