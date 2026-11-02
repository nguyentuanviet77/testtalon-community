# Step 8: GitHub Actions

[Documentation home](../README.md) | Previous: [Reports and logs](../results/reports-and-logs.md) | Next: [Troubleshooting](../help/troubleshooting.md)

Community includes a GitHub Actions workflow that checks the project, runs the tests and saves the reports as downloadable artifacts on every push and pull request to `main` or `master`. This guide explains it, shows how to download the artifacts, how to run selected environments and browsers in CI, and covers secrets and common failures.

The workflows are templates. Community's license covers learning, evaluation, demonstrations and proofs of concept, so read `LICENSE.txt` before using them for business CI.

## The included workflow

The file `.github/workflows/testtalon-community-ci.yml` is part of your project:

```yaml title=".github/workflows/testtalon-community-ci.yml"
name: testtalon-community-ci

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read

jobs:
  community:
    name: Offline Web tests
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run typecheck
      - run: npm run lint:tests
      - run: npm run test:unit
      - run: npm run test:list
      - run: npm run test:web
      - name: Summarize the result
        if: ${{ !cancelled() }}
        run: |
          test -f logs/json-report.json || exit 0
          node -e "const s = require('./logs/json-report.json').stats; console.log('Offline Web tests: ' + s.expected + ' passed, ' + s.unexpected + ' failed, ' + s.skipped + ' skipped, ' + s.flaky + ' flaky')" >> "$GITHUB_STEP_SUMMARY"
      - name: Upload Playwright artifacts
        uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: playwright-artifacts
          path: |
            logs/html-report/
            logs/json-report.json
            logs/test-results/
          if-no-files-found: ignore
          retention-days: 14

  sample-projects:
    name: Sample browsers (offline Community demo)
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npx playwright install --with-deps chromium firefox
      - name: Run staging-chromium and qa-firefox
        # Both projects run the bundled Community demo locally in Chromium and Firefox.
        run: npx playwright test --project=staging-chromium --project=qa-firefox --retries=1
      - name: Upload Playwright artifacts
        uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: playwright-artifacts-sample-projects
          path: |
            logs/html-report/
            logs/json-report.json
            logs/test-results/
          if-no-files-found: ignore
          retention-days: 14
```

The workflow has two jobs that validate different project selections:

| Job                             | What it runs                                                                                                                                                                                                               | Artifact it saves                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `community` (Offline Web tests) | Builds, type-checks and lints the project, runs the unit checks, lists the tests, then runs every test that needs no network (`@Offline`, project `dev`)                                                                   | `playwright-artifacts`                 |
| `sample-projects`               | Runs the tests selected by `staging-chromium` and `qa-firefox`. Their directory contains the local demo and Product Store examples; it excludes the `samples/` subtree. Application examples need matching profile values. | `playwright-artifacts-sample-projects` |

| Line                                                                              | What it does                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `on: push` and `pull_request` with `branches: [main, master]`                     | Runs on pushes to, and pull requests against, `main` or `master`. Edit `branches` if your default branch has another name                                                                              |
| `permissions: contents: read`                                                     | Gives the jobs read-only access to your repository, the safest default                                                                                                                                 |
| `timeout-minutes: 30`                                                             | Stops a job that hangs instead of letting it run for hours                                                                                                                                             |
| `runs-on: ubuntu-latest`                                                          | Uses a GitHub-hosted Linux machine                                                                                                                                                                     |
| `actions/checkout`                                                                | Downloads your code                                                                                                                                                                                    |
| `actions/setup-node` with `node-version: '24'` and `cache: npm`                   | Installs Node.js 24 and caches npm downloads between runs                                                                                                                                              |
| `npm ci --ignore-scripts`                                                         | Installs the exact locked dependencies                                                                                                                                                                 |
| `npx playwright install --with-deps chromium` (and `firefox` in the second job)   | Installs the browsers and the Linux libraries they need                                                                                                                                                |
| `npm run build`, `typecheck`, `lint:tests`                                        | Compile, type-check and check the test conventions                                                                                                                                                     |
| `npm run test:unit`                                                               | Run the helper-library unit checks                                                                                                                                                                     |
| `npm run test:list`                                                               | Prove that Playwright can load and list the tests                                                                                                                                                      |
| `npm run test:web`                                                                | Run the sample Web tests that need no network (`@Offline`), including the bundled smoke test. It is the only Playwright run in the job, so the report holds every test                                 |
| `npx playwright test --project=staging-chromium --project=qa-firefox --retries=1` | Runs the two projects’ selected tests, including any matching Product Store examples. Add the local demo filename to restrict this to offline execution.                                               |
| `Summarize the result`                                                            | Writes the pass and fail counts from `logs/json-report.json` to the run's summary page                                                                                                                 |
| `actions/upload-artifact` with `if: ${{ !cancelled() }}`                          | Saves the reports even when tests fail, which is when you need them. It keeps them for 14 days, and `if-no-files-found: ignore` avoids a second error when a step failed before any report was written |

