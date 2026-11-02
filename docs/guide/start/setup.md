# Step 1: Getting started

[Documentation home](../README.md) | Next: [Write your own tests](../create-tests/writing-tests.md)

By the end of this guide you will have installed TestTalon Community, run the bundled test, opened its report, and know what every folder and command is for.

## Prerequisites

| Tool                   | Version                                 | Check            |
| ---------------------- | --------------------------------------- | ---------------- |
| Node.js (includes npm) | 24 or later                             | `node --version` |
| Git                    | any recent version                      | `git --version`  |
| A code editor          | optional, Visual Studio Code works well |                  |

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

Unit-check names and counts vary with the installed version; the smoke test below selects one file. `npm test` runs three steps in order: it compiles the project (`npm run build`), runs the unit checks of the helper libraries (`npm run test:unit`), and runs the smoke test (`npm run test:smoke`). It works offline and needs no profile file or credentials.

```bash
npm test
```

```text
> testtalon-community@3.0.0 test
> npm run build && npm run test:unit && npm run test:smoke

> testtalon-community@3.0.0 build
> tsc -p tsconfig.json && node packages/core/scripts/resolve-dist-aliases.cjs

resolve-dist-aliases: 25 alias import(s) rewritten in 19 file(s)

> testtalon-community@3.0.0 test:unit
> node --test packages/core/tests/*.test.cjs packages/web/tests/unit/*.test.cjs packages/reporting/custom/*.test.cjs

✔ CSV selection preserves values, ranges and deterministic deduplication (4.3ms)
✔ random floats support fixed, negative and fractional ranges without crypto bound errors (1.0ms)
✔ generated strings and synthetic accounts obey requested lengths and public domain (1.5ms)
✔ integer, date and selection generators respect fixed boundaries and input values (0.2ms)
✔ shared GUI globals preserve types and remain independent of project environment mutations (0.7ms)
ℹ fail 0

> testtalon-community@3.0.0 test:smoke
> playwright test --project=dev --retries=0 tests/sample/webapp/functional/community/browser.test.ts

Running 1 test using 1 worker

  ✓  1 [dev] › tests/sample/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message @GUI @Smoke @Offline (1.8s)

  1 passed (3.3s)
```

Success is `1 passed` at the end. A browser window opens briefly because, outside CI, tests run with a visible browser. In CI (when the `CI` environment variable is set) they run headless.

## Open the report

```bash
npm run showreport
```

This opens the Playwright HTML report from `logs/html-report` in your browser. It lists the test, its steps and its duration. The same run also wrote `logs/json-report.json`. The [reports guide](../results/reports-and-logs.md) explains both files and what is captured when a test fails.

If `npm run showreport` shows nothing, run `npm test` first so that `logs/html-report` exists.

## Run the tests in Docker

Community includes a `Dockerfile` and a `.dockerignore` in the project root. The image has Node.js 24, your locked dependencies, Chromium and the system libraries it needs, and it runs `npm test` by default. Docker must be installed and running.

```bash
docker build -t testtalon-community .
docker run --rm testtalon-community
```

To keep the reports and logs on your machine, mount the `logs` folder:

```bash
docker run --rm -v "$PWD/logs:/app/logs" testtalon-community
```

The image contains your project files, including `config/project-profiles`. Keep real credentials encrypted with dotenvx and pass the private key when you run the container (`-e DOTENV_PRIVATE_KEY_DEV=...` for the `dev` profile), or mount your own profile read-only so it is not stored in the image:

```bash
docker run --rm -v "$PWD/config/project-profiles/.env.dev:/app/config/project-profiles/.env.dev:ro" testtalon-community
```

`.dockerignore` keeps `.env.keys`, key files, `node_modules`, `dist` and `logs` out of the image.

## The sample Web tests

Community ships the Web tests below, all under `tests/sample/webapp/functional/community/`.
`browser.test.ts` is the bundled demo; the suites in `samples/` show the recommended
structure (object repository, `webActions`, small shared functions) on real situations.
They run in the `dev` project.

