# Step 6: Playwright projects and environments

[Documentation index](README.md) | Previous: [Configuration and profiles](configuration-and-profiles.md) | Next: [Reports and logs](reporting-and-logging.md)

This guide shows how to run the same tests against several environments (for example Dev, QA, Staging and Production) and several browsers (Chromium, Firefox and WebKit) by adding your own Playwright projects. You edit one file, the root `playwright.config.ts`. You never edit TestTalon's framework source under `config/community/`, `packages/` or `core/`.

Everything here was written for Playwright 1.63, the version installed by this package.

New to projects? Start with the [Quick start](#quick-start-your-first-web-projects): it is the shortest path to a working Web project.

## Quick start: your first Web projects

Community comes with three Playwright projects that you can run right away, and shows how to add your own. The two sample projects use public Playwright demo sites, so they need internet access but no account, credential or private configuration.

The idea in one picture. The project says *which browser and which tests*; its profile file says *which address*; the test reads the address:

```text
playwright.config.ts           config/.env.<profile>             your test
project  --metadata.envProfile-->  GUI_BASE_URL=<address>  -->  process.env.GUI_BASE_URL  -->  page.goto(...)
```

TestTalon loads the profile while a test runs, after Playwright has already fixed the project's own `baseURL`. So the address from a profile is read in the test with `process.env.GUI_BASE_URL`; it does not become `baseURL`, and no project below sets one ([why](configuration-and-profiles.md#where-the-application-address-comes-from)).

### 1. Install Community

Skip this step if you already finished [Getting started](setup.md).

```bash
npm ci --ignore-scripts
```

```bash
npx playwright install chromium firefox
```

Install only the browsers your projects use. Google Chrome and Microsoft Edge are covered [later](#google-chrome-and-microsoft-edge).

### 2. The environment profiles

Community includes two profile files. Each sets one value, the address of a public demo site (the files also contain comment lines):

```dotenv
# config/.env.staging
GUI_BASE_URL=https://playwright.dev
```

```dotenv
# config/.env.qa
GUI_BASE_URL=https://demo.playwright.dev/todomvc
```

The `dev` project has no profile file, so it needs none. A missing profile is not an error. Profiles are plain `KEY=value` files; for your own, create `config/.env.<name>` the same way ([Configuration and profiles](configuration-and-profiles.md#create-a-local-profile)). Profiles are committed with your source code. Git ignores only `config/.env.keys`, the file that holds dotenvx private keys, so a profile must never contain a plain-text credential ([Secrets](configuration-and-profiles.md#secrets) shows how to encrypt one).

### 3. The default projects

This is the root `playwright.config.ts` that Community ships. It reuses TestTalon's defaults (`...communityConfig`) and keeps the `dev` project:

```ts title="playwright.config.ts"
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
```

| Project | Browser | Tests it runs (`testDir`) | Profile (`metadata.envProfile`) | Address |
| --- | --- | --- | --- | --- |
| `dev` | Chromium | everything under `tests/` | `dev` (optional, none shipped) | none |
| `staging-chromium` | Chromium | `tests/webapp/functional/playwright-site` | `staging` | `https://playwright.dev` |
| `qa-firefox` | Firefox | `tests/webapp/functional/todomvc` | `qa` | `https://demo.playwright.dev/todomvc` |

`metadata.envProfile` selects the file `config/.env.<profile>`. If it is not set, the project's name is the profile name. The test each sample project runs is included, so you can read it:

```ts title="tests/webapp/functional/playwright-site/get-started.test.ts"
import { test, expect } from '@core/lib/BaseTest';
import { pagePlaywright } from '@objectRepositories/GUI/playwrightGUI.json';

test('home page links to the installation guide', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
    const appUrl = process.env.GUI_BASE_URL ?? '';
    test.skip(!appUrl, 'Set GUI_BASE_URL in the project profile, for example config/.env.staging.');
    await page.goto(appUrl);
    await webActions.waitForPageLoad();
    await webActions.highlightAndClick(page.getByRole('link', { name: pagePlaywright.getStarted.accessibleName }));
    await expect(page).toHaveURL(/\/docs\/intro/);
    await expect(page.getByRole('heading', { name: pagePlaywright.installation.accessibleName, level: 1 })).toBeVisible();
});
```

The second sample, `tests/webapp/functional/todomvc/add-todo.test.ts` with `objectRepositories/GUI/todoMvcGUI.json`, reads `GUI_BASE_URL` the same way and adds an item to the TodoMVC list.

### 4. Run a project from the command line

List what a project runs, then run it:

```bash
npx playwright test --list --project=staging-chromium
```

```bash
npx playwright test --project=staging-chromium
```

```bash
npx playwright test --project=qa-firefox
```

Each passing run ends with `1 passed`. A browser window opens, because locally tests run with a visible browser (in CI they run headless). Use `npm run showreport` to open the report. If a run ends with `1 skipped` instead, the profile did not supply `GUI_BASE_URL`: the file is missing or its name does not match `metadata.envProfile` letter for letter.

### 5. Run it in the VS Code Playwright Test Runner

The extension reads the same `playwright.config.ts` as the command line, so the project names and tests are identical.

1. Install the extension **Playwright Test for VS Code** (publisher Microsoft, `ms-playwright.playwright`).
2. Open the project root folder (the one that contains `package.json` and `playwright.config.ts`) with **File > Open Folder**. Do not open its parent folder.
3. Open the **Testing** view in the sidebar. The tests appear in a tree.
4. In the **Playwright** panel at the bottom of the Testing view, tick the project you want under **Projects**, for example `staging-chromium`. Only ticked projects run.
5. Click the play button next to a test, a file or a folder. Tick **Show browser** if you want to watch the browser.

The profile is loaded the same way as on the command line, because the profile loader runs inside every test. If no tests appear, run `npx playwright test --list` in the VS Code terminal. If that command lists them, reload the window; if it prints an error, fix the configuration first.

### 6. Add your own project

To add a project, copy one of the sample blocks, paste it as another entry in the `projects` array, and change the values in the table below. This example runs the same Playwright-website test in Firefox with the existing `staging` profile, so it needs no new file:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';

export default defineConfig({
  ...communityConfig,
  projects: [
    ...(communityConfig.projects ?? []),

    { name: 'staging-chromium', testDir: './tests/webapp/functional/playwright-site', metadata: { envProfile: 'staging' }, use: { browserName: 'chromium' } },
    { name: 'qa-firefox', testDir: './tests/webapp/functional/todomvc', metadata: { envProfile: 'qa' }, use: { browserName: 'firefox' } },

    // ---- YOUR PROJECT: a pasted copy of the first sample with two values changed ----
    { name: 'staging-firefox', testDir: './tests/webapp/functional/playwright-site', metadata: { envProfile: 'staging' }, use: { browserName: 'firefox' } },
  ],
});
```

```bash
npx playwright test --project=staging-firefox
```

| To change | Edit | Notes |
| --- | --- | --- |
| Project name | `name` | The label you pass to `--project`. It must be unique |
| Browser | `use.browserName` | `'chromium'`, `'firefox'` or `'webkit'`. Install it first: `npx playwright install firefox` |
| Tests it runs | `testDir` | A folder of `*.test.ts` files. `testMatch` (a file pattern) is the alternative |
| Environment profile | `metadata.envProfile` | Create `config/.env.<name>` containing `GUI_BASE_URL=<address>`. Letters, digits, `_`, `-` and single dots only |

For a new application, give the project its own profile and test folder: a project `shop-chromium` with `metadata: { envProfile: 'shop' }` reads `config/.env.shop`, and its tests read `process.env.GUI_BASE_URL` as the samples do. Do not set `use.baseURL` for a profile address, as it would not use the profile.

### 7. Run selected projects or all projects

```bash
npx playwright test --project=staging-chromium --project=qa-firefox
```

The command above runs the two sample projects together and ends with `2 passed`. Without `--project`, Playwright runs every project, including `dev`, which runs every test under `tests/`:

```bash
npx playwright test --list
```

This prints each test once per project (the project name is in square brackets), so you can see what a full run would do before you start it. Use `--project` to run only what you mean to. Each sample test skips itself in `dev`, because `dev` has no profile with an address.

### If something goes wrong

| Symptom | Cause and fix |
| --- | --- |
| `Project(s) "qa-chrome" not found. Available projects: ...` | The name does not match. Run `npx playwright test --list` and copy the name exactly |
| `Error: No tests found` | `testDir` points at a folder that does not exist or holds no `*.test.ts` file. Check the spelling of the path |
| The run ends with `skipped` instead of `passed` | The test found no `GUI_BASE_URL`. Create `config/.env.<profile>` with that line, and check that its name matches `metadata.envProfile` letter for letter |
| `Cannot navigate to invalid URL` | The test called `page.goto('/...')` in a project that has no `baseURL`. Use the full address from `GUI_BASE_URL`, or set `use.baseURL` ([when to use which](configuration-and-profiles.md#where-the-application-address-comes-from)) |
| `Executable doesn't exist` | The browser is not installed. Run `npx playwright install firefox` (or the browser named in the message) |
| `net::ERR_NAME_NOT_RESOLVED` or a timeout in `page.goto` | No internet access, or the address in the profile is wrong |
| Two projects have the same `name` | Playwright accepts it, but `--project` and the reports can no longer tell them apart. Give every project a unique name |
| The configuration file fails to load | Run `npm run typecheck` and fix the reported line, usually a missing comma or a misspelled option |

More symptoms are in [Troubleshooting](troubleshooting.md#projects-and-browsers).

### Project, browser and environment profile

| Term | What it is | Where you set it |
| --- | --- | --- |
| Playwright project | A named group of settings (tests, browser, profile) that Playwright applies. The same test runs once per selected project | An entry in `projects` |
| Browser | The engine that runs the test: Chromium, Firefox or WebKit, or the installed Chrome or Edge | `use.browserName` (and `use.channel`) |
| Environment profile | An optional settings file, `config/.env.<name>`, read while a test runs: the address (`GUI_BASE_URL`), timeouts, credentials your tests read. It never chooses the browser | `metadata.envProfile` |

## Advanced configuration

The rest of this guide is optional. It builds many projects at once (environments times browsers) whose `baseURL` comes from environment variables, so tests can use `page.goto('/path')`. It also adds Chrome, Edge and device presets, and runs them in CI. If you did the quick start and want those generated projects, copy your own project objects into `customProjects` of the complete configuration below, because that file replaces `playwright.config.ts`. Replacing the root file with that configuration drops the two sample projects, so their names (`qa-firefox`) can be generated again without a clash. The two ways of providing an address are compared in [Where the application address comes from](configuration-and-profiles.md#where-the-application-address-comes-from).

## At a glance

| What | Project name | Profile file | Edition |
| --- | --- | --- | --- |
| Default projects | `dev` (Chromium); samples `staging-chromium`, `qa-firefox` | `config/.env.dev` (optional); `config/.env.staging` and `config/.env.qa` (shipped demo profiles) | Community |
| One environment in one browser | `<environment>-<browser>`, for example `qa-firefox` | `config/.env.<environment>`, optional | Community |
| Your own variation (locale, viewport, device preset) | A unique name you choose, for example `qa-iphone` | The `metadata.envProfile` you set, optional | Community |
| Google Chrome or Microsoft Edge instead of Playwright's Chromium | A unique name you choose, for example `qa-chrome`, `qa-edge` | The `metadata.envProfile` you set, optional | Community |

Community covers Web GUI projects only.

> **Edition**: Community. API, mobile and database projects are not included. See [What Community includes](README.md#what-community-includes).

## What you will have at the end

- Your own list of environments, each with its own base URL, kept outside the source code.
- One Playwright project per environment and browser, named like `qa-firefox`.
- Commands to run one project, several projects or all of them.
- A GitHub Actions example that runs a selected project.

The default setup still works offline without any configuration: `npm test` and `npm run test:smoke` run only the `dev` project. Everything below is opt-in.

## Choose what to edit

| I want to... | Project type | Profile file | Edit |
| --- | --- | --- | --- |
| Run the bundled test or my first tests | Default `dev` | None needed | Nothing |
| Point tests at QA, Staging or Production | `<environment>-<browser>`, generated | `config/.env.<environment>`, only if the environment needs more than a URL | Set `<NAME>_BASE_URL` (shell, CI or `config/.env.environments`) and use the [complete configuration](#a-complete-playwrightconfigts) |
| Run the same tests in Firefox or WebKit | `<environment>-firefox`, `<environment>-webkit` | Same as above | Keep the browsers you need in the `browsers` list |
| Add a German-locale, phone-sized or other variation | A custom project | The profile named in its `metadata.envProfile` | `customProjects` ([Adding a custom project](#adding-a-custom-project)) |
| Run in the installed Google Chrome or Microsoft Edge | A custom project with `channel` | Same as above | [Google Chrome and Microsoft Edge](#google-chrome-and-microsoft-edge) |
| Add another environment, such as PreProduction | One more line in `environments` | `config/.env.<environment>`, optional | [Adding a new environment](#adding-a-new-environment) |
| Keep a secret or a tuning value for one environment | The project you already have | `config/.env.<environment>` | The profile file only ([Configuration and profiles](configuration-and-profiles.md)) |

## A project and its profile, side by side

A project says *where and how* a test runs. Its profile says *with which extra settings*. They are joined by the name in `metadata.envProfile`. This is the project that the complete configuration below generates for `qa` in Firefox, with its two files:

```ts snippet
// The generated project, as it appears in your configuration
{
  name: 'qa-firefox',                 // the label for --project
  metadata: { envProfile: 'qa' },     // loads config/.env.qa while a test runs
  use: { browserName: 'firefox', baseURL: 'https://qa.example.test' },
}
```

```dotenv
# config/.env.environments  (committed with your source; read when the configuration loads)
QA_BASE_URL=https://qa.example.test
```

```dotenv
# config/.env.my-qa  (committed with your source; optional; read only while a test runs)
APP_USER=PLACEHOLDER
```

| File | Read when | Can hold |
| --- | --- | --- |
| `config/.env.environments`, or your shell or CI | Playwright loads `playwright.config.ts` | The `<NAME>_BASE_URL` values that create projects |
| `config/.env.qa` | A `qa-*` test runs | Settings and secrets your tests read with `process.env` |

> **Note**: The `qa` and `staging` profile names are also the names of Community's two public demo profiles, which Community ships. In the complete configuration, `qa-*` and `staging-*` projects load them too. For your own QA or staging settings, replace the demo values in those files, or add `metadata: { envProfile: 'my-qa' }` to those projects and use a profile of your own.

Profile selection and precedence are explained once, in [Configuration and profiles](configuration-and-profiles.md#choose-which-profile-a-project-uses).

## What is a Playwright project?

The [quick start](#project-browser-and-environment-profile) defines the term. Typical reasons to create projects:

- Run the same tests in Chromium, Firefox and WebKit.
- Run the same tests against Dev, QA, Staging or Production URLs.
- Run a small read-only subset against Production.
- Try a different viewport, locale or time zone.

## Understanding `playwright.config.ts`

The root `playwright.config.ts` of a fresh Community install is the file shown in [The default projects](#3-the-default-projects) of the quick start: `defineConfig` applied to TestTalon's defaults plus two sample projects.

It spreads TestTalon's default settings from `config/community/playwrightConfig.ts` (`...communityConfig`) into the configuration it hands to Playwright. Because this root file is yours, it is the right place to add projects: your changes live in your file, and the framework's file stays untouched.

| Setting | What it does | Community default |
| --- | --- | --- |
| `defineConfig` | Playwright helper that validates and merges a configuration. | Used by the root file |
| `projects` | The list of projects. Each entry needs a unique `name`. | `dev`, plus the sample projects `staging-chromium` and `qa-firefox` |
| `name` | The label you pass to `--project`. Playwright also prints it in reports. | `dev` |
| `use` | Options applied to tests in the project (browser, `baseURL`, viewport, and so on). A project's `use` overrides the top-level `use`. | Top-level `use` sets locale, timeouts, screenshots, video and trace |
| `use.baseURL` | The address that relative navigation such as `page.goto('/login')` starts from. | Not set |
| `use.browserName` | `'chromium'`, `'firefox'` or `'webkit'`. | `chromium` for `dev` |
| `metadata.envProfile` | TestTalon setting: which `config/.env.<name>` profile the project loads while a test runs. | `dev` |

The defaults for `testDir`, `retries`, `workers`, `timeout`, `expect.timeout` and `reporter` are listed in [Change Playwright's defaults](configuration-and-profiles.md#change-playwrights-defaults). Settings you can override per project include `use`, `testDir`, `testMatch`, `grep` (run only tests whose title or tags match), `grepInvert`, `retries`, `timeout`, `expect`, `workers` and `metadata`. `reporter` is global only: set it once at the top level.

> **Note**: `metadata.envProfile` selects the profile a project loads; without it the project name is used. How profiles are chosen, loaded and prioritised is explained in [Choose which profile a project uses](configuration-and-profiles.md#choose-which-profile-a-project-uses).

## Environment strategy

An environment is just a name plus a base URL. **The names are yours.** The examples use `dev`, `qa`, `staging`, `prodbeta` and `prod`, but TestTalon does not require any of them. Use two, or add your own (see [Adding a new environment](#adding-a-new-environment)).

Rules this guide follows:

- URLs come from environment variables, never from source code.
- An environment only becomes projects when its URL is set. Nothing runs against an environment you have not configured.
- Environment names are user-defined: pick any spelling you like. This guide uses lower case (`prodbeta`, not `prodBeta`) because the same name appears in three places that must agree, the project name (`prodbeta-chromium`), the variable (`PRODBETA_BASE_URL`) and the optional profile file (`config/.env.prodbeta`), and file names are case-sensitive on Linux.

## Browser strategy

Playwright can run tests in:

| Name | Engine | Install |
| --- | --- | --- |
| `chromium` | Chromium | `npx playwright install chromium` |
| `firefox` | Firefox | `npx playwright install firefox` |
| `webkit` | WebKit (Safari engine) | `npx playwright install webkit` |

Community's quick start installs only Chromium. If you add Firefox or WebKit projects, install those browsers once on every machine and CI runner that runs them:

```bash
npx playwright install chromium firefox webkit
```

You do not have to use all three. List only the browsers you need in the `browsers` array of the example below.

To run in the Google Chrome or Microsoft Edge that is installed on your computer instead of Playwright's Chromium, see [Google Chrome and Microsoft Edge](#google-chrome-and-microsoft-edge).

## Environment and browser projects

Combining an environment with a browser gives one project per pair:

| Environment | Projects |
| --- | --- |
| dev | `dev-chromium`, `dev-firefox`, `dev-webkit` |
| qa | `qa-chromium`, `qa-firefox`, `qa-webkit` |
| staging | `staging-chromium`, `staging-firefox`, `staging-webkit` |
| prodbeta | `prodbeta-chromium`, `prodbeta-firefox`, `prodbeta-webkit` |
| prod | `prod-chromium`, `prod-firefox`, `prod-webkit` |

That is 15 possible projects, plus the default `dev`. **You do not need all 15.** Every project multiplies test time, so start with one browser everywhere and add Firefox and WebKit only where cross-browser coverage matters. The example generates a project only for an environment whose URL is set, so the number of projects follows your configuration.

## A complete `playwright.config.ts`

Replace the contents of the root `playwright.config.ts` with this file. It keeps the default `dev` project, adds one project per configured environment and browser, validates URLs, and leaves a place for your own custom projects.

If you already changed the root `playwright.config.ts` in another guide (for example `retries`, `timeout` or `reporter`), copy those lines into the `defineConfig({ ... })` call at the bottom of this file instead of discarding them. Only the file as saved is used, so overrides that are not in it are lost.

```ts
// playwright.config.ts
import { defineConfig, devices, type Project } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';
import { loadEnvProfile } from './config/loadProfileData';

// Optional file (config/.env.environments) for your own URLs.
// Variables already set by your shell or CI take precedence over this file.
loadEnvProfile('environments', { folder: 'config', optional: true });

type BrowserName = 'chromium' | 'firefox' | 'webkit';

interface EnvironmentSettings {
  baseURL: string | undefined;
  grep?: RegExp;
}

// Environment names are yours to choose. An environment gets projects only when its URL is set.
const environments: Record<string, EnvironmentSettings> = {
  dev: { baseURL: process.env.DEV_BASE_URL },
  qa: { baseURL: process.env.QA_BASE_URL },
  staging: { baseURL: process.env.STAGING_BASE_URL },
  prodbeta: { baseURL: process.env.PRODBETA_BASE_URL },
  // Production runs only tests tagged @ReadOnly.
  prod: { baseURL: process.env.PROD_BASE_URL, grep: /@ReadOnly/ },
};

// Keep only the browsers you need.
const browsers: BrowserName[] = ['chromium', 'firefox', 'webkit'];

// Optional CI guard: REQUIRED_ENVIRONMENTS=qa,staging fails fast when a URL is missing.
const required = (process.env.REQUIRED_ENVIRONMENTS ?? '')
  .split(',')
  .map(name => name.trim())
  .filter(Boolean);
const missing = required.filter(name => !environments[name]?.baseURL);
if (missing.length > 0) {
  throw new Error(`Missing base URL for required environment(s): ${missing.join(', ')}. Set <NAME>_BASE_URL.`);
}

function checkedUrl(environment: string, value: string): string {
  try {
    new URL(value);
  } catch {
    throw new Error(`${environment.toUpperCase()}_BASE_URL is not a valid URL.`);
  }
  return value;
}

const environmentProjects: Project[] = Object.entries(environments).flatMap(([environment, settings]) => {
  if (!settings.baseURL) return [];
  const baseURL = checkedUrl(environment, settings.baseURL);
  return browsers.map((browserName): Project => ({
    name: `${environment}-${browserName}`,
    metadata: { envProfile: environment },
    grep: settings.grep,
    use: { browserName, baseURL },
  }));
});

// Add your own projects here (see "Adding a custom project" in the guide).
const customProjects: Project[] = [];

export default defineConfig({
  ...communityConfig,
  projects: [...(communityConfig.projects ?? []), ...environmentProjects, ...customProjects],
});
```

How it works:

1. `...communityConfig` keeps every TestTalon default: reporters, timeouts, `testDir`, screenshots, video and trace.
2. `communityConfig.projects` keeps the default `dev` project, so `npm run test:smoke` and `npm run test:list` keep working.
3. `environmentProjects` adds `<environment>-<browser>` projects for every environment that has a URL.
4. `metadata: { envProfile: environment }` makes each project load `config/.env.<environment>` while a test runs, if that file exists. Put non-URL settings there. The profile is optional.
5. `grep: /@ReadOnly/` on `prod` limits Production to tests tagged `@ReadOnly`.

Check that it compiles before you run anything:

```bash
npm run typecheck
```

The root `playwright.config.ts` is part of the TypeScript project, so type mistakes are reported here.

## Environment URL configuration

Provide the URLs through environment variables. Use safe example values like these until you have your real addresses:

| Variable | Example value |
| --- | --- |
| `DEV_BASE_URL` | `https://dev.example.test` |
| `QA_BASE_URL` | `https://qa.example.test` |
| `STAGING_BASE_URL` | `https://staging.example.test` |
| `PRODBETA_BASE_URL` | `https://beta.example.test` |
| `PROD_BASE_URL` | `https://www.example.test` |

### Locally: a file in `config/`

Create `config/.env.environments` with only the environments you use:

```text
QA_BASE_URL=https://qa.example.test
STAGING_BASE_URL=https://staging.example.test
```

Like every profile, this file is committed with your source code, so keep only URLs in it. The config loads it automatically. Read this carefully: the URLs are needed while `playwright.config.ts` loads, but a per-project profile such as `config/.env.qa` is loaded later, only while a test runs. A URL placed only in `config/.env.qa` is therefore not visible to the config, so keep URLs in the environment or in `config/.env.environments`. If the file is missing, nothing happens. If it exists but is malformed, the run stops with an error naming the profile.

### In a shell

```bash
QA_BASE_URL=https://qa.example.test npx playwright test --list
```

On Windows PowerShell:

```powershell
$env:QA_BASE_URL = "https://qa.example.test"
npx playwright test --list
```

### In CI

Set the variables on the runner ([GitHub Actions](github-actions.md) shows how). Values already set in the environment win over `config/.env.environments`.

### Secrets

Base URLs are configuration, but an internal address may still be sensitive. Keep passwords, tokens and keys out of this file and out of the config; see [Secrets](configuration-and-profiles.md#secrets).

### Missing-variable validation

- A project is created only when its URL is set, so a missing variable means the project does not exist. Selecting it gives `Project(s) "qa-firefox" not found` (see [Troubleshooting](#troubleshooting)).
- A URL that is set but not valid (for example `QA_BASE_URL=qa`) stops the run with `QA_BASE_URL is not a valid URL.`
- In CI, set `REQUIRED_ENVIRONMENTS=qa,staging`. If either URL is missing, the run stops immediately with `Missing base URL for required environment(s): staging.`

## Running tests

`npm test` and `npm run test:smoke` are unchanged: they run only the default `dev` project and need no URLs.

List the projects and their tests without running anything (the project name is in square brackets). The output below is what you get when only `QA_BASE_URL` is set:

```bash
npx playwright test --list
```

```text
Listing tests:
  [dev] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
  [qa-chromium] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
  [qa-firefox] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
  [qa-webkit] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
Total: 4 tests in 1 file
```

Run one project:

```bash
npx playwright test --project=dev-chromium
npx playwright test --project=qa-firefox
npx playwright test --project=staging-webkit
npx playwright test --project=prodbeta-chromium
npx playwright test --project=prod-chromium
```

`prod-chromium` runs only tests tagged `@ReadOnly` ([complete configuration](#a-complete-playwrightconfigts)), so it reports `No tests found` until you have one.

Run several projects, or all projects of one environment with a pattern (quote it):

```bash
npx playwright test --project=qa-chromium --project=qa-firefox
npx playwright test --project="qa-*"
```

Run every configured project (this includes every environment whose URL is set, so check what you have set first):

```bash
npx playwright test
```

Run one test file under one project:

```bash
npx playwright test tests/webapp/functional/community/browser.test.ts --project=qa-chromium
```

Show the browser, or debug step by step:

```bash
npx playwright test --project=qa-chromium --headed
npx playwright test --project=qa-chromium --debug
```

Locally the browser is visible by default and runs headless when the `CI` environment variable is set, so `--headed` mainly matters in CI-like shells. After a run, `npm run showreport` opens the HTML report.

## Adding a new environment

To add PreProduction, add one line to `environments`:

```ts snippet
  preprod: { baseURL: process.env.PREPROD_BASE_URL },
```

Then set the variable:

```bash
PREPROD_BASE_URL=https://preprod.example.test npx playwright test --list --project="preprod-*"
```

The config generates `preprod-chromium`, `preprod-firefox` and `preprod-webkit`. To limit the new environment to one browser, change the `browsers` array for everyone, or give that environment its own list in `EnvironmentSettings`.

If the new environment needs its own non-URL settings, create `config/.env.preprod`. It is loaded only while tests of the `preprod-*` projects run.

## Adding a custom project

Edit `customProjects` in the same file. This example adds a German-locale desktop project and a phone-sized WebKit project for QA. They exist only when `QA_BASE_URL` is set:

```ts
// snippet: customProjects
const qaURL = environments.qa.baseURL;
const customProjects: Project[] = qaURL ? [
  {
    name: 'qa-chromium-german',
    metadata: { envProfile: 'qa' },
    use: {
      browserName: 'chromium',
      baseURL: qaURL,
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      viewport: { width: 1440, height: 900 },
    },
  },
  {
    name: 'qa-iphone',
    metadata: { envProfile: 'qa' },
    use: { ...devices['iPhone 13'], baseURL: qaURL },
  },
] : [];
```

Notes:

- `viewport`, `locale` and `timezoneId` are standard Playwright options. A project's `use` overrides the top-level `use`.
- `devices['iPhone 13']` is Playwright's browser emulation (screen size, user agent, touch). It runs in WebKit on your computer, not on a real phone.
- Give every project a unique name. Duplicate names are not supported and can make a project silently disappear from the list.
- Other per-project options you may want: `retries`, `timeout`, `testMatch`, `grep` and `grepInvert`.

## Google Chrome and Microsoft Edge

Playwright's own **Chromium** is what every Community project uses by default. You can also run a project in the **Google Chrome** or **Microsoft Edge** that is installed on the computer, by adding the Playwright `channel` option to a project. Typical reasons are to test with the browser your users have, or to check a behavior that differs between Chromium and the branded browser.

| | Playwright Chromium | Google Chrome | Microsoft Edge |
| --- | --- | --- | --- |
| Project setting | `browserName: 'chromium'` (no `channel`) | `browserName: 'chromium'` and `channel: 'chrome'` | `browserName: 'chromium'` and `channel: 'msedge'` |
| Installed by | `npx playwright install chromium` (the Quick start does this) | Your own installation, or `npx playwright install chrome` | Your own installation, or `npx playwright install msedge` |
| Where it lives | Playwright's browser cache | The browser's normal application location | The browser's normal application location |
| Version | Fixed by the installed Playwright version | Whatever is installed; normally it updates itself | Whatever is installed; normally it updates itself |
| Bundled with Community or Playwright | Yes, downloaded by Playwright on request | **No** | **No** |

`npm ci` and `npm test` never install Chrome or Edge, and neither does the Quick start. A project that asks for one fails at launch until the browser is installed (see [Common errors](#chrome-and-edge-common-errors)). Chrome and Edge are Chromium-based, so `channel` works only with `browserName: 'chromium'`.

### Install the browser

Use the browser you already have, or let Playwright install the current stable release.

| Platform | Chrome and Edge |
| --- | --- |
| Windows | Supported. `npx playwright install chrome` or `npx playwright install msedge` runs an installer; if it reports insufficient privileges, run the terminal as Administrator |
| macOS | Supported. The Edge installer asks for your administrator password |
| Linux | Supported by Playwright's installer on **Ubuntu and Debian for x64** only. It installs with `apt-get`, so it needs root privileges (run it as root or with `sudo`). On Linux arm64 or other distributions the installer stops with a message; install the browser yourself or use Chromium |

```bash
npx playwright install chrome
npx playwright install msedge
```

> **Warning**: These commands install the system-wide browser and **replace** an existing stable Chrome or Edge with the current release (the installer removes the old copy first). If the browser is already installed and you only need to run tests, do not run them.

Check that the browser is there before you run a project: Chrome and Edge both answer `--version` on their application path, for example on macOS `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version` and `"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --version`.

### Add the projects

Add the two projects to `customProjects` in the root `playwright.config.ts` (the file from the [complete configuration](#a-complete-playwrightconfigts)). If you already added custom projects, put these two objects in the same array. They exist only when `QA_BASE_URL` is set, like every other environment project:

```ts
// snippet: customProjects-branded
const qaURL = environments.qa.baseURL;
const customProjects: Project[] = qaURL ? [
  {
    name: 'qa-chrome',
    metadata: { envProfile: 'qa' },
    use: { browserName: 'chromium', channel: 'chrome', baseURL: qaURL },
  },
  {
    name: 'qa-edge',
    metadata: { envProfile: 'qa' },
    use: { browserName: 'chromium', channel: 'msedge', baseURL: qaURL },
  },
] : [];
```

Both projects use the `qa` profile and the QA base URL, so the same tests run in Playwright's Chromium (`qa-chromium`), in Chrome (`qa-chrome`) and in Edge (`qa-edge`) with the same settings.

### Run them

Set the QA address, then select the projects by name:

```bash
QA_BASE_URL=https://qa.example.test npx playwright test --list --project=qa-chrome --project=qa-edge
```

```bash
npx playwright test --project=qa-chrome
npx playwright test --project=qa-edge
npx playwright test --project=qa-chromium --project=qa-chrome --project=qa-edge
```

The last command runs the same tests in all three so you can compare them. Add `--headed` to watch the browser. The headless or headed choice follows the rule in [Running tests](#running-tests): visible locally, headless when the `CI` environment variable is set.

### Chrome and Edge in CI

- **Do not assume the runner has the browser.** Install it in the job: `npx playwright install --with-deps chrome` or `npx playwright install --with-deps msedge`, before the test step. On Linux the installer needs root privileges and supports Ubuntu and Debian on x64 only, so use an Ubuntu x64 runner and check that the step succeeds in your workflow.
- Run only the projects you need (`--project=qa-chrome`). Each job should install only the browser it uses.
- Branded browsers normally update themselves, so a CI run can use a newer browser than your machine. Playwright's Chromium does not change until you update Playwright.
- The [GitHub Actions guide](github-actions.md#run-an-environment-in-several-browsers) shows the matrix job; put `chrome` or `msedge` in the install step and the project name together.

### Chrome and Edge common errors

| Symptom | Cause and fix |
| --- | --- |
| `browserType.launch: Chromium distribution 'chrome' is not found at ...` followed by `Run "npx playwright install chrome"` | Chrome is not installed where Playwright looks. Install it (see above) or run a `*-chromium` project instead |
| The same message with `'msedge'` | Edge is not installed. Run `npx playwright install msedge`, or install Edge yourself |
| `browserType.launch: Unsupported firefox channel "chrome"` | `channel` was combined with `browserName: 'firefox'` or `'webkit'`. Use `browserName: 'chromium'` |
| `Project(s) "qa-chrome" not found. Available projects: ...` | `QA_BASE_URL` is not set, or the projects are not in the saved `customProjects`. Run `npx playwright test --list` and compare |
| `ERROR: not supported on Linux Arm64` or `cannot install on <name> distribution - only Ubuntu and Debian are supported` | Playwright's installer does not support this Linux. Install the browser with your own package manager, or run on Playwright's Chromium |
| The installer reports insufficient privileges, or asks for a password | Run it as Administrator (Windows), with your password (macOS), or as root (Linux) |
| A test passes in `qa-chromium` and fails in `qa-chrome` or `qa-edge` | The installed browser is a different version or has different built-in policies. Run the one test with `--project=qa-chrome --headed` and compare |

For the general symptoms see [Troubleshooting](troubleshooting.md#projects-and-browsers).

## CI

To run these projects in GitHub Actions, one job per environment and browser, use the matrix workflow in [Run an environment in several browsers](github-actions.md#run-an-environment-in-several-browsers). Set `REQUIRED_ENVIRONMENTS` there so a missing URL fails the job instead of finding no project.

## Troubleshooting

The problems below belong to this guide's flow. Every other symptom is in [Troubleshooting](troubleshooting.md#projects-and-browsers).

| Symptom | Cause and fix |
| --- | --- |
| `Project(s) "qa-firefox" not found. Available projects: ...` | Either the name is misspelled, or `QA_BASE_URL` is not set so the QA projects were not created. Run `npx playwright test --list` and compare. |
| `Error: No tests found` for a `prod-*` project | Production projects run only tests tagged `@ReadOnly`. Tag a safe read-only test with `{ tag: ['@ReadOnly'] }` ([Best practices](#best-practices)), or change the `grep` for that environment on purpose. |
| `Cannot navigate to invalid URL` | The project has no `baseURL`, so `page.goto('/')` has nothing to start from. This happens with the default `dev` project. Run an environment project, or use an absolute URL. |
| `QA_BASE_URL is not a valid URL.` or `Missing base URL for required environment(s): staging` | The value is not a full URL (include `https://`), or `REQUIRED_ENVIRONMENTS` lists an environment whose `<NAME>_BASE_URL` is not set. Set it or remove it from the list. |

## Best practices

- Keep base URLs outside source code, in environment variables or in `config/.env.environments`.
- Never commit credentials, tokens, private keys or authentication state. Profiles are committed, so encrypt secrets or use CI secrets; `config/.env.keys` stays ignored.
- Use one naming scheme, `<environment>-<browser>`, in lower case.
- Do not create every combination. Start with one browser everywhere.
- Write tests so they work in any environment: relative paths, no hard-coded addresses, no environment-specific data.
- Do not run destructive tests against Production. Tag safe checks with `@ReadOnly` and let the project's `grep` select only those.
- Keep Production checks read-only and small: load a page, check that it renders, check a visible label.
- Run `npm run typecheck` and `npx playwright test --list` before pushing a configuration change.
- Review configuration changes like code: a wrong URL or a widened `grep` can point a test at the wrong system.

A read-only Production check looks like this. Its selector comes from an object repository, as the [convention checker](writing-tests.md#check-your-conventions) requires:

```json title="objectRepositories/GUI/homeGUI.json"
{
  "home": {
    "heading": "h1"
  }
}
```

```ts title="tests/webapp/functional/learn/read-only.test.ts"
import { test, expect } from '@core/lib/BaseTest';
import { home } from '@objectRepositories/GUI/homeGUI.json';

test('home page renders', { tag: ['@ReadOnly'] }, async ({ page, baseURL }) => {
    test.skip(!baseURL, 'Run this test in a project that has a baseURL, such as qa-chromium.');
    await page.goto('/');
    await expect(page.locator(home.heading)).toBeVisible();
});
```

## FAQ

**Do I have to edit TestTalon's own files?** No. Only the root `playwright.config.ts` and, optionally, your `config/.env.environments`.

**Can I use only two environments?** Yes. Set only those two variables. Environments without a URL create no projects.

**Why does `npm run test:smoke` only run `dev`?** The script passes `--project=dev` on purpose. Your new projects do not change it. Add your own script to `package.json` if you want a shortcut, for example `"test:qa": "playwright test --project=qa-chromium"`.

**Can I remove the default `dev` project?** You can, but `npm test`, `npm run test:smoke` and `npm run test:list` select `dev` by name and would then fail. Keep it, or update those scripts too.

**Where do I put credentials a test needs?** See [Secrets](configuration-and-profiles.md#secrets).

**How do I run a single test in all browsers of one environment?** `npx playwright test tests/webapp/functional/community/browser.test.ts --project="qa-*"`.

**Does the bundled demo test run in the new projects?** In every project except the `prod-*` ones, yes. It passes without any URL because it loads a local page. The `prod-*` projects run only tests tagged `@ReadOnly`, and the demo is not tagged that way, so `npx playwright test --project=prod-chromium` reports `No tests found` until you add a `@ReadOnly` test (see [Best practices](#best-practices)). Your own tests should use `page.goto('/...')` so the project's `baseURL` is used.

**How do I add a browser version or channel?** Use Playwright's `channel` option inside a project's `use` together with `browserName: 'chromium'`: `channel: 'chrome'` for Google Chrome and `channel: 'msedge'` for Microsoft Edge, after installing that browser. The steps, platforms and errors are in [Google Chrome and Microsoft Edge](#google-chrome-and-microsoft-edge).

Next: [Reports and logs](reporting-and-logging.md), then [GitHub Actions](github-actions.md) for a workflow that runs these projects.
