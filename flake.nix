{
  description = "Dev environment for Tetrastack with Next.js and LibSQL";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: import nixpkgs { inherit system; };
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs_20
              sqld
              nodePackages.concurrently
              gnumake # Ensure make is available
            ];

            shellHook = ''
              # Load defaults
              WEB_PORT=3000
              DB_PORT=8080

              if [ -f .env ]; then
                export $(grep -v '^#' .env | xargs)
              fi
              
              # Re-export defaults if they weren't in .env
              export WEB_PORT=''${WEB_PORT:-3000}
              export DB_PORT=''${DB_PORT:-8080}
              export DATABASE_URL="http://127.0.0.1:$DB_PORT"

              echo "🧱 Tetrastack Dev Environment Loaded"
              echo "----------------------------------------"
              echo "  Web Port:     $WEB_PORT"
              echo "  DB Port:      $DB_PORT"
              echo "  Database URL: $DATABASE_URL"
              echo "----------------------------------------"
              echo "Run 'make up' to start the development environment (Docker)."
            '';
          };
        }
      );
    };
}
