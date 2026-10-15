# Step 4: Test data

[Documentation index](README.md) | Previous: [Browser helpers](web-actions.md) | Next: [Configuration and profiles](configuration-and-profiles.md)

Tests are easier to maintain when the data lives outside the code. This guide covers the data helpers in Community: reading and writing CSV files, running one test for every row of a file, generating random data, reading Excel, text and PDF files, and a few small utility functions.

Every helper here is exported from `@core/lib/CommonFuncs` (reading and writing), `@core/lib/GenerateData` (random data) or the `webActions` fixture (files). The examples use the practice files from [Step 2](writing-tests.md#create-the-practice-files).

## Where data lives

| Kind of data | Suggested location |
| --- | --- |
| Rows for data-driven tests | A CSV next to the test, or under `data/` |
| Files your tests read, such as downloaded Excel files | `data/downloads/` (the Excel helper reads from here) |
| Selectors and visible texts | `objectRepositories/GUI/` (not test data; see [Step 2](writing-tests.md#step-1-put-selectors-in-an-object-repository)) |
| Secrets and passwords | Never in a data file. Use [profiles or CI secrets](configuration-and-profiles.md#secrets) |

Paths are resolved from the project root, the folder you run commands from.

## Read a CSV file

Create a small data file. The first row holds the column names.

```csv title="tests/webapp/functional/learn/lab.csv"
name,expected
Ada,"Hello, Ada!"
Grace,"Hello, Grace!"
Linus,"Hello, Linus!"
```

```text
readCsvDataFile(
  file: string,
  rows: number | string | (number | string)[] = [],
  isIncludeHeaders = false
): Array<Record<string, string>>
```

`readCsvDataFile` returns one object per row, keyed by the column names. Values are always strings, and surrounding spaces are trimmed. Quoted values may contain commas.

| Call | Returns |
| --- | --- |
| `readCsvDataFile(file)` | Every row |
| `readCsvDataFile(file, 'all')` | Every row |
| `readCsvDataFile(file, 2)` | Row 2 only |
| `readCsvDataFile(file, [1, 3])` | Rows 1 and 3 |
| `readCsvDataFile(file, '2-3')` | Rows 2 to 3 |
| `readCsvDataFile(file, [1, '2-3'])` | A mix of rows and ranges |
| `readCsvDataFile(file, 'all', true)` | Every line as an array of strings, including the header line |

Row numbers start at 1 and **do not count the header line**. Give a single row as a **number** (`3`): a string is accepted only for a range such as `'2-3'` or for `'all'`, and any other string, for example `'3'`, is silently ignored. A row listed twice is returned once, and rows come back in the order you list them. If the file does not exist, an error is written to the log and an empty array is returned, so check the length when a missing file would be a mistake.

```ts title="tests/webapp/functional/learn/csv-helpers.test.ts"
import fs from 'node:fs';
import { test, expect } from '@core/lib/BaseTest';
import { readCsvDataFile, appendCSVData, appendCSVDataRows, appendRowToCsv } from '@core/lib/CommonFuncs';

const file = 'tests/webapp/functional/learn/lab.csv';

test('reads all rows, selected rows and ranges', async () => {
    expect(readCsvDataFile(file)).toHaveLength(3);
    expect(readCsvDataFile(file, [1, 3])).toEqual([
        { name: 'Ada', expected: 'Hello, Ada!' },
        { name: 'Linus', expected: 'Hello, Linus!' },
    ]);
    expect(readCsvDataFile(file, '2-3').map(row => row.name)).toEqual(['Grace', 'Linus']);
    expect(readCsvDataFile(file, 'all', true)[0]).toEqual(['name', 'expected']);
});

test('appends rows and skips rows whose first column already exists', async () => {
    const target = 'data/generated/people.csv';
    fs.rmSync(target, { force: true });
    appendCSVData(target, { id: 1, name: 'Ada', active: true });
    appendCSVData(target, { id: 1, name: 'Duplicate', active: false });
    appendCSVDataRows(target, [
        { id: 2, name: 'Grace', active: true },
        { id: 3, name: 'Linus', active: false },
    ]);
    appendRowToCsv(target, { id: 4, name: 'Margaret', active: true });
    expect(fs.readFileSync(target, 'utf8')).toBe('id,name,active\n1,Ada,true\n2,Grace,true\n3,Linus,false\n4,Margaret,true\n');
});
```

```bash
npx playwright test tests/webapp/functional/learn/csv-helpers.test.ts --project=dev
```

```text
Running 2 tests using 2 workers

  ✓  1 [dev] › tests/webapp/functional/learn/csv-helpers.test.ts:7:5 › reads all rows, selected rows and ranges (6ms)
  ✓  2 [dev] › tests/webapp/functional/learn/csv-helpers.test.ts:17:5 › appends rows and skips rows whose first column already exists (5ms)

  2 passed (1.1s)
```

### Write a CSV file

| Helper | What it does |
| --- | --- |
| `appendCSVData(file, row)` | Appends one row |
| `appendCSVDataRows(file, rows)` | Appends several rows |
| `appendRowToCsv(file, row)` | Same as `appendCSVData` |

Each `row` is a `CSVRow` (exported by `@core/lib/CommonFuncs`, along with `CSVFieldValue`): an object whose keys are column names and whose values are text, numbers or booleans. The helpers create the file and its folder when needed, write the header line from the first row's keys, and match later rows to the existing header by name. **A row is skipped when a row with the same first-column value already exists**, which makes the helpers safe to call more than once for the same record. Rows are never updated or deleted.

## Data-driven tests

A data-driven test runs the same steps for every row of a file. Create one Playwright test per row with an ordinary loop. Each row is reported separately, so a failure names the row.

```ts title="tests/webapp/functional/learn/data-driven.test.ts"
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@core/lib/BaseTest';
import { readCsvDataFile } from '@core/lib/CommonFuncs';
import { lab } from '@objectRepositories/GUI/labGUI.json';

const rows = readCsvDataFile('tests/webapp/functional/learn/lab.csv');

for (const row of rows) {
    test(`greets ${row.name}`, { tag: ['@GUI', '@DataDriven'] }, async ({ page, webActions }) => {
        await page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
        await webActions.highlightAndFill(page.locator(lab.nameInput), row.name);
        await webActions.highlightAndClick(page.locator(lab.greetButton));
        await expect(page.locator(lab.greeting)).toHaveText(row.expected);
    });
}
```

```bash
npx playwright test tests/webapp/functional/learn/data-driven.test.ts --project=dev
```

```text
Running 3 tests using 2 workers

  ✓  1 [dev] › tests/webapp/functional/learn/data-driven.test.ts:10:9 › greets Ada @GUI @DataDriven (700ms)
  ✓  2 [dev] › tests/webapp/functional/learn/data-driven.test.ts:10:9 › greets Grace @GUI @DataDriven (710ms)
  ✓  3 [dev] › tests/webapp/functional/learn/data-driven.test.ts:10:9 › greets Linus @GUI @DataDriven (350ms)

  3 passed (1.9s)
```

Keep the expected value in the data file as well as the input, as in `lab.csv`. A test that computes its expectation with the same logic as the page cannot catch a bug in that logic.

Give each row a unique, readable title. Two tests with the same title in one file are an error.

## Different data for each environment

When the same test runs in several [environments](projects-and-environments.md), each may need its own data: a user that exists in QA may not exist in Staging. A simple pattern is one data file per environment, named after the project's profile, `metadata.envProfile`. The default `dev` project uses `dev`, and the environment projects from the projects guide use their environment name (`qa`, `staging`, and so on).

```csv title="tests/webapp/functional/learn/users.dev.csv"
name,expected
Ada,"Hello, Ada!"
```

```csv title="tests/webapp/functional/learn/users.qa.csv"
name,expected
Grace,"Hello, Grace!"
Linus,"Hello, Linus!"
```

```ts title="tests/webapp/functional/learn/environment-data.test.ts"
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@core/lib/BaseTest';
import { readCsvDataFile } from '@core/lib/CommonFuncs';
import { lab } from '@objectRepositories/GUI/labGUI.json';

test('greets every user configured for this environment', async ({ page, webActions }, testInfo) => {
    const environment = String(testInfo.project.metadata.envProfile);
    const rows = readCsvDataFile(`tests/webapp/functional/learn/users.${environment}.csv`);
    expect(rows.length, `No data file for environment "${environment}"`).toBeGreaterThan(0);
    await page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
    for (const row of rows) {
        await test.step(`Greet ${row.name}`, async () => {
            await webActions.highlightAndFill(page.locator(lab.nameInput), row.name);
            await webActions.highlightAndClick(page.locator(lab.greetButton));
            await expect(page.locator(lab.greeting)).toHaveText(row.expected);
        });
    }
});
```

```bash
npx playwright test tests/webapp/functional/learn/environment-data.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/learn/environment-data.test.ts:7:5 › greets every user configured for this environment (790ms)

  1 passed (1.6s)
```

With the environment projects from the projects guide in place and `QA_BASE_URL` set, `--project=qa-chromium` reads `users.qa.csv` instead. The test reads the data inside the test body, where the project is known, so one test covers all the rows of that environment's file. If an environment has no file, the assertion fails with a message that names it, instead of silently testing nothing. Keep real credentials out of these files; use [secrets](configuration-and-profiles.md#secrets) for those.

## Generate random data

`@core/lib/GenerateData` creates random but well-formed data, useful for unique names and emails.

| Function | Returns |
| --- | --- |
| `randomNumber(length)` | A string of digits |
| `randomString(length)` | A string of letters |
| `randomAlphaNumeric(length)` | A string of letters and digits |
| `randomStringFromCharSet(length, characters)` | A string built only from the characters you give |
| `randomBoolean()` | `true` or `false` |
| `randomIntInRange(min, max)` | An integer from `min` to `max`. Throws if `min` is greater than `max` |
| `randomFloatInRange(min, max)` | A decimal number between `min` and `max`. Throws if `min` is greater than `max` |
| `randomDateInRange(start, end)` | A `Date` between two dates |
| `randomDateLessThanToday()` | A `Date` in the past |
| `randomDateGreaterThanToday()` | A `Date` in the future |
| `randomPick(array)` | One element of the array |
| `generateAccountName()` | A name such as `Jessyca_Conn_1791883801048`, unique per millisecond |
| `generateAccountPassword(length = 12)` | A memorable password of the given length |
| `generateAccountEmail(provider)` | An email such as `Emanuel.Hand@example.test` for the domain you pass |

Use a domain you control or a reserved one such as `example.test` for generated emails, so no message reaches a real person.

```ts title="tests/webapp/functional/learn/generated-data.test.ts"
import { test, expect } from '@core/lib/BaseTest';
import { randomNumber, randomString, randomAlphaNumeric, randomStringFromCharSet, randomIntInRange, randomFloatInRange,
    randomDateLessThanToday, randomDateGreaterThanToday, randomPick, generateAccountName, generateAccountPassword,
    generateAccountEmail } from '@core/lib/GenerateData';

test('generated values have the requested shape', async () => {
    expect(randomNumber(8)).toMatch(/^\d{8}$/);
    expect(randomString(8)).toMatch(/^[a-zA-Z]{8}$/);
    expect(randomAlphaNumeric(8)).toMatch(/^[a-zA-Z0-9]{8}$/);
    expect(randomStringFromCharSet(8, 'XY')).toMatch(/^[XY]{8}$/);
    expect(randomIntInRange(5, 5)).toBe(5);
    expect(randomFloatInRange(1, 2)).toBeGreaterThanOrEqual(1);
    expect(randomDateLessThanToday().getTime()).toBeLessThan(Date.now());
    expect(randomDateGreaterThanToday().getTime()).toBeGreaterThan(Date.now());
    expect(randomPick(['only'])).toBe('only');
    expect(generateAccountName()).toMatch(/_\d+$/);
    expect(generateAccountPassword(16)).toHaveLength(16);
    expect(generateAccountEmail('example.test')).toMatch(/@example\.test$/);
});
```

```bash
npx playwright test tests/webapp/functional/learn/generated-data.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/learn/generated-data.test.ts:6:5 › generated values have the requested shape (9ms)

  1 passed (1.0s)
```

## Files: Excel, text and PDF

These helpers are methods of `webActions`.

| Helper | Use it to |
| --- | --- |
| `readDataFromExcel(fileName, sheetName, rowNumber, columnNumber)` | Read one cell of an `.xlsx` file in `data/downloads/` as text. Row and column numbers start at 1. Include the extension in `fileName`, for example `'prices.xlsx'`. Returns `null` when the file or sheet is missing (a message is logged) or the cell is empty |
| `readValuesFromTextFile(filePath)` | Read a whole UTF-8 text file |
| `writeDataIntoTextFile(filePath, data)` | Start writing text or bytes to a file. The promise resolves once the write has been started, not finished, so read the file back only after a short wait. Node's `fs.writeFileSync` is the better choice when you need the file straight away |
| `getPDFText(filePath)` | Return the text of every page of a PDF as one string |
| `getPdfPageText(pdf, pageNumber)` | Return the text of one page of a PDF document that is already open with `pdfjs-dist-es5`. `getPDFText` calls it for every page, so you rarely need it directly |

A cell holding a number is returned as text (`'4.5'`), and a cell holding a rich value such as a formula or hyperlink is returned as JSON text.

The example below creates its own workbook and PDF, so it runs offline. It uses `exceljs` and `playwright`, which are installed with Community.

```ts title="tests/webapp/functional/learn/data-files.test.ts"
import fs from 'node:fs';
import { chromium } from 'playwright';
import { Workbook } from 'exceljs';
import { test, expect } from '@core/lib/BaseTest';

test('reads an Excel cell, a text file and a PDF', async ({ webActions }) => {
    fs.mkdirSync('data/downloads', { recursive: true });

    const workbook = new Workbook();
    workbook.addWorksheet('Prices').addRow(['Notebook', 4.5]);
    await workbook.xlsx.writeFile('data/downloads/prices.xlsx');
    expect(await webActions.readDataFromExcel('prices.xlsx', 'Prices', 1, 1)).toBe('Notebook');
    expect(await webActions.readDataFromExcel('prices.xlsx', 'Prices', 1, 2)).toBe('4.5');
    expect(await webActions.readDataFromExcel('prices.xlsx', 'Missing', 1, 1)).toBeNull();

    await webActions.writeDataIntoTextFile('data/downloads/note.txt', 'saved by webActions');
    await webActions.delay(200);
    expect(await webActions.readValuesFromTextFile('data/downloads/note.txt')).toBe('saved by webActions');

    const browser = await chromium.launch();
    const printable = await browser.newPage();
    await printable.setContent('<h1>Hello PDF</h1>');
    await printable.pdf({ path: 'data/downloads/hello.pdf' });
    await browser.close();
    expect(await webActions.getPDFText('data/downloads/hello.pdf')).toContain('Hello PDF');
});
```

```bash
npx playwright test tests/webapp/functional/learn/data-files.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/learn/data-files.test.ts:6:5 › reads an Excel cell, a text file and a PDF (480ms)

  1 passed (1.4s)
```

The run also logs `Sheet "Missing" not found in prices.xlsx`, which is the expected warning for the last Excel assertion.

## Other small helpers

All are exported from `@core/lib/CommonFuncs`.

| Helper | Use it to |
| --- | --- |
| `equalsIgnoreCase(a, b)` | Compare two strings ignoring case. Throws if either value is missing or not a string |
| `redefineTestLocator(locator, replacements)` | Fill placeholders in a selector: `redefineTestLocator('#user-{id}', { '{id}': '42' })` returns `#user-42` |
| `removeColorCodesFromString(value)` | Remove terminal color codes from a string, or from every string inside an object or array |
| `writeTestAnnotation(type, description)` | Add a label to the running test; it appears in the HTML report |
| `ffForNotRunTest(profiles)` | Skip the running test when the `RUN_ENV` environment variable matches an entry of the array you pass, for example `ffForNotRunTest(['qa'])` with `RUN_ENV=qa`. Community does not set `RUN_ENV` for you, so the test is never skipped unless you do. Pass an array: a plain string is matched as a substring |
| `formatLocalTime(date)` | Format a date in the machine's time zone with its UTC offset, for example `1970-01-01 08:00:00.000 UTC+08:00` |
| `getCpuInfo()` | Return the CPU core count, model and speed |
| `getScreenSize()` | Return the main display's width and height, or 1270 x 720 when it cannot be read |
| `getScreenSizeWindows()`, `getScreenSizeMac()`, `getScreenSizeLinux()` | The per-platform readers behind `getScreenSize()`. Each runs a system command (PowerShell, `system_profiler` or `xrandr`) and returns 1270 x 720 when it fails |
| `getTestResultObject(report, testTitle)` | Find one test in a parsed JSON report. `extractFailedTestSteps` uses it; the test must be inside a `test.describe` block |
| `extractFailedTestSteps(reportPath, testTitle)` | Read `logs/json-report.json` and return the steps of a failed test, each with its `title` and, for the failing step, its `error` message. The test must be inside a `test.describe` block |

```ts title="tests/webapp/functional/learn/helpers.test.ts"
import { test, expect } from '@core/lib/BaseTest';
import { equalsIgnoreCase, redefineTestLocator, removeColorCodesFromString, writeTestAnnotation, ffForNotRunTest,
    formatLocalTime } from '@core/lib/CommonFuncs';

test('small helpers', async () => {
    writeTestAnnotation('Owner', 'qa-team');
    ffForNotRunTest('retired-environment');
    expect(equalsIgnoreCase('Hello', 'hello')).toBe(true);
    expect(() => equalsIgnoreCase('a', undefined as unknown as string)).toThrow('must be defined');
    expect(redefineTestLocator('#user-{id}', { '{id}': '42' })).toBe('#user-42');
    expect(removeColorCodesFromString('\u001b[31mred\u001b[0m')).toBe('red');
    expect(formatLocalTime(new Date(0))).toMatch(/^1970-01-01 \d{2}:\d{2}:\d{2}\.\d{3} UTC[+-]\d{2}:\d{2}$/);
});
```

```bash
npx playwright test tests/webapp/functional/learn/helpers.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/learn/helpers.test.ts:5:5 › small helpers (4ms)

  1 passed (1.0s)
```

## The older `readDataFromFile` helper

`readDataFromFile(filepath, selection = ['All'])` also reads CSV files, but in a simpler way: it splits every line at each comma, treats the header as row 1, and names the values `column0`, `column1` and so on. It does not understand quoted commas, so the practice file's `"Hello, Ada!"` would be split in two. Use `readCsvDataFile` for new tests. Reading a column that does not exist throws `Column "<name>" does not exist in the CSV file.`

## Best practices

- Keep inputs *and* expected results in the data file.
- Never put real passwords, tokens or personal data in data files. Use synthetic values such as the generated ones.
- Use unique data for tests that create records, for example `generateAccountEmail('example.test')`, so parallel runs do not collide.
- Keep one data file per scenario family, and name columns after what they hold.
- Commit small data files that tests depend on. Do not commit files produced during a run, such as `data/generated/` or `data/downloads/`.

Next: [Configuration and profiles](configuration-and-profiles.md).
