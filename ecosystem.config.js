module.exports = {
  apps: [
    {
      watch: true,
      name: "WaveRD",
      // instances: 3,
      script: "./dist/index.js",
      ignore_watch: ["node_modules", ".git"],
      watch_options: { followSymlinks: false },
    },
    {
      // instances: 3,
      name: "Compiler",
      script: "./start-tsc.sh",
    },
    {
      name: "Gateway",
      // instances: 4,
      script: "../waverd-gateway/index.js",
    },
  ],
};
