<!-- markdownlint-disable md033 md041-->
<p align="center">
  <a href="https://fuckingnode.github.io/">
    <img src="https://fuckingnode.github.io/fkn_logo.webp" alt="FuckingNode Logo" height=150>
    </a>
</p>
<h1 align="center">FuckingNode</h1>
<h3 align="center">The fucking chaos of maintaining JavaScript projects ends here</h3>

<div align="center">

[![stars](https://img.shields.io/github/stars/FuckingNode/FuckingNode)](https://github.com/FuckingNode/FuckingNode/stargazers) [![twitter](https://img.shields.io/twitter/follow/FuckingNode)](https://x.com/FuckingNode) [![discord](https://img.shields.io/discord/1333145935265398826)](https://discord.gg/AA2jYAFNmq) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/FuckingNode/FuckingNode)

</div>

<div align="center">

[Documentation](https://fuckingnode.github.io/manual) &nbsp;&nbsp;•&nbsp;&nbsp; [Issues](https://github.com/FuckingNode/FuckingNode/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp; [Roadmap](https://fuckingnode.github.io/roadmap)

</div>

### [Read the manual →](https://fuckingnode.github.io/manual)

[Watch here our **official low budget action trailer** →](https://youtube.com/watch?v=J675ZcYBrHM)

## What is "FuckingNode"?

FuckingNode is a CLI tool (not a CLI-ish npm package) that _automates_ **cleaning**, **linting**, and **prettifying** JS or TS projects, _simplifies_ **releasing** npm / jsr **packages**, **destroying generated artifacts & caches**, **(safely) making Git commits**, and _speeds up_ **cloning** and **starting up** your projects.

We may not be able to fix your bugs, but we are able to automate most headache-giving tasks across all of your NodeJS projects and give you a set of tools to make JS development great again. DenoJS, BunJS, and even Golang and Rust are also (partially) supported (_see [Cross-runtime support](https://fuckingnode.github.io/cross-platform/) for more info._).

So, TL;DR, it helps recover storage, reduce the risk of mistakes, and make your life easier.

It's not magic, it's **FuckingNode**—and yes, we're shipping _that_ name to production.

### Usage

```bash
fkn add < path >          # add a project to your project list
fkn clean                 # autoclean all of your projects
fkn clean < project >     # autoclean a specific project
fkn release < project >   # release a project, automatically
fkn commit < message >    # make a commit, safely
fkn kickstart < git-url > # clones it, installs deps, and launches your IDE
fkn launch < project >    # runs "npm run dev" and opens your IDE
# more commands exist!
fkn help                  # show it all
```

The standard command is `fuckingnode`, though `fkn` and `fknode` aliases are auto-added when downloading via a script installer. Command-specific aliases like `fkclean`, `fkadd`, `fkstart`, etc... do exist.

Refer to our [documentation](https://fuckingnode.github.io/) to learn about our motivation, all our features, and more.

---

## Installation

### Microsoft Windows

Copy and paste the following code in a terminal session.

```powershell
powershell -c "irm fuckingnode.github.io/install.ps1 | iex"
```

### Linux and macOS

Copy and paste the following code in a terminal session.

```bash
curl -fsSL fuckingnode.github.io/install.sh | bash
```

### Nix/NixOS

> [!NOTE]
> `x86_64-darwin` and `aarch64-darwin` support is available, but not tested. There is a possibility of it working, but there is no confirmation.

Add the repo to your `flake.nix`.

```nix
inputs = {
    ...
    fuckingnode.url = "github:FuckingNode/FuckingNode";
    ...
};
```

Then, add this to your system packages:

```nix
inputs.fuckingnode.packages."${pkgs.system}".default;
```

### Compile from source

Install [Deno 2](https://docs.deno.com/runtime/) and open this project from the root. You can now either run `deno task compile` and get the output executable from `dist/`, or run `deno -A src/main.ts [...commands]` from the root to test the CLI directly.

## Updates

Run `fkn upgrade` to check for updates; the CLI will immediately update itself if a newer version exists.

## Documentation

Refer to our [user manual](https://fuckingnode.github.io/manual) to learn everything about how to use FuckingNode.

---

We hope your motherfucking projects don't give you that much headache.

If you find any issue with the CLI, raise an issue (or make a PR which would be awesome :smile:).

Download FuckingNode now and go write some FuckingCool code.
