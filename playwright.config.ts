import { defineConfig } from '@packages/core/lib/base-test';
import { communityConfig } from '@packages/community/config/playwright-config';
import { webProjects } from '@packages/web/config/projects';

// Community's default projects: "dev", the browser projects of packages/web/config/projects.ts and the two samples below.
// The address is not set here: each project's metadata.envProfile selects config/project-profiles/.env.<profile>.
// The bundled Community demo uses local HTML instead of GUI_BASE_URL.
export default defineConfig({
  ...communityConfig, // TestTalon defaults and the "dev" project
  projects: [
    ...(communityConfig.projects ?? []), // keeps "dev"
    ...webProjects, // desktop browsers and device emulation, from packages/web/config/projects.ts

    // ---- Sample projects: copy a block to add your own ----
    {
      name: 'staging-chromium', // the label you pass to --project
      testDir: './tests/sample/webapp/functional/community', // the tests this project runs
      testIgnore: '**/samples/**', // exclude the samples/ subtree; pass browser.test.ts to select only the local demo
      metadata: { envProfile: 'staging' }, // loads config/project-profiles/.env.staging (GUI_BASE_URL)
      use: { browserName: 'chromium' }, // 'chromium', 'firefox' or 'webkit'
    },
    {
      name: 'qa-firefox',
      testDir: './tests/sample/webapp/functional/community',
      testIgnore: '**/samples/**',
      metadata: { envProfile: 'qa' }, // loads config/project-profiles/.env.qa (GUI_BASE_URL)
      use: { browserName: 'firefox' },
    },
  ],
});
