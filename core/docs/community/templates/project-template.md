# Project template

[Documentation index](../README.md) | Previous: [Playwright projects and environments](../projects-and-environments.md) | Next: [Reports and logs](../reporting-and-logging.md)

A copy-ready Web GUI project, its matching profile files, the commands to check it and a checklist. Every field is marked `REQUIRED` or `OPTIONAL`, and every value you should edit carries `CHANGE ME`. Profile files contain placeholders only. For the reasoning, see [Playwright projects and environments](../projects-and-environments.md).

## At a glance

| What | Project name | Profile file | Edition |
| --- | --- | --- | --- |
| Web GUI project for one environment and browser | `my-qa-chromium` | `config/.env.my-qa` (optional) | Community |

Community covers Web GUI projects only.

## Project block

Replace the contents of the root `playwright.config.ts` with this file. It keeps the `dev` project and adds one of your own. (It replaces the shipped file, so the two sample projects are not included; copy them from the [quick start](../projects-and-environments.md#3-the-default-projects) if you want them.)

```ts title="playwright.config.ts"
import { defineConfig, type Project } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';
import { loadEnvProfile } from './config/loadProfileData';

// OPTIONAL  Reads config/.env.environments (committed with your source). Variables set by your shell or CI win.
loadEnvProfile('environments', { folder: 'config', optional: true });

const myProject: Project = {
  name: 'my-qa-chromium',                      // REQUIRED  CHANGE ME: unique label for --project
  metadata: { envProfile: 'my-qa' },           // OPTIONAL  CHANGE ME: loads config/.env.my-qa while a test runs
  use: {                                       // REQUIRED
    browserName: 'chromium',                   // REQUIRED  CHANGE ME: 'chromium' | 'firefox' | 'webkit'
    baseURL: process.env.MY_QA_BASE_URL,       // REQUIRED  CHANGE ME: variable that holds your URL (needed for page.goto('/...'))
    // locale: 'en-US',                        // OPTIONAL  CHANGE ME: browser language
    // viewport: { width: 1280, height: 720 }, // OPTIONAL  CHANGE ME: window size
  },
  // grep: /@ReadOnly/,                        // OPTIONAL  CHANGE ME: run only tests with this tag
  // retries: 1,                               // OPTIONAL  CHANGE ME: retries of a failed test
};

export default defineConfig({
  ...communityConfig,
  projects: [...(communityConfig.projects ?? []), myProject],
});
```

If you already edited the root file (for example `retries` or `reporter`), copy those lines into the `defineConfig({ ... })` call instead of discarding them. To create projects for several environments and browsers at once, use the [complete configuration](../projects-and-environments.md#a-complete-playwrightconfigts).

## Profile files

The URL is read while Playwright loads the configuration, so it comes from your shell, from CI or from a `config/.env.environments` file (committed with your source, so URLs only, no secrets). The optional profile is read later, only while a test runs.

```dotenv title="config/.env.environments"
MY_QA_BASE_URL=https://example.test
```

```dotenv title="config/.env.my-qa"
GUI_TIMEOUT=30000                      # OPTIONAL  CHANGE ME: milliseconds, zero or more
HIGHLIGHT_TEST_OBJECT_ENABLED=false    # OPTIONAL  CHANGE ME: true flashes elements while acting
APP_USER=PLACEHOLDER                   # OPTIONAL  CHANGE ME: your own settings, read with process.env
```

## Run and verify

```bash
npm run typecheck
```

```bash
MY_QA_BASE_URL=https://example.test npx playwright test tests/webapp/functional/community --list --project=my-qa-chromium
```

```text
Listing tests:
  [my-qa-chromium] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
Total: 1 test in 1 file
```

```bash
MY_QA_BASE_URL=https://example.test npx playwright test tests/webapp/functional/community --project=my-qa-chromium
```

On Windows PowerShell, set the variable first with `$env:MY_QA_BASE_URL = "https://example.test"` and run the same command without the prefix.

## Checklist

- [ ] The project `name` is unique and matches what you type after `--project=`.
- [ ] The `browserName` is `chromium`, `firefox` or `webkit`, and that browser is installed (`npx playwright install ...`).
- [ ] The URL variable is set in the shell, CI or `config/.env.environments`, and is a full URL with `https://`.
- [ ] If you use a profile, its name matches `metadata.envProfile` letter for letter. Profiles are committed, so it holds no plain-text credential.
- [ ] No real password, token or key is in a tracked file.
- [ ] `npm run typecheck` passes.

Next: [Reports and logs](../reporting-and-logging.md).