Playwright replaces its reports on every run, so a job should upload once, after its last Playwright command. That is why the first job runs `test:web` only (it already includes the smoke test) and why each job has its own artifact name.

Every step is a command you can run locally in the same order. If CI is red, run the failing step on your machine first.

### Turn it on

1. Put the project in a GitHub repository and push it.
2. Open the repository's **Actions** tab. The workflow named **testtalon-community-ci** appears after the first push.
3. A green check means every step passed. Click a run to read each step's log, and [download the reports](#download-the-reports).

## Restrict the sample browser job to the local demo

The shipped `sample-projects` command has no filename filter. Because the Community example directory also contains Product Store scenarios, that job is broader than the local smoke test. For a demo-only job, replace its run command with:

```bash
npx playwright test tests/sample/webapp/functional/community/browser.test.ts --project=staging-chromium --project=qa-firefox --retries=1
```

This selection uses local HTML in both browsers. Keep application scenarios as an explicit opt-in with their own project profiles. `npm test` and `npm run test:smoke` already select the local demo file; `npm run test:web` selects the `@Offline` suites.

The `@Offline` suites and an explicitly selected local demo need no credentials. Sample project profiles contain public example URLs; application scenarios require the profile values expected by those tests. Configure those jobs separately as described below.

## Run an environment in several browsers

The [projects guide](../configure/projects-and-environments.md) shows how to create projects named `<environment>-<browser>`. The workflow below runs them from GitHub: one job per environment and browser, started by hand or every night. Save it as `.github/workflows/environments.yml`:

```yaml title=".github/workflows/environments.yml"
name: Environments
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        environment: [qa, staging]
        browser: [chromium, firefox, webkit]
    env:
      QA_BASE_URL: ${{ vars.QA_BASE_URL }}
      STAGING_BASE_URL: ${{ vars.STAGING_BASE_URL }}
      REQUIRED_ENVIRONMENTS: ${{ matrix.environment }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npx playwright test --project=${{ matrix.environment }}-${{ matrix.browser }}
      - uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: report-${{ matrix.environment }}-${{ matrix.browser }}
          path: logs/html-report/
          retention-days: 14
          if-no-files-found: ignore
```

How it works:

- `matrix` creates six jobs (two environments times three browsers), each running its own project, for example `staging-webkit`.
- `fail-fast: false` lets the other jobs finish when one fails, so you see the whole picture.
- Each job installs only the browser it needs.
- `REQUIRED_ENVIRONMENTS` makes the job fail immediately with `Missing base URL for required environment(s): qa` if the matching variable is not set, instead of finding no project.
- `workflow_dispatch` adds a **Run workflow** button on the Actions tab. `schedule` runs the workflow nightly at 02:00 UTC.
- Every job uploads its HTML report, even when tests fail.

