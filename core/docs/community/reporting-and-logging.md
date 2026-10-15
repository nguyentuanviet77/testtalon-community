# Step 7: Reports and logs

[Documentation index](README.md) | Previous: [Playwright projects and environments](projects-and-environments.md) | Next: [GitHub Actions](github-actions.md)

Every run of Community produces a console summary, an HTML report, a JSON report, failure artifacts and a log file. This guide shows where each one is, how to read it, how to investigate a failed test, and how to change what is captured. Everything here uses Playwright's built-in reporting plus TestTalon's basic logger; no account or service is involved.

## The three Community reporters

Community reports with exactly three Playwright reporters. They are set once, in TestTalon's default configuration, and every project uses them:

```ts
  reporter: [
    ['list'],
    ['html', { outputFolder: './logs/html-report', open: 'never' }],
    ['json', { outputFile: './logs/json-report.json' }],
  ],
```

| Reporter | What it gives you | Where | Use it for |
| --- | --- | --- | --- |
| `list` | One line per test as it finishes, then a summary | Your terminal | Watching a run, and reading a CI log |
| `html` | An interactive report with steps, errors and attachments. `open: 'never'` means it is never opened for you | `logs/html-report/` | Investigating a run; sharing it as an artifact |
| `json` | Every suite, test, result and error as data | `logs/json-report.json` | Scripts, dashboards and CI summaries |

