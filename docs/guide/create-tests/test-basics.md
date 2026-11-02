# Test basics

[Documentation home](../README.md) | Previous: [Platform structure](../start/platform-structure.md)

A TestTalon test is a Playwright test that imports TestTalon's `test` object, keeps its selectors in an object repository and its data in a file, and reads like a short script of steps. This page shows the parts of a test, how to run it and how to check your conventions. The full tutorial is [Write your own tests](writing-tests.md).

## A complete test

The bundled sample `tests/sample/webapp/functional/community/browser.test.ts` loads a local page, fills a form with a value from a CSV file and checks the result:

```typescript
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@packages/web/lib/base-test";
import { readCsvDataFile } from "@packages/core/lib/common-funcs";
import { demo } from "@objectRepositories/gui/community-demo-gui.json";

test(
  "Community browser helpers display the CSV message",
  { tag: ["@GUI", "@Smoke", "@Offline"] },
  async ({ page, webActions }) => {
    const rows = readCsvDataFile("@data/web/demo.csv", [1]);
    expect(rows).toHaveLength(1);
    await test.step("Load the bundled browser example", async () => {
      await page.setContent(
        fs.readFileSync(
          path.resolve("sample-app/community-demo/demo.html"),
          "utf8",
        ),
      );
      await webActions.waitForPageLoad();
    });
    await test.step("Fill and submit the repository-backed form", async () => {
      await webActions.highlightAndFill(
        page.locator(demo.input),
        rows[0].message,
      );
      await webActions.highlightAndClick(page.locator(demo.submit));
    });
    await test.step("Verify the independently supplied CSV expectation", async () => {
      await expect(page.locator(demo.output)).toHaveText(rows[0].message);
    });
  },
);
```

Its selectors are in `object-repositories/gui/community-demo-gui.json`:

```json
{
  "demo": {
    "input": "#message",
    "submit": "#submit",
    "output": "#output"
  }
}
```

## The parts of a test

| Part                                                                   | What it is                                                                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `import { test, expect } from '@packages/web/lib/base-test'`           | The TestTalon test object. Always import from here, not from `@playwright/test`: it adds the `webActions` fixture and loads the project's profile around each test |
| `import { demo } from '@objectRepositories/gui/...'`                   | The selectors for one page. The root key matches the file name                                                                                                     |
| `test('title', { tag: [...] }, async ({ page, webActions }) => {...})` | One test. The title appears in reports and the tags let you select tests                                                                                           |
| `page`                                                                 | The Playwright page. Every test gets a fresh browser context                                                                                                       |
| `webActions`                                                           | The TestTalon browser helpers: waiting, clicking, filling, dialogs, downloads. See [Browser helpers](web-actions.md)                    |
| `test.step('...', async () => {...})`                                  | A named group of actions that appears in the HTML report                                                                                                           |
| `expect(...)`                                                          | Playwright assertions. They retry until they pass or the timeout ends (10 seconds by default)                                                                      |
| `readCsvDataFile`                                                      | Reads rows from a CSV file. See [Test data](test-data.md)                                                                    |

## Run your test

```bash
npx playwright test tests/sample/webapp/functional/community/browser.test.ts --project=dev
npx playwright test --project=dev --grep @Smoke
npx playwright test tests/real-projects --project=dev --headed
npm run showreport
```

- The first command runs one file, the second every test tagged `@Smoke`, and the third runs your own tests with the browser visible.
- `--project=<name>` chooses the environment and browser. Without a CI variable the browser is visible; with `CI` set it runs headless.
- Add `--debug` to step through a test, `--ui` to use Playwright's UI mode, and `--workers=1` to run one test at a time.
- `npm run showreport` opens the HTML report written to `logs/html-report/`.

## Check your conventions

```bash
npm run lint
```

The checker reads every `.ts` file under `tests/` and reports tests that import from `@playwright/test`, test files that do not import `test` from `@packages/web/lib/base-test`, and selectors written inline instead of coming from an object repository. It exits with a non-zero status when it finds a problem, so a CI job can fail on it.

## Next

- [Write your own tests](writing-tests.md)
- [Test data](test-data.md)
- [Run tests and read reports](../results/reports-and-logs.md)