This workflow needs the root `playwright.config.ts` from the [projects guide](../configure/projects-and-environments.md#a-complete-playwrightconfigts), because the default configuration has only the `dev` project.

To run a project in Google Chrome or Microsoft Edge instead of Playwright's Chromium, install that browser in the job (`npx playwright install --with-deps chrome` or `npx playwright install --with-deps msedge`) and select the project that uses it. Do not rely on the runner already having the browser. The platform limits and the project definitions are in [Chrome and Edge in CI](../configure/projects-and-environments.md#chrome-and-edge-in-ci). Commit that file first. To use fewer browsers or environments, shorten the two lists in `matrix`.

To confirm a job's command works before you push, run it locally with the same variables:

```bash
QA_BASE_URL=https://qa.example.test npx playwright test tests/sample/webapp/functional/community/browser.test.ts --list --project=qa-firefox
```

```text
Listing tests:
  [qa-firefox] › tests/sample/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
Total: 1 test in 1 file
```

This needs the projects guide's `playwright.config.ts` to be in place.

## Secrets and variables

| Kind     | Where to create it                                                    | Use it for                                                   |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Variable | Repository **Settings > Secrets and variables > Actions > Variables** | Values that are not sensitive, such as environment base URLs |
| Secret   | Same page, **Secrets** tab                                            | Passwords, tokens and keys                                   |

Use them in a workflow with `${{ vars.NAME }}` and `${{ secrets.NAME }}`. Pass a secret to a single step instead of the whole job when you can:

```yaml snippet
      - run: npx playwright test --project=qa-chromium
        env:
          APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
```

Your test reads it with `process.env.APP_PASSWORD`. Rules:

- Never write a secret into a workflow file, a test, a data file or a plain-text profile. Profiles are committed with your source code.
- GitHub hides secrets in logs, but only exact matches. Do not print them or transform them.
- Pull requests from forks do not receive your secrets. Tests that need them are skipped or fail on fork pull requests by design.
- Prefer a dedicated test account with minimal rights over a real user's credentials.

Profiles (`config/project-profiles/.env.<name>`) are committed with your source code, so CI checks them out like any other file and tests read them the same way. Values that are not secret can stay in the profile. For a secret, encrypt the profile and store its private key as a CI secret, for example `DOTENV_PRIVATE_KEY_SHOP: ${{ secrets.DOTENV_PRIVATE_KEY_SHOP }}` for `config/project-profiles/.env.shop` ([Encrypt a profile](../configure/configuration-and-profiles.md#encrypt-a-profile-with-dotenvx)). `config/project-profiles/.env.keys` is ignored by Git and is never in CI. The selected profile owns its application values; matching workflow environment entries do not override them. CI can supply dotenvx decryption keys. Global settings use their own CI override scope.

## Download the reports

After every run, the included workflow saves the reports as **artifacts**. To download them:

1. Open the repository's **Actions** tab and click the run.
2. Scroll to **Artifacts** at the bottom of the run's summary page.
3. Download `playwright-artifacts` (the offline tests) or `playwright-artifacts-sample-projects`. GitHub gives you a zip file; unzip it.
4. Open the HTML report with Playwright: `npx playwright show-report path/to/unzipped/html-report`.

An artifact contains the three outputs of a run, as described in [Reports and logs](../results/reports-and-logs.md):

| In the zip         | What it is                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `html-report/`     | The interactive HTML report                                                                   |
| `json-report.json` | The same results as data, for scripts and dashboards                                          |
| `test-results/`    | For failed tests: screenshot, video, trace and error context (created only when a test fails) |

A downloaded trace opens with `npx playwright show-trace path/to/trace.zip`. See [Reports and logs](../results/reports-and-logs.md#investigate-a-failure). Artifacts are deleted after 14 days; change `retention-days` to keep them longer, or download what you need.

The [environments workflow](#run-an-environment-in-several-browsers) below uploads one HTML report per job, named `report-<environment>-<browser>`. To keep its failure evidence too, add a second upload to that job:

```yaml snippet
      - uses: actions/upload-artifact@v7
        if: ${{ failure() }}
        with:
          name: failures-${{ matrix.environment }}-${{ matrix.browser }}
          path: logs/test-results/
          if-no-files-found: ignore
```

## Useful variations

| Goal                                 | Change                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Run on another branch                | Add its name to `branches` under `push` or `pull_request`                                                                               |
| Run the sample projects only by hand | Add `workflow_dispatch:` under `on:` and `if: ${{ github.event_name == 'workflow_dispatch' }}` to the `sample-projects` job             |
| Run only fast tests                  | `npx playwright test --project=qa-chromium --grep @Smoke`                                                                               |
| Allow one retry in CI                | Set `retries: process.env.CI ? 1 : 0` in `playwright.config.ts` ([how](../configure/configuration-and-profiles.md#change-playwrights-defaults))      |
| Split a long run across machines     | Add a `shard` matrix and run `npx playwright test --shard=${{ matrix.shard }}/2` with `shard: [1, 2]`. Each shard writes its own report |
| Stop early after repeated failures   | `npx playwright test --max-failures=5`                                                                                                  |

## Troubleshooting CI

| Symptom                                                                                                  | Cause and fix                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Missing base URL for required environment(s): qa`                                                       | The `QA_BASE_URL` variable is not set. Create it under Actions variables                                                                                                                |
| `Project(s) "qa-firefox" not found`                                                                      | The matrix names a project that the configuration did not create. Commit the projects guide's `playwright.config.ts` and make sure the URL variable is set                              |
| `Executable doesn't exist`                                                                               | The job did not install that browser. Keep `npx playwright install --with-deps ${{ matrix.browser }}` before the test step                                                              |
| `npm ci` fails: `can only install packages when your package.json and package-lock.json ... are in sync` | Commit `package-lock.json` together with `package.json`                                                                                                                                 |
| The job is green but no report artifact appears                                                          | The test step failed before the report was written, or `path` is wrong. Check the step log                                                                                              |
| The artifact only holds the last Playwright run                                                          | Playwright replaces the reports on every run. Run `npx playwright test` once per job, or upload after each run under a different artifact name                                          |
| `sample-projects` is red but `community` is green                                                        | Check Chromium/Firefox installation, application profile values and failure artifacts. That job can select Product Store tests; use the explicit demo filename for an offline-only job. |
| Works locally, fails in CI                                                                               | Compare variables, Node version and browsers. Run the failing command locally with `CI=true` to get CI's headless behavior                                                              |
| `npm run lint:tests` fails                                                                               | A test breaks a convention. See [Check your conventions](../create-tests/writing-tests.md#check-your-conventions)                                                                                       |

More: [Troubleshooting](../help/troubleshooting.md).

Next: [Troubleshooting](../help/troubleshooting.md).
