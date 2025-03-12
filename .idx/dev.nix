{ pkgs, ... }: {

  channel = "unstable";

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.deno
  ];

  # Sets environment variables in the workspace
  env = {
  };

  # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
  idx.extensions = [
  ];
}
