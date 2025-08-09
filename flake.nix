{
  description = "FuckingNode Package";

  inputs = {
    nixpkgs.url = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
  flake-utils.lib.eachDefaultSystem (system:
  let
    pkgs = import nixpkgs { inherit system; };

    pname = "fuckingnode";
    version = "4.0.1";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos_arm";
    };


    sha256s = {
     "aarch64-linux" = "1k12jsbng9v7hzpcyfgkq9ga1magxlf2m46gs0x1lwlgw34f1znc";
     "x86_64-linux" = "12pm08y8d20y40mfzxhn8pqbmh681bnrjzfm7nckj2z23zgj2dgx";
     "x86_64-darwin" = "08wzjaka5fvbpkniaislv72kavc0bdfdmyrikn7xca72ci5xdvim";
     "aarch64-darwin" = "0yhhzznfdx7hzk94wjva6g0iwqa08mq86vw8q9bvmm7cjmaphkgg";
    };

  in {
    packages.default = pkgs.stdenv.mkDerivation {
      inherit pname version;

      src = pkgs.fetchurl {
        url = urls.${system};
        sha256 = sha256s.${system};
      };

      phases = [ "installPhase" "fixupPhase" ];
      nativeBuildInputs = [ pkgs.makeWrapper pkgs.bash ];

      installPhase = ''
        mkdir -p $out/bin
        cp $src $out/bin/fuckingnode
      '';

      fixupPhase = ''
        chmod +x $out/bin/fuckingnode
      '';

      meta = {
        description = "FuckingNode CLI tool";
        homepage = "https://github.com/FuckingNode/FuckingNode";
        license = pkgs.lib.licenses.mit;
        platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
        mainProgram = "fuckingnode";
      };
    };

    packages.hashes = pkgs.writeShellScriptBin "update_hashes" ''
      #!/usr/bin/env bash
      set -euo pipefail

      version="${version}"
      base_url="https://github.com/FuckingNode/FuckingNode/releases/download/$version"

      declare -A urls=(
        ["x86_64-linux"]="$base_url/FuckingNode-linux64"
        ["aarch64-linux"]="$base_url/FuckingNode-linux_arm"
        ["x86_64-darwin"]="$base_url/FuckingNode-macos64"
        ["aarch64-darwin"]="$base_url/FuckingNode-macos_arm"
      )

      echo "  sha256s = {"
      for platform in "''${!urls[@]}"; do
        url="''${urls[$platform]}"
        hash=$(nix-prefetch-url --type sha256 "$url" 2>/dev/null)
        printf '    "%s" = "%s";\n' "$platform" "$hash"
      done
      echo "  };"
    '';

    devShell = pkgs.mkShell {
      buildInputs = [
        pkgs.deno
      ];
    };
  });
}
