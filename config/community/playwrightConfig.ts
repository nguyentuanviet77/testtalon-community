import type { PlaywrightTestConfig } from '@playwright/test';

const communityConfig: PlaywrightTestConfig = {
  testDir: './tests',
  outputDir: './logs/test-results',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 2,
  fullyParallel: true,
  projects: [{ name: 'dev', use: { browserName: 'chromium' }, metadata: { envProfile: 'dev' } }],
  reporter: [
    ['list'],
    ['html', { outputFolder: './logs/html-report', open: 'never' }],
    ['json', { outputFile: './logs/json-report.json' }],
  ],
  use: {
    locale: 'en-US',
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    headless: !!process.env.CI,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { slowMo: 200 },
  },
  testIgnore: ['**/.deprecated.ts', '**/*.skip.ts', '**/devices/native/**', '**/devices/browser/**'],
};

export { communityConfig };
export default communityConfig;
