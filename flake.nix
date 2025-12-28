{
  description = "Development environment for Tetrastack";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "tetrastack-dev-shell";

          buildInputs = with pkgs; [
            nodejs_20 # Use a specific Node.js version
            sqld
            nodePackages.concurrently
            gnumake
          ];

          shellHook = ''
            echo "Entering Tetrastack development shell..."
            if [ -f .env ]; then
              echo "Sourcing .env file..."
              set -a
              . .env
              set +a
            fi
            echo "Node.js version: $(node -v)"
            echo "npm version: $(npm -v)"
            echo "Make version: $(make -v | head -n 1)"
            if command -v sqld >/dev/null; then
              echo "sqld version: $(sqld --version)"
            else
              echo "WARNING: sqld not found in PATH"
            fi
          '';
        };
      }
    );
}