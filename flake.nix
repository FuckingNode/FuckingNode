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
    version = "5.0.0";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos_arm";
    };


    sha256s = {
     "aarch64-linux" = "008dfrwvqa05pq5vgnadiisjfb2rcq77681fjzzy20pj1sn6a1xm";
     "x86_64-linux" = "1yald25yyy20rbsk7hc008gnifdn3vn26xribrw9mijrjrm985j4";
     "x86_64-darwin" = "0nj115daz51mc31xcjwwrqlfx3fqar9sa9amw05nqkaznacwfi90";
     "aarch64-darwin" = "18dm67xgvn03ssixw7idnmrxb1ps0a80zvpi5i44nf2447iz2g82";
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
      echo $version
      base_url="https://github.com/FuckingNode/FuckingNode/releases/download/$version"

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
