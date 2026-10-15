import { defineConfig } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';

// Community's default projects. The address is not set here: each project's metadata.envProfile selects
// config/.env.<profile>, and tests read GUI_BASE_URL from it (see the Community configuration guide).
export default defineConfig({
  ...communityConfig, // TestTalon defaults and the "dev" project
  projects: [
    ...(communityConfig.projects ?? []), // keeps "dev"

    // ---- Sample projects: copy a block to add your own ----
    {
      name: 'staging-chromium', // the label you pass to --project
      testDir: './tests/webapp/functional/playwright-site', // the tests this project runs
      metadata: { envProfile: 'staging' }, // loads config/.env.staging (GUI_BASE_URL)
      use: { browserName: 'chromium' }, // 'chromium', 'firefox' or 'webkit'
    },
    {
      name: 'qa-firefox',
      testDir: './tests/webapp/functional/todomvc',
      metadata: { envProfile: 'qa' }, // loads config/.env.qa (GUI_BASE_URL)
      use: { browserName: 'firefox' },
    },
  ],
});
