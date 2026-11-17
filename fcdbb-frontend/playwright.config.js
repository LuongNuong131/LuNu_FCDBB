import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  fullyParallel: false,
  use: {
    actionTimeout: 10000,
    baseURL: "http://127.0.0.1:5174",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: [
    {
      command:
        "npm --prefix ../fcdbb-backend run build && node tests/start-backend.mjs",
      url: "http://127.0.0.1:3001/api/ping",
      timeout: 120000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: { VITE_API_URL: "http://127.0.0.1:3001/api" },
      timeout: 30000,
    },
  ],
});
