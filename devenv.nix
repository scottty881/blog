{ pkgs, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
  };

  packages = with pkgs; [
    nodePackages.npm
  ];

  processes = {
    dev.exec = "npm run dev";
  };

  enterShell = ''
    echo "🚀 Blog dev environment ready"
    echo "Run 'npm run dev' to start the Astro dev server"
  '';
}
