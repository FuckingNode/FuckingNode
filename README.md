<!-- markdownlint-disable md033 md041-->
<!-- <p align="center">
  <a href="https://zakahacecosas.github.io/FuckingNode">
    <img src="LOGO HERE WHEN WE HAVE IT" alt="Logo" height=100>
    </a>
</p> -->
<h1 align="center">The f*cking chaos of maintaining JavaScript projects ends here</h1>
<h3 align="center">Because dev life is messy enough</h3>

<div align="center">

[![stars](https://img.shields.io/github/stars/ZakaHaceCosas/FuckingNode)](https://github.com/ZakaHaceCosas/FuckingNode/stargazers) [![twitter](https://img.shields.io/twitter/follow/FuckingNode)](https://x.com/FuckingNode)

</div>

<div align="center">

[Documentation](https://zakahacecosas.github.io/FuckingNode/manual) &nbsp;&nbsp;•&nbsp;&nbsp; [Issues](https://github.com/ZakaHaceCosas/FuckingNode/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp; [Roadmap](https://zakahacecosas.github.io/FuckingNode/roadmap)

</div>

### [Read the manual →](https://zakahacecosas.github.io/FuckingNode/manual)

[Watch here our **official low budget action trailer** :) →](https://youtube.com/watch?v=_lppvGYUXNk)

## What is FuckingNode?

We can't fix your bugs, but we can automate most headache-giving tasks across all of your NodeJS/Deno/Bun projects and give you a set of tools to make JS development great again.

DenoJS, BunJS, and even Golang and Rust are also (partially) supported (_see [Cross-runtime support](https://zakahacecosas.github.io/FuckingNode/cross-platform/) for more info._).

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
powershell -c "irm zakahacecosas.github.io/FuckingNode/install.ps1 | iex"
```

### Linux and macOS

Copy and paste the following code in a terminal session.

```bash
curl -fsSL zakahacecosas.github.io/FuckingNode/install.sh | bash
```

### NixOS

Add the repo to your `flake.nix`.

```nix
inputs = {
    fuckingnode.url = "github:ZakaHaceCosas/FuckingNode";
}
```

Then, add this to your system packages:

```nix
inputs.fuckingnode.packages."${pkgs.system}".default
```

### Compile from source

1. Install [Deno 2](https://docs.deno.com/runtime/).
2. Open this project from the root.

You can now either:

- Run `deno task compile` and get the output executable from `dist/`.
- Run `deno -A src/main.ts [...commands]` from the root.

## Updates

We auto-check for updates once every few days to tell you about new versions, and have an `upgrade` command so you can manually check for them. To update the CLI, simply re-run [your platform's install script](#installation) - all your data will stay in place.

## Documentation

Refer to our [user manual](https://zakahacecosas.github.io/FuckingNode/manual) to learn everything about how to use FuckingNode.

---

We hope those motherf\*ckers don't annoy you again. If you find any issue with the CLI, open an issue, or make a PR (which would be awesome :smile:).

Cya!
