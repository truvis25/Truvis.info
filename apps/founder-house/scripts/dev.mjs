import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  args = process.argv.slice(2);
const value = (names, fallback) => {
  const i = args.findIndex((x) => names.includes(x));
  return i < 0 ? fallback : (args[i + 1] ?? fallback);
};
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "dev",
    "--hostname",
    value(["--host", "--hostname"], "0.0.0.0"),
    "--port",
    value(["--port"], "4173"),
  ],
  { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } },
);
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
