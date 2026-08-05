{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.pnpm
    pkgs.git
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.openssl
    ];
  };
}
