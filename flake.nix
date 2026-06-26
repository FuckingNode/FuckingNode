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
    version = "5.4.0";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linuxArm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-mac64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macArm";
    };

    sha256s = {
      "aarch64-linux" = "1nz6wdns7a4jhs9dxrkw4rrxmqylbap4nxdk6m5jfxrikyc150zp";
      "x86_64-linux" = "13mzx9karm2ymxlx96jc180xz99x2zc1z34ylhdw997mfg6x2dx5";
      "x86_64-darwin" = "14xcasby2qrf0h87xnahx5cg8d6sjz320f2kjiq94m2aqka0xf78";
      "aarch64-darwin" = "0fidjqm8q1x9zmn2haj825cr4k17ld0cf71xy28k5pam2m1padvd";
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
        cp $src $out/bin/fkn
      '';

      fixupPhase = ''
        chmod +x $out/bin/fkn
      '';

      meta = {
        description = "FuckingNode CLI tool";
        homepage = "https://fuckingnode.github.io/";
        license = pkgs.lib.licenses.gpl3;
        platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
        mainProgram = "fkn";
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
