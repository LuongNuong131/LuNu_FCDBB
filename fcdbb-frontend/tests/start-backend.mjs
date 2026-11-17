import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "fcdbb-browser-test-"));
const child = spawn(process.execPath, ["dist/main.js"], {
  cwd: new URL("../../fcdbb-backend/", import.meta.url),
  env: {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: "",
    PORT: "3001",
    SQLITE_DB_PATH: join(directory, "test.sqlite"),
    CORS_ORIGINS: "http://127.0.0.1:5174",
  },
  stdio: "inherit",
});
const stop = () => child.kill("SIGTERM");
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", async (code) => {
  await rm(directory, { recursive: true, force: true });
  process.exit(code || 0);
});
