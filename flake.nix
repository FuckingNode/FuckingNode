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
    version = "5.2.0";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linuxArm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-mac64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macArm";
    };

    sha256s = {
      "aarch64-linux" = "1y34j62llsjwfkbxwj31vkycjkwkv2pnqycsr21wfa1596a69dac";
      "x86_64-linux" = "0d4izr7w58nlmkrzkylj3m8nkmaggk6dzqaaw8q6hbgjs1q87nsn";
      "x86_64-darwin" = "1r53dmrwva1xyzsilvkjfab94c83lcdmcmpfajp2nj5x26i4zxgc";
      "aarch64-darwin" = "1mkcprskc4q8y604zdyp5sfqinlifzmwvn6brfnbqavsnm9iy0qb";
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
        homepage = "https://fuckingnode.github.io/";
        license = pkgs.lib.licenses.gpl3;
        platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
        mainProgram = "fuckingnode";
      };
    };

    packages.hashes = pkgs.writeShellScriptBin "update_hashes" ''
      #!/usr/bin/env bash
      set -euo pipefail

      version="${version}"
      echo $version
      base_url="https://github.com/FuckingNode/FuckingNode/releases/download/${version}"

      declare -A urls=(
        ["x86_64-linux"]="$base_url/FuckingNode-linux64"
        ["aarch64-linux"]="$base_url/FuckingNode-linuxArm"
        ["x86_64-darwin"]="$base_url/FuckingNode-mac64"
        ["aarch64-darwin"]="$base_url/FuckingNode-macArm"
      )

      echo "sha256s = {"
      for platform in "''${!urls[@]}"; do
        url="''${urls[$platform]}"
        hash=$(nix-prefetch-url --type sha256 "$url" 2>/dev/null)
        printf '  "%s" = "%s";\n' "$platform" "$hash"
      done
      echo "};"
    '';

    devShell = pkgs.mkShell {
      buildInputs = [
        pkgs.deno
      ];
    };
  });
}
