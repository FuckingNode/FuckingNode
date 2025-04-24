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
    version = "3.4.0";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos_arm";
    };


    sha256s = {
      "aarch64-linux" = "06w785csh0kvmry984s6ax5gb9nhkh47s8yyw018ga9i4h73rppp";
      "x86_64-linux" = "1r0gmhc7xpi5p7cbcbr9s1298wis3bhsq3nip7ykzd1ivbql3aif";
      "x86_64-darwin" = "1v9s1g90nhqxvbizfrzi70hzqm5124c5rfzy19cxh4g1w23dxi1v";
      "aarch64-darwin" = "00b02bb9mw83cza7sdra6akl2ravvyl2ndxlp0l14rbk38v5qa3x";
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