All three are part of Playwright itself. Community has no custom reporter file and installs no reporter plugin, so there is nothing else to configure. The sections below show each output; [Use the reports in CI](#use-the-reports-in-ci) shows how to keep and read them in a pipeline.

## What a run produces

| Output | Location | Created |
| --- | --- | --- |
| Console summary (list reporter) | Your terminal | Every run |
| HTML report | `logs/html-report/` (open `index.html`, or run `npm run showreport`) | Every run |
| JSON report | `logs/json-report.json` | Every run |
| Failure artifacts: screenshot, video, trace, error context | `logs/test-results/<test-folder>/` | For failed tests |
| Log file | `logs/info-<date>.log` | Every run that uses the `webActions` or `logger` |

The `logs/` folder is ignored by Git. Each new run replaces the HTML report, the JSON report and the failure artifacts of the previous run; copy them elsewhere if you need to keep them (a CI job uploads them as artifacts, see the [GitHub Actions guide](github-actions.md#download-the-reports)).

## The console summary

```bash
npx playwright test tests/webapp/functional/community --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message @GUI @Smoke @Offline (1.8s)

  1 passed (3.3s)
```

Each line shows the result, the project in brackets, the file and line, the test title, its tags and its duration. A failed test is marked `✘`, a skipped one `-`. The final lines count passed, failed, skipped and flaky tests (flaky means a test failed and then passed on a retry).

## The HTML report

```bash
npm run showreport
```

This runs `playwright show-report logs/html-report` and opens a local page. In the report you can filter by status, search by title or tag, and open a test to see its steps (the `test.step` blocks you wrote), annotations such as the `Project` name, errors and attachments. The report is a static folder, so you can also zip `logs/html-report` and send it to a colleague who opens `index.html` through Playwright's `show-report` command.

If the command shows an empty page or an error, no report exists yet: run `npm test` first.

Ways to open a report:

| Where the report is | Command |
| --- | --- |
| Your own run | `npm run showreport` |
| A folder you were sent, or an unzipped CI artifact | `npx playwright show-report path/to/html-report` |

Use `show-report` rather than double-clicking `index.html`: it serves the report, which is what lets the embedded traces and screenshots load.

## The JSON report

`logs/json-report.json` contains every suite, test, result and error in machine-readable form. Its `stats` section is the quickest summary:

```bash
node -e "const s = require('./logs/json-report.json').stats; console.log(s.expected + ' passed, ' + s.unexpected + ' failed, ' + s.skipped + ' skipped, ' + s.flaky + ' flaky')"
```

```text
1 passed, 0 failed, 0 skipped, 0 flaky
```

Use the JSON file as input for your own scripts or dashboards. `expected` counts tests that finished as expected (passed), `unexpected` counts failures.

## Investigate a failure

Create a test that fails on purpose so you can see what is captured. It expects the wrong greeting:

```ts title="tests/webapp/functional/learn/failing.test.ts" fails
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@core/lib/BaseTest';
import { lab } from '@objectRepositories/GUI/labGUI.json';

test('shows the wrong greeting on purpose', { tag: ['@GUI'] }, async ({ page, webActions }) => {
    await page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
    await webActions.highlightAndFill(page.locator(lab.nameInput), 'Ada');
    await webActions.highlightAndClick(page.locator(lab.greetButton));
    await expect(page.locator(lab.greeting)).toHaveText('Hello, Grace!');
});
```

```bash
npx playwright test tests/webapp/functional/learn/failing.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✘  1 [dev] › tests/webapp/functional/learn/failing.test.ts:6:5 › shows the wrong greeting on purpose @GUI (10.9s)

  1) [dev] › tests/webapp/functional/learn/failing.test.ts:6:5 › shows the wrong greeting on purpose @GUI ─

    Error: expect(locator).toHaveText(expected) failed

    Locator:  locator('#greeting')
    Expected: "Hello, Grace!"
    Received: "Hello, Ada!"
    Timeout:  10000ms

       8 |     await webActions.highlightAndFill(page.locator(lab.nameInput), 'Ada');
       9 |     await webActions.highlightAndClick(page.locator(lab.greetButton));
    > 10 |     await expect(page.locator(lab.greeting)).toHaveText('Hello, Grace!');
         |                                              ^

    attachment #1: screenshot (image/png) ───────────────────────────────────────
    logs/test-results/functional-learn-failing-shows-the-wrong-greeting-on-purpose-dev/test-failed-1.png

    attachment #2: video (video/webm) ───────────────────────────────────────────
    logs/test-results/functional-learn-failing-shows-the-wrong-greeting-on-purpose-dev/video.webm

    Error Context: logs/test-results/functional-learn-failing-shows-the-wrong-greeting-on-purpose-dev/error-context.md

    attachment #4: trace (application/zip) ───────────────────────────────────────
    logs/test-results/functional-learn-failing-shows-the-wrong-greeting-on-purpose-dev/trace.zip

  1 failed
```

The run took about ten seconds because `expect` waited its full 10-second timeout before giving up. Work through a failure in this order:

1. **Read the error.** It names the expectation, the selector, the expected and received values, and the line of your test that failed.
2. **Look at the screenshot** (`test-failed-1.png`) and the **video** (`video.webm`) to see what the page looked like.
3. **Open the trace**:

   ```bash
   npx playwright show-trace logs/test-results/functional-learn-failing-shows-the-wrong-greeting-on-purpose-dev/trace.zip
   ```

   The trace viewer is a time line of every action with before and after snapshots of the page, the console, the network and the source. It is the most useful artifact for a failure you cannot reproduce on your machine.
4. **Re-run just that test** with the browser visible, or step through it:

   ```bash
   npx playwright test tests/webapp/functional/learn/failing.test.ts --project=dev --headed
   npx playwright test tests/webapp/functional/learn/failing.test.ts --project=dev --debug
   ```
5. **Check the log file** for messages your test or the helpers wrote (see [Log files](#log-files)).

Delete `tests/webapp/functional/learn/failing.test.ts` afterwards so later runs stay green. If a test fails sometimes and passes sometimes, run it many times to measure it: `npx playwright test <file> --project=dev --repeat-each=10`.

### What is captured, and when

| Artifact | Default | Meaning |
| --- | --- | --- |
| Screenshot | `only-on-failure` | A picture of the page when the test fails |
| Video | `retain-on-failure` | A recording that is kept only for failed tests |
| Trace | `retain-on-failure` | A full trace that is kept only for failed tests |
| Error context | for failed tests | A text snapshot of the page, `error-context.md` |

To capture more or less, change `use.screenshot`, `use.video` or `use.trace` in your root `playwright.config.ts` (see [Configuration and profiles](configuration-and-profiles.md#change-playwrights-defaults)), or force a trace for one run from the command line:

```bash
npx playwright test tests/webapp/functional/community --project=dev --trace on
```

Traces and videos make a run slower and use disk space, so leave them on `retain-on-failure` for normal runs.

## Choose reporters

The default configuration uses three reporters: `list`, `html` and `json`. Playwright also offers `line`, `dot`, `junit`, `github` and `blob`. For one run, choose reporters on the command line; this **replaces** the configured reporters for that run, so the HTML and JSON reports are not written:

```bash
npx playwright test tests/webapp/functional/community --project=dev --reporter=dot
```

To add a reporter permanently, set the `reporter` list in your root `playwright.config.ts`. This example keeps the three defaults and adds a JUnit XML file, which many CI systems can display:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';

export default defineConfig({
  ...communityConfig,
  reporter: [
    ['list'],
    ['html', { outputFolder: './logs/html-report', open: 'never' }],
    ['json', { outputFile: './logs/json-report.json' }],
    ['junit', { outputFile: './logs/junit.xml' }],
  ],
});
```

```bash
npx playwright test tests/webapp/functional/community --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message @GUI @Smoke @Offline (1.8s)

  1 passed (3.3s)
```

`logs/junit.xml` now exists next to the other reports. Remove the `reporter` list from your root `playwright.config.ts` when you no longer need it, and the three defaults apply again. The `reporter` option is global: it cannot be set per project.

## Use the reports in CI

In a pipeline, the `list` output is already in the job log. The included [GitHub Actions workflow](github-actions.md#the-included-workflow) keeps the other two (and the failure evidence) as one downloadable artifact per job, and uploads it even when tests fail:

```yaml snippet
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
```

It also puts the result on the run's summary page by reading the `stats` of the JSON report, in a step that runs when tests fail too:

```yaml snippet
      - name: Summarize the result
        if: ${{ !cancelled() }}
        run: |
          test -f logs/json-report.json || exit 0
          node -e "const s = require('./logs/json-report.json').stats; console.log('Offline Web tests: ' + s.expected + ' passed, ' + s.unexpected + ' failed, ' + s.skipped + ' skipped, ' + s.flaky + ' flaky')" >> "$GITHUB_STEP_SUMMARY"
```

The step that runs Playwright already fails the job when a test fails, so the JSON file is for reporting, not for deciding. [Download the reports](github-actions.md#download-the-reports) explains how to open a downloaded artifact. Playwright replaces the reports on every run, so a job should upload once, after its last Playwright command, with an artifact name of its own.

## Log files

Importing `test` from `@core/lib/BaseTest` also loads TestTalon's logger. It redirects `console.log`, `console.info`, `console.warn`, `console.error` and `console.debug` into a rotating log file, so anything your tests or helpers print is kept.

| Property | Value |
| --- | --- |
| File | `logs/info-<YYYY-MM-DD>.log`, one file per day |
| Content | Every level, from debug to error |
| Line format | `[2026-10-13 16:33:10.059][WARN] - a warning` |
| Rotation | A new file after 10 MB; files older than 14 days are removed; rotated files are compressed |
| Index | `logs/info-audit.json` tracks the log files |

You can use the logger directly as well:

```ts title="tests/webapp/functional/learn/logging.test.ts"
import { test } from '@core/lib/BaseTest';
import logger from '@config/logger';

test('writes to the log file', async () => {
    console.log('plain console message');
    logger.info('direct logger message');
    console.error(new Error('login failed with password=hunter2'));
});
```

```bash
npx playwright test tests/webapp/functional/learn/logging.test.ts --project=dev
```

```text
Running 1 test using 1 worker

[2026-10-13 16:33:10.059][INFO] - plain console message
plain console message
[2026-10-13 16:33:10.059][INFO] - direct logger message
direct logger message
[2026-10-13 16:33:10.060][ERROR] - login failed with password=***
login failed with password=***
  ✓  1 [dev] › tests/webapp/functional/learn/logging.test.ts:4:5 › writes to the log file (3ms)

  1 passed (0.8s)
```

`@config/logger` also exports four helpers: `originalConsole` (the console methods as they were before the redirect, to print without writing to the log), `formatArgs(args)` (the text the logger would write for a list of values), `describeError(error)` (an error's name and message with credentials masked) and `redactSensitive(text)` (masks credentials in any text).

Notes:

- Outside production mode each message appears twice on the console: once formatted with a time stamp, and once as plain text. The log file receives only the formatted line.
- An `Error` object passed to `console.error` is reduced to its name and message, and obvious credentials in it (`password=...`, tokens, `user:password@` in URLs) are masked as `***`. Ordinary text that you print is **not** masked, so never print secrets.
- Log files are for you and can contain what your tests print. Do not share them without reading them first.

## Keep reports tidy

- Do not commit anything under `logs/`; it is already ignored.
- Clear old artifacts by deleting the folder: `rm -rf logs/html-report logs/test-results` (Windows PowerShell: `Remove-Item -Recurse -Force logs/html-report, logs/test-results`).
- In CI, upload `logs/html-report/`, `logs/json-report.json` and `logs/test-results/` as an artifact for every run, including failed ones (the included workflow does).

Next: [GitHub Actions](github-actions.md).
