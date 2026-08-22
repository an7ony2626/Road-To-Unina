import { defineConfig, devices } from '@playwright/test';

// These tests run against a fully local environment:
//   - Angular dev server        (started automatically below via webServer)
//   - Spring Boot backend       (must already be running on :8080, e.g. `mvn spring-boot:run`)
//   - Local PostgreSQL database (must already be up and match application.properties)
//
// workers is pinned to 1 on purpose: every spec follows the "one game in
// progress per user" business rule and calls the real Wikipedia API through
// the backend, so running specs in parallel would only add flakiness
// without saving meaningful time for a 10-test suite.
export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});