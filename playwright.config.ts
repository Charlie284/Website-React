import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:43127",
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  webServer: {
    command: `${process.execPath} ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 43127`,
    reuseExistingServer: false,
    url: "http://127.0.0.1:43127",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
