# Step 3: Browser helpers (`webActions`)

[Documentation index](README.md) | Previous: [Write your own tests](writing-tests.md) | Next: [Test data](test-data.md)

`webActions` is a fixture that comes with `test` from `@core/lib/BaseTest`. Add it to a test's parameters and you get a set of helpers for common browser tasks, built on Playwright. You can mix them freely with plain Playwright calls on `page`.

This guide uses the practice files from [Step 2](writing-tests.md#create-the-practice-files). Create them first.

## The helpers at a glance

| Helper | Use it to |
| --- | --- |
| [`waitForPageLoad`](#waiting) | Wait until the page, and optionally a loading indicator, is ready |
| [`delay`](#waiting) | Pause for a fixed time (use sparingly) |
| [`clickByText`](#clicking) | Click the element whose visible text matches exactly |
| [`clickElementJS`](#clicking) | Click through the page's own JavaScript when a normal click is blocked |
| [`highlightAndClick`](#clicking) | Click, flashing the element first when highlighting is on |
| [`highlightAndFill`, `highlightAndType`](#typing) | Fill a field at once, or type key by key |
| [`getLocatorOfStringObject`](#finding-elements-by-text) | Get a locator for exact text inside a container |
| [`refineTestObjectLocator`](#finding-elements-by-text) | Pick the first, second, third or last match of exact text |
| [`highlightElement`](#highlighting) | Flash an element yellow with a red border |
| [`waitForDialogAndAccept`, `waitForDialogAndAcceptWithReturn`](#dialogs) | Accept an alert, confirm or prompt and check its message |
| [`downloadFileAndSave`](#downloads) | Click a download link and save the file |
| [`readDataFromExcel`, `readValuesFromTextFile`, `writeDataIntoTextFile`, `getPDFText`](test-data.md#files-excel-text-and-pdf) | Read and write data files |

`webActions.page` and `webActions.context` give you the Playwright page and browser context that the helpers use.

## Waiting

```text
waitForPageLoad(page?, spinnerLocator?, polling = 500, timeout = 120000): Promise<void>
delay(time: number): Promise<void>
```

`waitForPageLoad()` waits for the `domcontentloaded` and `load` states, then for `document.readyState` to be `complete`. If you pass a spinner locator or selector it also waits until that element is hidden or gone. Pass `undefined` as the first argument to use the test's own page.

```ts
await webActions.waitForPageLoad();
await webActions.waitForPageLoad(undefined, lab.spinner);
```

`delay(milliseconds)` simply waits. Prefer an `expect(...)` assertion: it waits only as long as needed, while `delay` always waits the full time.

## Clicking

```text
clickByText(text: string): Promise<void>
clickElementJS(locator: string): Promise<void>
highlightAndClick(locator: Locator | string): Promise<void>
```

- `clickByText` clicks the element whose text equals the given text exactly (case-sensitive).
- `clickElementJS` takes a selector string and runs `element.click()` inside the page. Use it when Playwright's normal click is blocked by an overlay you cannot dismiss. It skips Playwright's checks that the element is visible and enabled, so use it as a last resort.
- `highlightAndClick` highlights the element, then clicks. A **string** argument is treated as exact visible text, not as a selector. To click a selector, pass `page.locator(selector)`.

```ts
await webActions.clickByText(lab.greetLabel);
await webActions.clickElementJS(lab.greetButton);
await webActions.highlightAndClick(page.locator(lab.greetButton));
```

## Typing

```text
highlightAndFill(locator: Locator | string, value: string): Promise<void>
highlightAndType(locator: Locator | string, value: string): Promise<void>
```

`highlightAndFill` replaces the field's content in one step. `highlightAndType` types the value character by character (Playwright's `pressSequentially`), which is useful when the page reacts to each key press. As with clicking, a string argument means exact visible text.

```ts
await webActions.highlightAndFill(page.locator(lab.nameInput), 'Ada');
await webActions.highlightAndType(page.locator(lab.nameInput), 'Linus');
```

## Finding elements by text

```text
getLocatorOfStringObject(textObject: string, containerLocator: Locator | string = 'body'): Promise<Locator>
refineTestObjectLocator(containerLocator, textObject, returnOptions = 'first'): Locator
```

Both match **exact, case-sensitive** text inside a container.

- `getLocatorOfStringObject` returns the first match inside the container (the whole page by default).
- `refineTestObjectLocator` lets you choose which match: `'first'` (or `1`), `'second'` (or `2`), `'third'` (or `3`), or `'last'`. It returns a locator immediately, without waiting; the action you perform on it does the waiting. It throws if the text or the container selector is blank.

```ts
const notebook = await webActions.getLocatorOfStringObject(lab.notebookText, lab.cart);
const lastNotebook = webActions.refineTestObjectLocator(lab.cart, lab.notebookText, 'last');
```

In the practice page the cart lists Notebook, Pen, Notebook, so `'last'` is the third item.

## Highlighting

```text
highlightElement(locator: Locator | string, durationMs = 300): Promise<void>
```

Highlighting flashes the element three times with a yellow background and a red border. It helps you follow a run by eye. It is **off by default** and does nothing, so tests run at full speed. Turn it on with the `HIGHLIGHT_TEST_OBJECT_ENABLED` setting:

```bash
HIGHLIGHT_TEST_OBJECT_ENABLED=true npx playwright test tests/webapp/functional/learn/first.test.ts --project=dev
```

The setting can also live in a local profile; see [Configuration and profiles](configuration-and-profiles.md). `highlightAndClick`, `highlightAndFill` and `highlightAndType` call `highlightElement` for you. When enabled, each highlight adds roughly three times `durationMs` to the step, so leave it off in CI.

## Dialogs

```text
waitForDialogAndAccept(expectedMessage: string): Promise<void>
waitForDialogAndAcceptWithReturn(): Promise<string>
```

Both accept the next dialog (alert, confirm or prompt) and report its message. Start listening **before** the action that opens the dialog, and await the result **after** it. `waitForDialogAndAcceptWithReturn` gives you the message to check yourself. `waitForDialogAndAccept` checks the message with a soft assertion: the test continues but is marked failed if the text differs.

```ts
const message = webActions.waitForDialogAndAcceptWithReturn();
await page.locator(lab.alertButton).click();
expect(await message).toBe('Practice alert');
```

## Downloads

```text
downloadFileAndSave(downloadButtonLocator: Locator, savePath: string): Promise<string>
```

Clicks the locator, waits for the download, saves it into the folder `savePath` using the file name the page suggests, and returns the saved path. Downloads are enabled in the default configuration.

```ts
const saved = await webActions.downloadFileAndSave(page.locator(lab.downloadLink), 'data/downloads');
```

## Reusing the helpers in shared functions

`webActions` is created for every test by the `test` from `@core/lib/BaseTest`. It is deliberately generic: it clicks, fills and waits, and it knows nothing about your application. To reuse a *sequence* of helpers, such as logging in, put it in a shared function that takes `page` and `webActions` as parameters and reads its selectors from the object repository. Every scenario then calls that function instead of repeating the steps. This is the recommended structure; see [The recommended architecture](writing-tests.md#the-recommended-architecture) and the runnable [login example](writing-tests.md#example-log-in-once-reuse-everywhere).

If your team prefers the Page Object Model, a page class can receive `page` and `webActions` in the same way; that is described under [Optional: Traditional Page Object Model](writing-tests.md#optional-traditional-page-object-model).

## A complete example

```ts title="tests/webapp/functional/learn/web-actions.test.ts"
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@core/lib/BaseTest';
import { lab } from '@objectRepositories/GUI/labGUI.json';

test.beforeEach(async ({ page }) => {
    await page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
});

test('waitForPageLoad waits for the spinner to disappear', async ({ page, webActions }) => {
    await webActions.waitForPageLoad(undefined, lab.spinner);
    await expect(page.locator(lab.spinner)).toHaveCount(0);
});

test('clickByText and getLocatorOfStringObject find elements by exact text', async ({ page, webActions }) => {
    await webActions.clickByText(lab.greetLabel);
    await expect(page.locator(lab.greeting)).toHaveText('Hello, !');
    const notebook = await webActions.getLocatorOfStringObject(lab.notebookText, lab.cart);
    await expect(notebook).toBeVisible();
});

test('clickElementJS clicks through the page script', async ({ page, webActions }) => {
    await page.locator(lab.nameInput).fill('Grace');
    await webActions.clickElementJS(lab.greetButton);
    await expect(page.locator(lab.greeting)).toHaveText('Hello, Grace!');
});

test('highlightAndType types key by key', async ({ page, webActions }) => {
    await webActions.highlightAndType(page.locator(lab.nameInput), 'Linus');
    await expect(page.locator(lab.nameInput)).toHaveValue('Linus');
});

test('refineTestObjectLocator picks the requested match', async ({ page, webActions }) => {
    await expect(page.locator(lab.cartItem)).toHaveCount(3);
    const firstNotebook = webActions.refineTestObjectLocator(lab.cart, lab.notebookText);
    const lastNotebook = webActions.refineTestObjectLocator(lab.cart, lab.notebookText, 'last');
    expect(await firstNotebook.evaluate(el => Array.from(el.parentElement!.children).indexOf(el))).toBe(0);
    expect(await lastNotebook.evaluate(el => Array.from(el.parentElement!.children).indexOf(el))).toBe(2);
});

test('highlightElement does nothing unless highlighting is enabled', async ({ page, webActions }) => {
    await webActions.highlightElement(page.locator(lab.heading), 200);
    await expect(page.locator(lab.heading)).toBeVisible();
});

test('dialogs are accepted and their text is returned', async ({ page, webActions }) => {
    const message = webActions.waitForDialogAndAcceptWithReturn();
    await page.locator(lab.alertButton).click();
    expect(await message).toBe('Practice alert');
    const verified = webActions.waitForDialogAndAccept('Practice alert');
    await page.locator(lab.alertButton).click();
    await verified;
});

test('downloadFileAndSave saves the file', async ({ page, webActions }) => {
    const saved = await webActions.downloadFileAndSave(page.locator(lab.downloadLink), 'data/downloads');
    expect(saved).toBe('data/downloads/hello.txt');
    expect(await webActions.readValuesFromTextFile(saved)).toBe('Hello download');
});
```

Run it:

```bash
npx playwright test tests/webapp/functional/learn/web-actions.test.ts --project=dev
```

```text
Running 8 tests using 2 workers

  ✓  1 [dev] › tests/webapp/functional/learn/web-actions.test.ts:10:5 › waitForPageLoad waits for the spinner to disappear (1.1s)
  ✓  2 [dev] › tests/webapp/functional/learn/web-actions.test.ts:15:5 › clickByText and getLocatorOfStringObject find elements by exact text (617ms)
  ✓  3 [dev] › tests/webapp/functional/learn/web-actions.test.ts:22:5 › clickElementJS clicks through the page script (373ms)
  ✓  4 [dev] › tests/webapp/functional/learn/web-actions.test.ts:28:5 › highlightAndType types key by key (315ms)
  ✓  5 [dev] › tests/webapp/functional/learn/web-actions.test.ts:33:5 › refineTestObjectLocator picks the requested match (158ms)
  ✓  6 [dev] › tests/webapp/functional/learn/web-actions.test.ts:41:5 › highlightElement does nothing unless highlighting is enabled (139ms)
  ✓  7 [dev] › tests/webapp/functional/learn/web-actions.test.ts:46:5 › dialogs are accepted and their text is returned (562ms)
  ✓  8 [dev] › tests/webapp/functional/learn/web-actions.test.ts:55:5 › downloadFileAndSave saves the file (356ms)

  8 passed (2.8s)
```

With two workers the order of the lines can differ from run to run. What matters is `8 passed`.

## Tips

- Prefer Playwright's own locators and `expect` for anything the helpers do not cover. They auto-wait and give clear error messages.
- Keep texts and selectors in the object repository so `npm run lint` stays clean.
- To see which element a step is acting on, turn highlighting on while you develop and off before you commit.
- `webActions` helpers log through the project logger; see [Reports and logs](reporting-and-logging.md#log-files).

Next: [Test data](test-data.md).
