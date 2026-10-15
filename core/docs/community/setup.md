# Step 1: Getting started

[Documentation index](README.md) | Next: [Write your own tests](writing-tests.md)

By the end of this guide you will have installed TestTalon Community, run the bundled test, opened its report, and know what every folder and command is for.

## Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node.js (includes npm) | 24 or later | `node --version` |
| Git | any recent version | `git --version` |
| A code editor | optional, Visual Studio Code works well | |

```bash
node --version
npm --version
git --version
```

```text
v24.13.0
11.6.2
git version 2.54.0
```

Your numbers will differ. What matters is that Node.js prints `v24` or higher. If it prints a lower number, install Node.js 24 from [nodejs.org](https://nodejs.org/) and open a new terminal.

You need an internet connection once, to install the dependencies and the browser. After that, the bundled test runs offline.

## Install

Get the project. Cloning the Community repository creates a folder named `testtalon-community` (replace `<repository-url>` with the clone URL shown on the Community repository page):

```bash
git clone <repository-url>
cd testtalon-community
```

If you downloaded a ZIP instead, extract it and open a terminal in the extracted folder. Either way, you now are in the project root, the folder that contains `package.json`. Run:

```bash
npm ci --ignore-scripts
npx playwright install chromium
```

1. `npm ci --ignore-scripts` installs the exact dependency versions recorded in `package-lock.json`. It never changes the lock file. `--ignore-scripts` stops dependency install scripts from running. npm may print deprecation warnings and an audit summary; they do not stop the install and need no action to get started.
2. `npx playwright install chromium` downloads the Chromium build that Playwright drives. Google Chrome is not needed.

Use `npm ci`, not `npm install`, unless you are deliberately changing dependencies. Use the full install: `npm run build` needs the development dependencies (TypeScript), so `npm ci --omit=dev` is not supported.

## Run the bundled test

`npm test` runs three steps in order: it compiles the project (`npm run build`), runs the unit checks of the helper libraries (`npm run test:unit`), and runs the smoke test (`npm run test:smoke`). It works offline and needs no profile file or credentials.

```bash
npm test
```

```text
> testtalon-community@2.1.0 test
> npm run build && npm run test:unit && npm run test:smoke

> testtalon-community@2.1.0 build
> tsc -p tsconfig.json

> testtalon-community@2.1.0 test:unit
> node --test packages/community/tests/*.test.cjs

✔ CSV selection preserves values, ranges and deterministic deduplication (3.7ms)
✔ Community variables contain browser settings and read environment at access time (0.1ms)
✔ random floats support fixed, negative and fractional ranges without crypto bound errors (0.7ms)
✔ generated strings and synthetic accounts obey requested lengths and public domain (1.0ms)
✔ integer, date and selection generators respect fixed boundaries and input values (0.1ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0

> testtalon-community@2.1.0 test:smoke
> playwright test --project=dev --retries=0

Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message @GUI @Smoke @Offline (1.8s)

  1 passed (3.3s)
```

Success is `1 passed` at the end. A browser window opens briefly because, outside CI, tests run with a visible browser. In CI (when the `CI` environment variable is set) they run headless.

## Open the report

```bash
npm run showreport
```

This opens the Playwright HTML report from `logs/html-report` in your browser. It lists the test, its steps and its duration. The same run also wrote `logs/json-report.json`. The [reports guide](reporting-and-logging.md) explains both files and what is captured when a test fails.

If `npm run showreport` shows nothing, run `npm test` first so that `logs/html-report` exists.

## The sample Web tests

Besides the bundled test, Community includes sample Web suites under `tests/webapp/functional/`. They show the recommended structure (object repository, `webActions`, small shared functions) on real situations, and they run in every browser project.

| File | What it shows | Network |
| --- | --- | --- |
| `community/browser.test.ts` | The bundled smoke test: CSV data, `webActions`, object repository | None |
| `otherProjects/AlertsFrameWindows.test.ts` | JavaScript alert, confirm and prompt dialogs, an iframe, a new tab, plus one real navigation on playwright.dev | Local fixture; the playwright.dev test is tagged `@Online` |
| `otherProjects/Widgets.test.ts` | Accordion, tabs, slider, progress bar, date input and autocomplete, plus the install tabs and sidebar of playwright.dev | Local fixture; two playwright.dev tests are tagged `@Online` |
| `otherProjects/HAR.test.ts` | Recording a HAR file and replaying it without the server | Local server on 127.0.0.1 |
| `otherProjects/PdfToText.test.ts` | Reading the text of `data/pdf/sample.pdf` | None |

The widgets and dialogs run against small HTML pages that the test serves itself with Playwright's `route`. They are fixtures, not features of playwright.dev. Run all tests that need no network with `npm run test:web`; run the playwright.dev tests with the `test:online` script. To point the `@Online` tests at another address, set `PLAYWRIGHT_DEV_URL`.

```bash
npm run test:web
```

```text
Running 18 tests using 2 workers

  18 passed (14.8s)
```

## What the bundled test does

`tests/webapp/functional/community/browser.test.ts` is the example to copy from. It:

1. reads a value from `tests/webapp/functional/community/demo.csv`,
2. loads the local page `demo.html` (no network),
3. fills the form field and clicks the button using selectors from `objectRepositories/GUI/communityDemoGUI.json`,
4. checks that the page shows the value from the CSV file.

## Next: set up your own Web project

Community ships three Playwright projects: `dev`, and two samples, `staging-chromium` and `qa-firefox`, each with a public demo profile. To run them, learn how a profile supplies the application address, and add your own project (a name, a browser, the tests to run and a profile), run them from the command line and from VS Code, follow the [Quick start in the projects guide](projects-and-environments.md#quick-start-your-first-web-projects). It takes a few minutes and uses public demo sites, so it needs no credentials.

## Your project at a glance

| Path | What it is | Do you edit it? |
| --- | --- | --- |
| `tests/webapp/` | Your Web tests, named `*.test.ts`, with shared workflows in `tests/webapp/common/` | Yes |
| `objectRepositories/GUI/` | JSON files holding selectors, one per page | Yes |
| `playwright.config.ts` | Entry point for Playwright; where you add projects | Yes |
| `data/` | Optional folder for your own test data (you create it) | Yes |
| `config/.env.<profile>` | Optional settings for one environment, committed with your tests (no plain-text credentials; `config/.env.keys` is the one ignored file) | Yes, if you need it |
| `config/.env.example` | Template of supported settings. Copy it; do not edit it | No |
| `packages/community/lib/` | The framework: `BaseTest.ts`, `WebActions.ts`, `CommonFuncs.ts` | No |
| `core/lib/GenerateData.ts` | Random test-data generators | No |
| `config/community/` | Default Playwright settings and the convention checker | No |
| `config/loadProfileData.ts`, `config/logger.ts` | Profile loading and logging | No |
| `core/docs/community/` | These guides | No |
| `.github/workflows/community.yml` | The included GitHub Actions workflow | Optional |
| `logs/` | Reports, failure artifacts and log files. Created by runs and ignored by Git | No |
| `dist/` | Compiled output of `npm run build`. Ignored by Git | No |

Keep your changes in the folders marked "Yes". Leaving the framework folders alone means a future TestTalon update will not conflict with your work.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Build, run the unit checks, then run the smoke test |
| `npm run build` | Compile the project with TypeScript into `dist/` |
| `npm run typecheck` | Check types without writing files |
| `npm run lint` | Check your tests against the TestTalon conventions (same as `npm run lint:tests`) |
| `npm run test:unit` | Run the unit checks of the helper libraries |
| `npm run test:list` | List the tests of the default `dev` project without running them |
| `npm run test:smoke` | Run the bundled smoke test (`tests/webapp/functional/community`) |
| `npm run test:web` | Run every sample Web test that needs no network (tagged `@Offline`), see [the sample tests](#the-sample-web-tests) |
| the `test:online` script (start it with npm's run command, like the others) | Run the sample tests that visit the public playwright.dev site (tagged `@Online`). Needs internet access |
| `npm run showreport` | Open the HTML report |

`npx playwright test ...` runs tests directly with any Playwright option. The [writing tests guide](writing-tests.md#run-your-tests) shows the commonly used forms.

## Verify your setup

Run these three commands. Each should finish without errors:

```bash
npm run typecheck
npm run lint
npm run test:list
```

```text
Community conventions: 7 tests, 0 findings.
Listing tests:
  [dev] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
  (one line for each of the other sample tests)
Total: 23 tests in 7 files
```

`npm run test:list` prints one line per test, so your list is longer once you add tests. The first line is the bundled test.

`npm run typecheck` prints nothing after its header when the types are correct.

## If something went wrong

| Symptom | Fix |
| --- | --- |
| `Executable doesn't exist` | Run `npx playwright install chromium` |
| `engines` or Node version error | Install Node.js 24 or later, then open a new terminal |
| `npm ci` fails with `npm ci can only install packages when your package.json and package-lock.json ... are in sync` | Restore the original `package.json` and `package-lock.json` |
| `npm run showreport` shows nothing | Run `npm test` first |

The [troubleshooting guide](troubleshooting.md) covers more cases.

Next: [Write your own tests](writing-tests.md).