| File                                                    | What it shows                                                        | Network                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `community/browser.test.ts`                             | CSV data, `webActions`, object repository and local HTML             | None                                                                         |
| `community/samples/alerts-frame-windows.test.ts`        | JavaScript alert, confirm and prompt dialogs, an iframe, a new tab   | Local fixture                                                                |
| `community/samples/widgets.test.ts`                     | Accordion, tabs, slider, progress bar, date input and autocomplete   | Local fixture                                                                |
| `community/samples/har.test.ts`                         | Recording a HAR file and replaying it without the server             | Local server on 127.0.0.1                                                    |
| `community/samples/pdf-to-text.test.ts`                 | Reading the text of `data/web/pdf/sample.pdf`                        | None                                                                         |
| `community/samples/playwright-site-get-started.test.ts` | Following Get started on the Playwright home page (tagged `@Online`) | Always opens `https://playwright.dev`; no URL profile needed                 |
| `community/samples/todomvc-add-todo.test.ts`            | Adding a todo on the public TodoMVC site (tagged `@Online`)          | Always opens `https://demo.playwright.dev/todomvc/#/`; no URL profile needed |

The dialogs, frame and new-tab example opens the pages in `sample-app/alerts-frames-windows/` (`alerts.html`, `frame.html`, `popup.html`). `serveSampleApp(page.context(), 'alerts-frames-windows', origin)` from `@packages/web/lib/sample-app` answers requests to a made-up `origin` from those files, so any test can open the same pages with `page.goto(`${origin}/alerts`)`; no server is needed. The widgets example builds its pages inside the test with Playwright's `route`. These pages are fixtures, not features of a public site. Run every test that needs no network with `npm run test:web`. The Playwright-site `@Online` example always opens `https://playwright.dev`. The TodoMVC `@Online` example always opens `https://demo.playwright.dev/todomvc/#/`. Changing a profile URL does not redirect either example. Run online examples with the `test:online` script. Add your own Web tests under `tests/real-projects/webapp/functional/`.

### Product Store examples

`tests/sample/webapp/functional/community/product-store/` contains login and purchase examples for an external application. Configure a suitable project profile before opting into them. They are separate from the local smoke test and are not selected by the `@Offline` filter. Inspect a login example without executing it:

```bash
npx playwright test tests/sample/webapp/functional/community/product-store/login.test.ts --project=dev --list
```

