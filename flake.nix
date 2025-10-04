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
    version = "5.0.1";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos_arm";
    };


    sha256s = {
      "aarch64-linux" = "14fmq09ci1nmvr2867rac7iim25y87xbylx8vs2skbavqf7x87b9";
      "x86_64-linux" = "09q6rp5k1sdnmlsls65fban0hk90sh9dvl0gc43796v1jybavjsm";
      "x86_64-darwin" = "1gidl0hi88c0bhm5nbldgkikddwamrmfqxj2pshw51xvyi2chs2r";
      "aarch64-darwin" = "033aaxf7pf8m1jvp91glrlf9n85qrm5b3h4gf867vrssxhx9hq6y";
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
