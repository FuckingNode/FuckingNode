<!-- markdownlint-disable md033 md041-->
<p align="center">
  <a href="https://fuckingnode.github.io/">
    <img src="https://raw.githubusercontent.com/FuckingNode/fuckingnode.github.io/refs/heads/main/docs/fkn_logo_light.png" alt="FuckingNode Logo" height=150>
    </a>
</p>
<h1 align="center">The f*cking chaos of maintaining JavaScript projects ends here</h1>
<h3 align="center">Because dev life is messy enough</h3>

<div align="center">

[![stars](https://img.shields.io/github/stars/FuckingNode/FuckingNode)](https://github.com/FuckingNode/FuckingNode/stargazers) [![twitter](https://img.shields.io/twitter/follow/FuckingNode)](https://x.com/FuckingNode) [![discord](https://img.shields.io/discord/1333145935265398826)](https://discord.gg/AA2jYAFNmq)

</div>

<div align="center">

[Documentation](https://fuckingnode.github.io/manual) &nbsp;&nbsp;•&nbsp;&nbsp; [Issues](https://github.com/FuckingNode/FuckingNode/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp; [Roadmap](https://fuckingnode.github.io/roadmap)

</div>

### [Read the manual →](https://fuckingnode.github.io/manual)

[Watch here our **official low budget action trailer** :) →](https://youtube.com/watch?v=_lppvGYUXNk)

## What is FuckingNode?

We can't fix your bugs, but we can automate most headache-giving tasks across all of your NodeJS/Deno/Bun projects and give you a set of tools to make JS development great again.

DenoJS, BunJS, and even Golang and Rust are also (partially) supported (_see [Cross-runtime support](https://fuckingnode.github.io/cross-platform/) for more info._).

**FuckingNode is a CLI tool** (not a CLI-ish npm package) that automates and simplifies **cleaning**, **linting**, and **prettifying** JS or TS projects, **releasing** npm / jsr **packages**, **destroying generated artifacts & caches**, <!-- **understanding security audits**, --> and also gives you additional tools for better Git committing, project cloning, and more.

It's not magic, it's FuckingNode—and that name is shipping to production.

### Usage

```bash
fkn manager add < path >  # add a project to your project list
fkn clean                 # autoclean all of your projects
fkn clean < project >     # autoclean a specific project
fkn release < project >   # release a project, automatically
fkn commit < message >    # make a commit, safely
fkn kickstart < git-url > # clones a repo, installs deps, and launches your fav editor instantly
```

`fkn` and `fknode` aliases are auto-added when downloading via an `.sh` or `.ps1` installer. The standard command is `fuckingnode`, though.

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
> ARM (`aarch64-linux`) support is available, but NOT tested!

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

1. Install [Deno 2](https://docs.deno.com/runtime/).
2. Open this project from the root.

You can now either:

- Run `deno task compile` and get the output executable from `dist/`.
- Run `deno -A src/main.ts [...commands]` from the root.

## Updates

We auto-check for updates once every few days to tell you about new versions, and have an `upgrade` command so you can update the CLI whenever you want.

## Documentation

Refer to our [user manual](https://fuckingnode.github.io/manual) to learn everything about how to use FuckingNode.

---

We hope those motherf\*ckers don't annoy you again. If you find any issue with the CLI, open an issue, or make a PR (which would be awesome :smile:).

Cya!