The two sample browser projects select the Community directory, so pass `browser.test.ts` explicitly when you want only the local demo. See [the CI guide](../run/github-actions.md#restrict-the-sample-browser-job-to-the-local-demo) for the matching job command.

## What the bundled test does

`tests/sample/webapp/functional/community/browser.test.ts` is the example to copy from. It:

1. reads a value from `data/web/demo.csv`,
2. loads the local page `sample-app/community-demo/demo.html` (no network),
3. fills the form field and clicks the button using selectors from `object-repositories/gui/community-demo-gui.json`,
4. checks that the page shows the value from the CSV file.

## Next: set up your own Web project

Community ships `dev`, the browser projects of `packages/web/config/projects.ts` (`local`, `uat`, `prodBeta`, `prod`, `webkit` and the two device-emulation projects `Pixel 4a (5G)` and `iPhone 14 (mobile safari)`, which run in a desktop browser, not on a device) and two samples, `staging-chromium` and `qa-firefox`, each with a public demo profile. The profiles `local`, `dev`, `uat`, `prodBeta` and `prod` ship as fully commented templates. To run them, learn how a profile supplies the application address, and add your own project (a name, a browser, the tests to run and a profile), run them from the command line and from VS Code, follow the [Quick start in the projects guide](../configure/projects-and-environments.md#quick-start-your-first-web-projects). Select `browser.test.ts` as shown in that guide to run the local demo in Chromium and Firefox without an application account or external site. Running those projects without a filename filter also selects the Product Store examples.

## Your project at a glance

| Path                                                                          | What it is                                                                                                                                                                                                                                  | Do you edit it?     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `tests/real-projects/webapp/functional/`                                      | Your Web tests, named `*.test.ts`, with shared workflows in `tests/real-projects/webapp/common/`                                                                                                                                            | Yes                 |
| `tests/sample/`                                                               | The bundled examples to copy from, kept apart from your own tests                                                                                                                                                                           | No (read and copy)  |
| `object-repositories/gui/`                                                    | JSON files holding selectors, one per page                                                                                                                                                                                                  | Yes                 |
| `sample-app/`                                                                 | Sample applications the tests open locally, one folder each: the bundled demo page `community-demo/demo.html` and the dialogs, frame and new-tab pages in `alerts-frames-windows/`. Add your own folder and serve it with `serveSampleApp`. | Optional            |
| `playwright.config.ts`                                                        | Entry point for Playwright; where you add projects                                                                                                                                                                                          | Yes                 |
| `data/`                                                                       | Optional folder for your own test data (you create it)                                                                                                                                                                                      | Yes                 |
| `config/project-profiles/.env.<profile>`                                      | Optional settings for one environment, committed with your tests (no plain-text credentials; `config/project-profiles/.env.keys` is the one ignored file)                                                                                   | Yes, if you need it |
| `config/project-profiles/.env.example`                                        | Template of supported settings. Copy it; do not edit it                                                                                                                                                                                     | No                  |
| `packages/web/lib/`                                                           | Browser fixtures and `web-actions.ts`; shared helpers live in `packages/core/lib/`                                                                                                                                                          | No                  |
| `packages/core/lib/generate-data.ts`                                          | Random test-data generators                                                                                                                                                                                                                 | No                  |
| `packages/community/config/`                                                  | Default Playwright settings                                                                                                                                                                                                                 | No                  |
| `packages/community/distribution/`                                            | Customer validation scripts; root templates are materialized during export                                                                                                                                                                  | No                  |
| `packages/core/config/load-profile-data.ts`, `packages/core/config/logger.ts` | Profile loading and logging                                                                                                                                                                                                                 | No                  |
| `docs/guide/`                                                                 | These guides                                                                                                                                                                                                                                | No                  |
| `.github/workflows/testtalon-community-ci.yml`                                | The included GitHub Actions workflow                                                                                                                                                                                                        | Optional            |
| `logs/`                                                                       | Reports, failure artifacts and log files. Created by runs and ignored by Git                                                                                                                                                                | No                  |
| `dist/`                                                                       | Compiled output of `npm run build`. Ignored by Git                                                                                                                                                                                          | No                  |

Keep your changes in the folders marked "Yes". Leaving the framework folders alone means a future TestTalon update will not conflict with your work.

## Commands

| Command                                                                     | What it does                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                                  | Build, run the unit checks, then run the smoke test                                                                                                                                                                         |
| `npm run build`                                                             | Compile the project with TypeScript into `dist/`                                                                                                                                                                            |
| `npm run typecheck`                                                         | Check types without writing files                                                                                                                                                                                           |
| `npm run lint`                                                              | Check your tests against the TestTalon conventions (same as `npm run lint:tests`)                                                                                                                                           |
| `npm run test:unit`                                                         | Run the unit checks of the helper libraries                                                                                                                                                                                 |
| `npm run test:list`                                                         | List the tests of the default `dev` project without running them                                                                                                                                                            |
| `npm run test:smoke`                                                        | Run the bundled smoke test (`tests/sample/webapp/functional/community/browser.test.ts`)                                                                                                                                     |
| `npm run test:web`                                                          | Run bundled and customer Web tests tagged `@Offline` in `dev`, see [the sample tests](#the-sample-web-tests)                                                                                                                |
| the `test:online` script (start it with npm's run command, like the others) | Select bundled and customer tests tagged `@Online` in `dev`. Needs internet access; URL-dependent tests also need a matching profile                                                                                        |
| `npm run locator:extract -- --help`                                         | Show how to collect the selectors of a page into `object-repositories/gui/` (the `locator:extract` script needs a page address with `--url`). See [XPath locator strategies](../create-tests/xpath-locator-strategies.md) |
| `npm run showreport`                                                        | Open the HTML report                                                                                                                                                                                                        |

`npx playwright test ...` runs tests directly with any Playwright option. The [writing tests guide](../create-tests/writing-tests.md#run-your-tests) shows the commonly used forms.

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
  [dev] › tests/sample/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
  (one line for each of the other sample tests)
Total: 23 tests in 7 files
```

`npm run test:list` prints one line per test, so your list is longer once you add tests. The first line is the bundled test.

`npm run typecheck` prints nothing after its header when the types are correct.

## If something went wrong

| Symptom                                                                                                             | Fix                                                         |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `Executable doesn't exist`                                                                                          | Run `npx playwright install chromium`                       |
| `engines` or Node version error                                                                                     | Install Node.js 24 or later, then open a new terminal       |
| `npm ci` fails with `npm ci can only install packages when your package.json and package-lock.json ... are in sync` | Restore the original `package.json` and `package-lock.json` |
| `npm run showreport` shows nothing                                                                                  | Run `npm test` first                                        |

The [troubleshooting guide](../help/troubleshooting.md) covers more cases.

Next: [Write your own tests](../create-tests/writing-tests.md).
