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
    version = "5.2.1";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linuxArm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-mac64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macArm";
    };

    sha256s = {
      "aarch64-linux" = "15nkzjnlzignvymy9np6v1v0rvwklaifqs7cg7dxgarmbl5k6h20";
      "x86_64-linux" = "0mg1dj0zfchcczsi0yym8cm2sd45k736l2mp39arlswpfnfr7iix";
      "x86_64-darwin" = "0nd58jc6my8lsddp5ddqah73svwcrzx1zzqn8q2s64ardmq3nijy";
      "aarch64-darwin" = "1wfqqz5l3nn4ihghi2zmr07mji4mq04i1ln356s5bglzkzfk4bw7";
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
