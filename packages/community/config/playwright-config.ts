import type { PlaywrightTestConfig } from '@packages/core/lib/base-test';
import { globalSettings } from '@config/global/global-settings';

const communityConfig: PlaywrightTestConfig = {
  testDir: '.',
  // Your tests live in tests/real-projects/webapp/functional; the bundled examples live in tests/sample/webapp/functional.
  testMatch: ['tests/**/webapp/functional/**/*.test.ts'],
  outputDir: './logs/test-results',
  timeout: globalSettings.TEST_TIMEOUT,
  expect: { timeout: globalSettings.EXPECT_TIMEOUT },
  retries: 0,
  workers: 2,
  fullyParallel: true,
  projects: 
  [
    { name: 'dev', 
      use: { 
        browserName: 'chromium' 
      }, 
      metadata: { 
        envProfile: 'dev' 
      } 
    }
  ],
  reporter: [
    ['list'],
    ['./packages/reporting/custom/test-run-reporter.ts'],
    ['html', { outputFolder: './logs/html-report', open: 'never' }],
    ['json', { outputFile: './logs/json-report.json' }],
  ],
  use: {
    locale: 'en-US',
    actionTimeout: globalSettings.GUI_TIMEOUT,
    navigationTimeout: globalSettings.NAVIGATION_TIMEOUT,
    headless: !!process.env.CI,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { slowMo: 200 },
  },
  testIgnore: ['**/.deprecated.ts', '**/*.skip.ts', '**/mobile/native/**', '**/mobile/browser/**'],
};

export { communityConfig };
export default communityConfig;
