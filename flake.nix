{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      lib = pkgs.lib;
    in {
      packages.default = pkgs.buildNpmPackage {
        name = "smots";
        src = ./.;

        npmDepsHash = "sha256-yZIFArgh3Gbo+n4oItUmryqJiXc8TPplANlfDpA4qEo=";

        dontNpmBuild = true;
        npmPackFlags = ["--ignore-scripts"];
        NODE_OPTIONS = "--openssl-legacy-provider";
        meta = {
          homepage = "https://github.com/smotslang/smotslang";
          description = " A language, made of smots ";
          license = lib.licenses.mit;
          mainProgram = "smots";
        };
      };
    });
}
