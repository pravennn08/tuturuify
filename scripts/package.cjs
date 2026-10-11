const { spawnSync } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const manifest = require("../package.json");

mkdirSync("releases", { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    require.resolve("@vscode/vsce/vsce"),
    "package",
    "--no-dependencies",
    "--allow-missing-repository",
    "--out",
    path.resolve("releases", `${manifest.name}-${manifest.version}.vsix`),
  ],
  { stdio: "inherit", shell: false },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
