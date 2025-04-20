{
  description = "FuckingNode Package";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: 
  let
    systems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];

    pname = "fuckingnode";
    version = "3.3.0";

    urls = {
      "x86_64-linux"   = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
      "aarch64-linux"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
      "x86_64-darwin"  = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos64";
      "aarch64-darwin" = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-macos_arm";
    };


    sha256s = {
      "x86_64-linux"   = "01qxzfdjyp5g35vdm6yz5ig74b5gc4gnnpqwqrbsd94rmsy05bdz";
      "aarch64-linux"  = "11hkq1gjcqqhawpnpdg8vmhyihsisj84c166h50xr7sxjjdy2r0g";
      "x86_64-darwin"  = "0p2yjcbrlvzb812q6p7cj52zccshvba38pnyb0hzcrv8akpbarif";
      "aarch64-darwin" = "0dr9n6yn7xbv06668cz74mc2yfzgxfvc23p89ilvz0lvi4qckwhq";
    };

    buildPackage = system: 
      let
        pkgs = import nixpkgs { inherit system; };
      in pkgs.stdenv.mkDerivation {
        inherit pname version;

        src = pkgs.fetchurl {
          url = urls.${system};
          sha256 = sha256s.${system};
        };

        phases = [ "installPhase" "fixupPhase" ];
        nativeBuildInputs = [ pkgs.makeWrapper pkgs.bash ];
        shell = "${pkgs.bash}/bin/bash";


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
          platforms = [ system ];
          mainProgram = "fuckingnode";
        };
      };

    buildDevShell = system:
      let pkgs = import nixpkgs { inherit system; };
      in pkgs.mkShell {
        buildInputs = [ pkgs.deno ];
      };

  in {
    packages = builtins.listToAttrs (map (system: {
      name = system;
      value.default = buildPackage system;
    }) systems);

    devShells = builtins.listToAttrs (map (system: {
      name = system;
      value = buildDevShell system;
    }) systems);
  };
}

