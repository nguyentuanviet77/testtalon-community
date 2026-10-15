# Step 2: Write your own tests

[Documentation index](README.md) | Previous: [Getting started](setup.md) | Next: [Browser helpers](web-actions.md)

In this guide you create a small practice page, store its selectors in an object repository, write a test against it, run it, and learn how to select which tests run. [The recommended architecture](#the-recommended-architecture) explains how the object repository, `webActions`, reusable common functions, test scenarios and test data fit together, [Example: log in once, reuse everywhere](#example-log-in-once-reuse-everywhere) shows it end to end, and the last section, [Optional: Traditional Page Object Model](#optional-traditional-page-object-model), covers classes per page if your team prefers that style. The practice page loads from a local file, so everything works offline. The later guides reuse these files.

## Create the practice files

Create these two files. The page has a name field, a button, a shopping list, an alert, a download link and a loading message that disappears after half a second.

```html title="tests/webapp/functional/learn/lab.html"
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>TestTalon practice lab</title></head>
<body>
  <h1>Practice lab</h1>
  <label for="name">Name</label><input id="name">
  <button id="greet" type="button">Greet</button>
  <p id="greeting"></p>
  <ul id="cart">
    <li>Notebook</li>
    <li>Pen</li>
    <li>Notebook</li>
  </ul>
  <button id="alert-button" type="button">Show alert</button>
  <a id="download" href="data:text/plain;charset=utf-8,Hello%20download" download="hello.txt">Download file</a>
  <p id="spinner">Loading...</p>
  <script>
    document.querySelector('#greet').addEventListener('click', () => {
      document.querySelector('#greeting').textContent = 'Hello, ' + document.querySelector('#name').value + '!';
    });
    document.querySelector('#alert-button').addEventListener('click', () => alert('Practice alert'));
    setTimeout(() => document.querySelector('#spinner').remove(), 500);
  </script>
</body>
</html>
```

## Step 1: Put selectors in an object repository

TestTalon keeps selectors out of test files. A test says *what* to do; the repository says *where* on the page. When the page changes you fix one JSON file instead of every test.

```json title="objectRepositories/GUI/labGUI.json"
{
  "lab": {
    "heading": "h1",
    "nameInput": "#name",
    "greetButton": "#greet",
    "greeting": "#greeting",
    "cart": "#cart",
    "cartItem": "#cart li",
    "alertButton": "#alert-button",
    "downloadLink": "#download",
    "spinner": "#spinner",
    "greetLabel": "Greet",
    "notebookText": "Notebook"
  }
}
```

Naming rules:

| Item | Rule | Example |
| --- | --- | --- |
| File | One file per page, `<page>GUI.json`, in `objectRepositories/GUI/` | `labGUI.json` |
| Root key | The page name, matching the file name | `lab` |
| Entry names | camelCase; say what the element is for | `nameInput`, `greetButton` |
| Values | A selector (CSS or XPath) or visible text used by a text helper | `#name`, `Notebook` |

The bundled example `objectRepositories/GUI/communityDemoGUI.json` follows the same pattern.

## Step 2: Write the test

```ts title="tests/webapp/functional/learn/first.test.ts"
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@core/lib/BaseTest';
import { lab } from '@objectRepositories/GUI/labGUI.json';

test('greets the user by name', { tag: ['@GUI', '@Smoke'] }, async ({ page, webActions }) => {
    await test.step('Open the practice lab', async () => {
        await page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
        await webActions.waitForPageLoad();
    });
    await test.step('Enter a name and press Greet', async () => {
        await webActions.highlightAndFill(page.locator(lab.nameInput), 'Ada');
        await webActions.highlightAndClick(page.locator(lab.greetButton));
    });
    await test.step('Check the greeting', async () => {
        await expect(page.locator(lab.greeting)).toHaveText('Hello, Ada!');
    });
});
```

## Step 3: Run it

```bash
npx playwright test tests/webapp/functional/learn/first.test.ts --project=dev
```

```text
Running 1 test using 1 worker

  ✓  1 [dev] › tests/webapp/functional/learn/first.test.ts:6:5 › greets the user by name @GUI @Smoke (673ms)

  1 passed (1.6s)
```

The `dev` in brackets is the Playwright project. Community's default projects are `dev`, `staging-chromium` and `qa-firefox`; add more in the [projects guide](projects-and-environments.md).

## The parts of a test

| Part | What it is |
| --- | --- |
| `import { test, expect } from '@core/lib/BaseTest'` | Always import `test` and `expect` from here, not from `@playwright/test`. This is the TestTalon test object: it adds the `webActions` fixture and loads the project's local profile around each test. |
| `import { lab } from '@objectRepositories/GUI/labGUI.json'` | Loads the selectors. Importing the root key gives you `lab.nameInput` and so on. |
| `test('title', { tag: [...] }, async ({ page, webActions }) => {...})` | One test. The title appears in reports; tags let you select tests. |
| `page` | The Playwright page for this test. A fresh browser context is created for every test. |
| `webActions` | The TestTalon helper object. See the [browser helpers guide](web-actions.md). |
| `test.step('...', async () => {...})` | Groups actions into named steps that show up in the HTML report. |
| `expect(...)` | Playwright assertions such as `toHaveText`, `toBeVisible` and `toHaveValue`. They retry until the timeout (10 seconds by default). |

`BaseTest` also adds a `Project` annotation to each test with the project's name, which the HTML report displays.

Import aliases available in your tests:

| Alias | Points to |
| --- | --- |
| `@core/lib/BaseTest` | `packages/community/lib/BaseTest.ts` |
| `@core/lib/WebActions` | `packages/community/lib/WebActions.ts` |
| `@core/lib/CommonFuncs` | `packages/community/lib/CommonFuncs.ts` |
| `@core/lib/GenerateData` | `core/lib/GenerateData.ts` |
| `@config/*` | `config/*` |
| `@objectRepositories/*` | `objectRepositories/*` |

## Opening a real application

The practice page is loaded with `page.setContent`. For a real application, give your project a `baseURL` and navigate with a relative path:

```ts snippet
await page.goto('/login');
```

The [projects guide](projects-and-environments.md) shows how to set one base URL per environment from environment variables. A full URL such as `await page.goto('https://example.test/login')` also works, but it ties the test to one environment.

## Run your tests

All of these are standard Playwright options. Add `--project=dev` (the default project) when you run a single file so only one project is used.

| Goal | Command |
| --- | --- |
| The bundled smoke test | `npm run test:smoke` |
| Every sample test that needs no network | `npm run test:web` |
| Everything in the default project | `npx playwright test --project=dev` |
| One file | `npx playwright test tests/webapp/functional/learn/first.test.ts --project=dev` |
| One test by title | `npx playwright test --project=dev -g "greets the user"` |
| Tests with a tag | `npx playwright test --project=dev --grep @Smoke` |
| Everything except a tag | `npx playwright test --project=dev --grep-invert @Slow` |
| See what would run | `npx playwright test --list --project=dev` |
| Watch the browser | `npx playwright test --project=dev --headed` |
| Step through a test | `npx playwright test tests/webapp/functional/learn/first.test.ts --project=dev --debug` |
| Run in Playwright's UI mode | `npx playwright test --project=dev --ui` |
| One test at a time | `npx playwright test --project=dev --workers=1` |
| Retry failures once | `npx playwright test --project=dev --retries=1` |

Outside CI the browser is visible; with the `CI` environment variable set it runs headless. By default Community runs two workers in parallel with no retries, a 120-second test timeout and a 10-second assertion timeout.

### Tags

Tags are the strings in `{ tag: [...] }`. They start with `@`. Use a small, consistent set, for example `@Smoke` for quick checks, `@GUI` for browser tests, and `@ReadOnly` for tests that never change data (the projects guide uses `@ReadOnly` to keep Production runs safe).

```bash
npx playwright test --project=dev --grep "@GUI.*@Smoke"
```

## Check your conventions

```bash
npm run lint
```

```text
Community conventions: 8 tests, 0 findings.
```

The checker reads every `.ts` file under `tests/` and reports:

| Rule | Meaning |
| --- | --- |
| `framework-import` | A test imports `test` or `expect` from `@playwright/test`. Import them from `@core/lib/BaseTest`. |
| `framework-fixture` | A `*.test.ts` file does not import `test` from `@core/lib/BaseTest`. |
| `inline-locator` | A selector, label, placeholder, test id, title or text was written inline instead of coming from the object repository. |

The locator rule applies to `locator`, `frameLocator`, `getByText`, `getByLabel`, `getByPlaceholder`, `getByTestId`, `getByAltText`, `getByTitle`, `$`, `$$`, `waitForSelector`, and to the `webActions` helpers that take a selector or text. `getByRole` is not checked.

For example, this test fails the check because `'#save'` is written inline:

```ts title="tests/webapp/functional/learn/bad.test.ts" negative
import { test } from '@core/lib/BaseTest';

test('saves the form', async ({ page }) => {
    await page.locator('#save').click();
});
```

```text
tests/webapp/functional/learn/bad.test.ts:4 [inline-locator] Use a GUI/Mobile object repository locator, including helper arguments.
Community conventions: 9 tests, 1 findings.
```

(Delete this file after trying it, or the check keeps failing.) The command exits with a non-zero status when there are findings, so a CI job fails. The fix is to add the selector to an object repository and use `page.locator(lab.saveButton)`.

## Naming and layout

| Item | Convention |
| --- | --- |
| Test files | `tests/webapp/functional/<area>/<name>.test.ts` |
| Not tests | Playwright runs only files ending in `.test.ts` or `.spec.ts`. Put shared code in files with other names |
| Test titles | A readable sentence that says what is verified |
| Object repositories | `objectRepositories/GUI/<page>GUI.json` |
| Shared workflows | `tests/webapp/common/<area>.ts` (see [Common functions](#common-functions-and-shared-modules)) |
| Page objects (optional) | `tests/webapp/pages/<Name>Page.ts`, one class per page or component (see [Optional: Traditional Page Object Model](#optional-traditional-page-object-model)) |
| Data files | Next to the test or under `data/`, for example `tests/webapp/functional/learn/lab.csv` |

## The recommended architecture

TestTalon recommends building a Web suite from five layers. Each layer has one job, and the layers reuse each other instead of repeating each other. You do **not** need a TypeScript class for every web page.

| Layer | Where it lives | Its one job |
| --- | --- | --- |
| **Object repository** | `objectRepositories/GUI/<page-or-component>GUI.json` | Says **where** things are: selectors, and the visible texts that helpers look for |
| **`webActions`** | The fixture from `@core/lib/BaseTest`, implemented by the framework in `packages/community/lib/WebActions.ts` | Says **how** to interact with a browser: fill, click, wait, dialogs, downloads, files |
| **Common functions** | The framework's `@core/lib/CommonFuncs` and `@core/lib/GenerateData`, plus **your own** modules, for example `tests/webapp/common/<area>.ts` | Say **what a user does** in business terms: log in, search, submit a form. You write these |
| **Test scenarios** | `tests/webapp/functional/<area>/<name>.test.ts` | Say **what must be true**: compose the layers above and assert |
| **Test data** | `.csv` files next to the tests or under `data/`, generated values, profile settings | Say **with which values**, per environment |

```text
Test scenario ──► Common functions ──► webActions ──► Playwright and the browser
      │                  │
      │                  └──────────► Object repository (selectors)
      └──► Test data (CSV, generated values, profile settings)
```

A scenario never needs to know a selector, and the object repository knows nothing about behavior. A change in one layer rarely touches another.

### Object repository

An object repository is a plain JSON file of selectors for one page or one reusable component of your application. It is the only place a selector is written.

```json snippet
{
  "demoLogin": {
    "usernameInput": "#username",
    "passwordInput": "#password",
    "submitButton": "#login",
    "errorMessage": "#error"
  }
}
```

- **Format and location.** One file per page or component, `objectRepositories/GUI/<name>GUI.json`; the root key is the name; entries are camelCase and say what the element is for. The naming table in [Step 1](#step-1-put-selectors-in-an-object-repository) is the rule. The convention checker (`npm run lint`) reports a selector written inline in a test or in a shared module under `tests/`.
- **Organize by page or component.** `loginGUI.json`, `headerGUI.json`, `searchResultsGUI.json`. A header that appears on every page lives once and is imported by every workflow that uses it. Sub-folders work too, for example `objectRepositories/GUI/shop/cartGUI.json`, imported as `@objectRepositories/GUI/shop/cartGUI.json`.
- **Reuse.** Any test or common function imports the entries it needs: `import { demoLogin } from '@objectRepositories/GUI/demoLoginGUI.json'`.
- **Safe to change.** TypeScript checks the keys, so a misspelled entry fails `npm run build` instead of failing a test at run time. When the page changes, edit one JSON file.
- **No class required.** The file is data, not code, so there is nothing to instantiate and nothing to keep in step with a class.

### webActions

`webActions` is the framework's set of reusable browser operations: `waitForPageLoad`, `highlightAndClick`, `highlightAndFill`, `highlightAndType`, `clickByText`, `waitForDialogAndAccept`, `downloadFileAndSave`, `readDataFromExcel` and the others listed in the [browser helpers guide](web-actions.md). Use it for everything generic, so you never re-implement clicking, typing or waiting. Keep it generic: application-specific behavior such as "log in" does not belong in `webActions`, it belongs in a common function that **calls** `webActions`. Remember that a **string** argument to the `highlightAnd...` helpers is visible text, not a selector; pass `page.locator(repository.entry)` for selectors.

### Common functions and shared modules

Two different things are called "common functions". Keep them apart:

| | Framework utilities | Your application workflows |
| --- | --- | --- |
| Examples | `readCsvDataFile`, `appendCSVData`, `equalsIgnoreCase`, `formatLocalTime`, `redefineTestLocator` from `@core/lib/CommonFuncs`; `randomString`, `generateAccountEmail` from `@core/lib/GenerateData` | `loginAs`, `searchFor`, `addToCart`, `submitRegistrationForm` |
| Who writes them | TestTalon ships them; they are general purpose | You write them, once per application or business area |
| Where | `@core/lib/...` (do not edit) | `tests/webapp/common/<area>.ts` (a suggestion, see below) |
| Know about your application | No | Yes |

A workflow is an ordinary exported function. It takes what it needs as parameters (the Playwright `page`, the `webActions` object, the application address, an account), reads selectors from the object repository and does its work through `webActions`:

```ts snippet
export async function loginAs({ page, webActions, appUrl }: Session, account: Account): Promise<void> {
    await page.goto(`${appUrl}/demo-app/login`);
    await webActions.highlightAndFill(page.locator(demoLogin.usernameInput), account.username);
    await webActions.highlightAndFill(page.locator(demoLogin.passwordInput), account.password);
    await webActions.highlightAndClick(page.locator(demoLogin.submitButton));
}
```

Guidelines (recommendations, not framework rules):

- **Put shared modules under `tests/`**, in a file that does not end in `.test.ts` (Playwright runs only `*.test.ts` and `*.spec.ts` files). Inside `tests/`, the convention checker covers them and `npm run build` compiles them. A folder such as `tests/webapp/common/` is a convention you can rename.
- **One module per business area** (`auth.ts`, `search.ts`, `checkout.ts`). Name functions after what the user does, not after elements.
- **Take parameters instead of reading globals.** Pass the account, the address and the data in; the same function then works for every environment and every project.
- **Perform actions; let the scenario judge.** A workflow such as `loginAs` ends after the click. The scenario decides what success looks like, so a negative test can reuse the same function. Small verification helpers that many scenarios repeat are fine, as long as their name says they verify.
- **Compose.** A function may call another (`checkout` calls `loginAs`, `addToCart`).

### Test scenarios

A scenario describes behavior. It takes data, calls common functions, and asserts with `expect`. It contains no selectors and no browser plumbing, so it reads like the test case you would write on paper. Group actions with `test.step` when a long scenario needs headings in the report.

### Test data

Data stays out of the scenario. Use CSV files for static data (one file per environment, named after the profile), the generators for random values, and the profile or the shell for settings such as the application address. See [Test data](test-data.md#different-data-for-each-environment) and [Configuration and profiles](configuration-and-profiles.md). Real passwords and tokens belong in an encrypted profile or in CI secrets (see [Secrets](configuration-and-profiles.md#secrets)), never in committed plain text.

## Why TestTalon Recommends Object Repository and Reusable Functions

TestTalon is meant to be reused across applications, environments and projects. These are the reasons the layers above are kept separate, and what each one buys you.

| # | Benefit | How the architecture delivers it |
| --- | --- | --- |
| 1 | **Centralized selector maintenance** | Every selector is in one JSON entry. When a button changes you edit one line, and every test and workflow that uses it is fixed |
| 2 | **Less duplicated code** | A selector, a click sequence and a login flow are each written once and imported, not copied between tests or classes |
| 3 | **Reusable interactions** | `webActions` already handles highlighting, waiting and retries the same way for every element, so no project writes its own `click` wrapper |
| 4 | **Reusable business workflows** | A function such as `loginAs` is shared by every scenario that needs a signed-in user, in this project and in the next |
| 5 | **Separation of concerns** | Where (repository), how (`webActions`), what a user does (common functions), what must be true (scenario) and which values (data) each change for different reasons, and each lives in a different file |
| 6 | **Maintenance across applications** | A second application gets its own repository files and workflow modules; the generic layers are shared unchanged |
| 7 | **Easier onboarding** | A new QA engineer learns three ideas: add a selector to the JSON, call a helper, compose a scenario. Running `npm run lint` points out inline selectors and wrong imports straight away |
| 8 | **Multiple environments** | Addresses, accounts and settings are inputs (project `baseURL`, profile, CSV per environment), so the same workflow runs against dev, QA and staging |
| 9 | **Extension to new projects** | A new project copies the folder layout and reuses the shared modules and the framework; nothing application-specific is baked into the generic layers |
| 10 | **Less page-class boilerplate** | There is no class per page to declare, construct, register as a fixture and keep in step with the page |

### Trade-offs

No architecture is free, and the traditional Page Object Model is not wrong:

- **More indirection.** A step goes scenario → common function → repository and `webActions`. Following one step takes a little more navigation than reading one class. Good function names and a small number of modules keep this cheap.
- **It needs team agreement.** Plain functions have no built-in structure. The team has to agree where workflows go and how they are named; the suggested layout below is a starting point.
- **No encapsulated state.** A class can hold state for a complex widget. A function takes its inputs as parameters; a rich, stateful component may deserve a class (see the optional section).
- **Discoverability.** A page class lists everything you can do on a page in one place. With modules, you find workflows by area instead. Your editor's auto-import and one module per area help.

Where the traditional Page Object Model works well, it works well. It can become difficult to maintain when page classes accumulate **duplicated selectors, browser actions, business workflows and assertions** all in one place: a change to any of them touches the same class, and the same selector or workflow tends to be copied into several classes. TestTalon recommends separating those responsibilities into reusable layers so each is written once.

### Architecture comparison

| | Traditional page-centric POM | TestTalon recommended approach |
| --- | --- | --- |
| Selectors | In page classes | In the object repository |
| Generic interactions | In page classes | In `webActions` |
| Business workflows | Often in page classes | In common functions |
| Assertions | Often in page classes | In test scenarios (plus small named verification helpers) |
| Tests | Call page methods | Compose repository entries, `webActions` and common functions |
| Per page | One class | One JSON file |
| Best fit | Complex UI components and specialized abstractions with their own state | Most Web suites, and suites that span several applications |

POM is not prohibited. See [Optional: Traditional Page Object Model](#optional-traditional-page-object-model).

## Example: log in once, reuse everywhere

This example logs in to an application and verifies the navigation, and reuses the same login function in three scenarios. It uses no page class. It has five small pieces, all of which you create: two object repository files, one shared module with the workflow, one test file, and data files. A sixth file, the stand-in application, exists only so the example runs offline.

### 1. The objects

One repository file per page, named after the page. The login page and the dashboard are different pages, so they get different files.

```json title="objectRepositories/GUI/demoLoginGUI.json"
{
  "demoLogin": {
    "usernameInput": "#username",
    "passwordInput": "#password",
    "submitButton": "#login",
    "errorMessage": "#error"
  }
}
```

```json title="objectRepositories/GUI/demoDashboardGUI.json"
{
  "demoDashboard": {
    "welcomeMessage": "#welcome",
    "logoutLink": "#logout"
  }
}
```

### 2. The reusable workflow

The login function lives in a shared module. It uses the repository for selectors and `webActions` for the actions, takes the account and the application address as parameters, and does not assert: the scenarios decide what a good result is.

```ts title="tests/webapp/common/auth.ts"
import type { Page } from '@core/lib/BaseTest';
import type { WebActions } from '@core/lib/WebActions';
import { demoLogin } from '@objectRepositories/GUI/demoLoginGUI.json';
import { demoDashboard } from '@objectRepositories/GUI/demoDashboardGUI.json';

/** What every workflow needs: the Playwright page, the TestTalon helpers and the address of the application. */
export interface Session {
    page: Page;
    webActions: WebActions;
    appUrl: string;
}

export interface Account {
    username: string;
    password: string;
}

/** Opens the sign-in page, submits the account and stops. The scenario decides what a good result is. */
export async function loginAs({ page, webActions, appUrl }: Session, account: Account): Promise<void> {
    await page.goto(`${appUrl}/demo-app/login`);
    await webActions.highlightAndFill(page.locator(demoLogin.usernameInput), account.username);
    await webActions.highlightAndFill(page.locator(demoLogin.passwordInput), account.password);
    await webActions.highlightAndClick(page.locator(demoLogin.submitButton));
}

export async function logout({ webActions, page }: Session): Promise<void> {
    await webActions.highlightAndClick(page.locator(demoDashboard.logoutLink));
}
```

### 3. The stand-in application

So that the example runs on any machine without a real site, this file answers requests to `/demo-app/login` and `/demo-app/dashboard` from inside the test, using Playwright's `page.route`. It is not part of the architecture. When you test a real application, delete this file and the `serveDemoApp` call.

```ts title="tests/webapp/common/demoApp.ts"
import type { Page } from '@core/lib/BaseTest';

// A stand-in for your real application so this example runs offline. Delete it when you point the tests at a real site.
const loginHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Demo sign in</title></head>
<body>
  <h1>Sign in</h1>
  <label for="username">User name</label><input id="username">
  <label for="password">Password</label><input id="password" type="password">
  <button id="login" type="button">Sign in</button>
  <p id="error" role="alert"></p>
  <script>
    const accounts = { ada: ['demo-pass-1', 'Ada Lovelace'], grace: ['demo-pass-2', 'Grace Hopper'] };
    document.querySelector('#login').addEventListener('click', () => {
      const entry = accounts[document.querySelector('#username').value];
      if (entry && entry[0] === document.querySelector('#password').value) {
        location.assign('/demo-app/dashboard?name=' + encodeURIComponent(entry[1]));
      } else {
        document.querySelector('#error').textContent = 'Invalid user name or password';
      }
    });
  </script>
</body>
</html>`;

const dashboardHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Demo dashboard</title></head>
<body>
  <h1 id="welcome"></h1>
  <a id="logout" href="/demo-app/login">Sign out</a>
  <script>
    document.querySelector('#welcome').textContent = 'Welcome, ' + new URLSearchParams(location.search).get('name');
  </script>
</body>
</html>`;

export async function serveDemoApp(page: Page): Promise<void> {
    await page.route('**/demo-app/**', route => {
        const html = new URL(route.request().url()).pathname.endsWith('/dashboard') ? dashboardHtml : loginHtml;
        return route.fulfill({ contentType: 'text/html', body: html });
    });
}
```

### 4. The data, one file per environment

Static data lives in CSV files named after the project's profile (the same pattern as in [Test data](test-data.md#different-data-for-each-environment)). The passwords here are made-up values for the stand-in application, and `badPassword` is a value the stand-in rejects, used by the negative scenario. Real credentials belong in an encrypted profile or in CI secrets, never in committed plain text.

```csv title="tests/webapp/functional/learn/accounts.dev.csv"
username,password,badPassword,displayName
ada,demo-pass-1,not-the-password,Ada Lovelace
```

```csv title="tests/webapp/functional/learn/accounts.qa.csv"
username,password,badPassword,displayName
grace,demo-pass-2,not-the-password,Grace Hopper
```

### 5. The scenarios

Each scenario reads like the test case. The first one logs in and asserts the navigation. The other two **reuse the same `loginAs` function**: the second continues after the login, the third changes one input and asserts the opposite outcome.

```ts title="tests/webapp/functional/learn/login.test.ts"
import type { TestInfo } from '@playwright/test';
import { test, expect } from '@core/lib/BaseTest';
import { readCsvDataFile } from '@core/lib/CommonFuncs';
import { loginAs, logout } from '../../common/auth';
import { serveDemoApp } from '../../common/demoApp';
import { demoLogin } from '@objectRepositories/GUI/demoLoginGUI.json';
import { demoDashboard } from '@objectRepositories/GUI/demoDashboardGUI.json';

// The address comes from the environment: the project's baseURL first, then GUI_BASE_URL from the profile, then a default.
const appUrlFor = (baseURL: string | undefined) => baseURL ?? process.env.GUI_BASE_URL ?? 'https://demo.example.test';
// The accounts come from data, one file per environment profile.
const accountFor = (testInfo: TestInfo) => {
    const row = readCsvDataFile(`tests/webapp/functional/learn/accounts.${String(testInfo.project.metadata.envProfile)}.csv`)[0];
    return { username: row.username, password: row.password, badPassword: row.badPassword, displayName: row.displayName };
};

test.beforeEach(async ({ page }) => {
    await serveDemoApp(page);
});

test('a valid account reaches the dashboard', { tag: ['@GUI', '@Smoke'] }, async ({ page, webActions, baseURL }, testInfo) => {
    const account = accountFor(testInfo);
    const appUrl = appUrlFor(baseURL);
    await loginAs({ page, webActions, appUrl }, account);
    await expect(page).toHaveURL(new RegExp(`^${appUrl}/demo-app/dashboard`));
    await expect(page.locator(demoDashboard.welcomeMessage)).toHaveText(`Welcome, ${account.displayName}`);
});

test('a signed-in user can sign out again', { tag: ['@GUI'] }, async ({ page, webActions, baseURL }, testInfo) => {
    const session = { page, webActions, appUrl: appUrlFor(baseURL) };
    await loginAs(session, accountFor(testInfo));
    await logout(session);
    await expect(page).toHaveURL(/\/demo-app\/login/);
    await expect(page.locator(demoLogin.submitButton)).toBeVisible();
});

test('a wrong password shows an error and stays on the sign-in page', { tag: ['@GUI'] }, async ({ page, webActions, baseURL }, testInfo) => {
    const account = accountFor(testInfo);
    await loginAs({ page, webActions, appUrl: appUrlFor(baseURL) }, { ...account, password: account.badPassword });
    await expect(page.locator(demoLogin.errorMessage)).toHaveText('Invalid user name or password');
    await expect(page).toHaveURL(/\/demo-app\/login/);
});
```

### 6. Environment-specific configuration

The test above decides the application address in this order:

| Order | Source | Use it for |
| --- | --- | --- |
| 1 | The project's `baseURL`, set by the environment projects of the [projects guide](projects-and-environments.md#a-complete-playwrightconfigts) (`QA_BASE_URL` and the others) | One address per environment and browser |
| 2 | `GUI_BASE_URL` from the project's profile file (see [Where the application address comes from](configuration-and-profiles.md#where-the-application-address-comes-from)) | A local override for one environment, without editing code |
| 3 | The default written in the test file | The bundled stand-in application |

To try the second source, create a profile for the default `dev` project. Profiles are committed with your source code, so use made-up values only:

```dotenv title="config/.env.dev"
GUI_BASE_URL=https://dev.demo.example.test
```

The accounts come from `accounts.<profile>.csv`, where the profile is the project's `metadata.envProfile`, so the `dev` projects read `accounts.dev.csv` and `qa-*` projects read `accounts.qa.csv`. Nothing in the workflow or in the scenarios changes between environments.

### 7. Run it

```bash
npx playwright test tests/webapp/functional/learn/login.test.ts --project=dev
```

```text
Running 3 tests using 2 workers

  ✓  1 [dev] › tests/webapp/functional/learn/login.test.ts:21:5 › a valid account reaches the dashboard @GUI @Smoke (1.4s)
  ✓  2 [dev] › tests/webapp/functional/learn/login.test.ts:29:5 › a signed-in user can sign out again @GUI (1.6s)
  ✓  3 [dev] › tests/webapp/functional/learn/login.test.ts:37:5 › a wrong password shows an error and stays on the sign-in page @GUI (1.1s)

  3 passed (3.9s)
```

With two workers the order of the lines can differ. What matters is `3 passed`. Check the conventions:

```bash
npm run lint
```

```text
Community conventions: 11 tests, 0 findings.
```

To run the same scenarios in Firefox and WebKit, install the browsers once and use the projects from the projects guide. The stand-in application needs no real address, so any example address works for the project variable:

```bash
npx playwright install firefox webkit
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/login.test.ts --project=dev-chromium
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/login.test.ts --project=dev-firefox
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/login.test.ts --project=dev-webkit
```

Each run ends with `3 passed`. To point the same scenarios at QA, set `QA_BASE_URL` and run `--project=qa-chromium`: the address comes from the project and the account from `accounts.qa.csv`.

### What to notice

- The login steps exist **once**. A fourth scenario that needs a signed-in user calls `loginAs` and has nothing to copy.
- The selector `#login` exists **once**, in `demoLoginGUI.json`.
- The scenarios contain no selectors and no browser code, only data, workflows and assertions.
- Replacing the stand-in application with a real one changes `demoApp.ts` and the repository entries, not the scenarios.

## Organizing a larger or multi-project suite

The same layers scale to several applications, environments and Playwright projects. Use the existing Community structure and add folders only when you need them.

```text
objectRepositories/GUI/
  shop/loginGUI.json            selectors of the shop application
  shop/cartGUI.json
  admin/loginGUI.json           selectors of the admin application
tests/webapp/
  common/
    auth.ts                     workflows shared by every application
    shop/checkout.ts            workflows that only the shop needs
    admin/users.ts
  functional/
    shop/cart.test.ts           scenarios, one folder per application or area
    admin/users.test.ts
data/ or tests/webapp/functional/<area>/
  accounts.dev.csv              data, one file per environment profile
  accounts.qa.csv
```

| You need | How the architecture supports it |
| --- | --- |
| **Multiple applications** | One repository folder, one `tests/webapp/common/<app>/` folder and one scenario folder per application. The framework layers (`webActions`, `CommonFuncs`, `GenerateData`) are shared unchanged |
| **Multiple execution environments** | Environment projects and profiles from the [projects guide](projects-and-environments.md). Workflows take the address and account as parameters, so nothing is hard-coded per environment |
| **Multiple Playwright projects** | Give a project its own `testMatch` or `grep` so it runs only one application's scenarios, for example `testMatch: '**/shop/**/*.test.ts'` |
| **Shared business workflows** | Put them in modules under `tests/webapp/common/` that several applications import (`auth.ts`) |
| **Project-specific workflows** | Put them in a sub-folder owned by that application (`tests/webapp/common/shop/checkout.ts`) |
| **Reusable test data** | One CSV per environment profile, or generated values from `@core/lib/GenerateData`, imported by any scenario |
| **Centralized selector updates** | Edit the one JSON entry. Every scenario and workflow in every project that imports it is updated |

Rules that keep this tidy: import relative paths between your own modules (as in `../../common/auth`); keep every selector in the repository; do not reach into another application's folder; and give shared modules neutral names that do not mention one application.

## Optional: Traditional Page Object Model

This section is **optional**. Everything above is a complete way to write Community tests, and TestTalon does not ask you to create a class for every page.

The **Page Object Model** (POM) remains supported where it is practical:

- **Page classes are not required.** Use one only where it earns its place, for example a complex component with its own state (a date picker, a data grid, a multi-step wizard), a specialized abstraction your team wants to name, or a team that already standardizes on POM.
- **Combine it with the object repository.** A page object does not replace the repository. It reads its selectors from it, exactly as the example below does, so a selector is still written once and the convention checker still applies.
- **Keep reusing `webActions` and the common functions.** A page object acts through `webActions`, and when a flow already exists as a common function (`loginAs`), call it instead of writing the steps again.
- **Do not duplicate.** Selectors stay in the repository, shared workflows stay in the common modules, and assertions that belong to one scenario stay in that scenario.

### How a page object, the repository and `webActions` fit together

| Piece | Role |
| --- | --- |
| Object repository (`objectRepositories/GUI/labGUI.json`) | Still holds every selector. The page object reads it; tests do not repeat selectors |
| `webActions` | The TestTalon helper object (see the [browser helpers guide](web-actions.md)). The `test` from `@core/lib/BaseTest` creates one per test as `new WebActions(page, context)` |
| Page object (`tests/webapp/pages/LabPage.ts`) | Receives `page` and `webActions` in its constructor and uses the repository and the helpers to perform actions |
| Test (`tests/webapp/functional/learn/lab-page.test.ts`) | Creates the page object, calls its methods and decides what the expected result is |

The example reuses `lab.html` and `labGUI.json` from the practice files above.

### Write the page object

```ts title="tests/webapp/pages/LabPage.ts"
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@core/lib/BaseTest';
import type { WebActions } from '@core/lib/WebActions';
import { lab } from '@objectRepositories/GUI/labGUI.json';

/** The practice lab page: one place that knows its selectors and its user actions. */
export class LabPage {
    constructor(private readonly page: Page, private readonly webActions: WebActions) {}

    async open(): Promise<void> {
        await this.page.setContent(fs.readFileSync(path.resolve('tests/webapp/functional/learn/lab.html'), 'utf8'));
        await this.webActions.waitForPageLoad();
    }

    async greet(name: string): Promise<void> {
        await this.webActions.highlightAndFill(this.page.locator(lab.nameInput), name);
        await this.webActions.highlightAndClick(this.page.locator(lab.greetButton));
    }

    async expectGreeting(text: string): Promise<void> {
        await expect(this.page.locator(lab.greeting)).toHaveText(text);
    }

    async cartItems(): Promise<string[]> {
        return this.page.locator(lab.cartItem).allTextContents();
    }
}

/** Fixture definitions: a test file adds them with `base.extend<LabFixtures>(labFixtures)`. */
export type LabFixtures = { labPage: LabPage };
export const labFixtures = {
    labPage: async ({ page, webActions }: { page: Page; webActions: WebActions }, use: (labPage: LabPage) => Promise<void>) => {
        await use(new LabPage(page, webActions));
    },
};
```

What to notice: `page` and `webActions` come in through the constructor; every selector comes from the repository (`lab.nameInput`); the class imports `Page` and `expect` from `@core/lib/BaseTest`; and the file is named `LabPage.ts`, not `*.test.ts`, so Playwright does not run it as a test.

### Provide it as a fixture and use it

A Playwright **fixture** is a value that Playwright creates for each test and hands to the test function. Extending the TestTalon `test` with `labPage` means a test can simply ask for it.

```ts title="tests/webapp/functional/learn/lab-page.test.ts"
import { test as base, expect } from '@core/lib/BaseTest';
import { LabPage, labFixtures, type LabFixtures } from '../../pages/LabPage';

const test = base.extend<LabFixtures>(labFixtures);

test.beforeEach(async ({ labPage }) => {
    await labPage.open();
});

test('greets the user through the page object', { tag: ['@GUI', '@Smoke'] }, async ({ labPage }) => {
    await labPage.greet('Ada');
    await labPage.expectGreeting('Hello, Ada!');
});

test('lists the cart items in page order', { tag: ['@GUI'] }, async ({ labPage }) => {
    expect(await labPage.cartItems()).toEqual(['Notebook', 'Pen', 'Notebook']);
});

test('a page object can also be created by hand', { tag: ['@GUI'] }, async ({ page, webActions }) => {
    const labPage = new LabPage(page, webActions);
    await labPage.open();
    await labPage.greet('Grace');
    await labPage.expectGreeting('Hello, Grace!');
});
```

The test file imports `test as base` from `@core/lib/BaseTest` and builds its own `test` with `base.extend`. This keeps the rule that every `*.test.ts` file takes its fixture from `@core/lib/BaseTest`. The third test shows the plain alternative: `new LabPage(page, webActions)` with no fixture.

### Run it

```bash
npx playwright test tests/webapp/functional/learn/lab-page.test.ts --project=dev
```

```text
Running 3 tests using 2 workers

  ✓  1 [dev] › tests/webapp/functional/learn/lab-page.test.ts:10:1 › greets the user through the page object @GUI @Smoke (983ms)
  ✓  2 [dev] › tests/webapp/functional/learn/lab-page.test.ts:15:1 › lists the cart items in page order @GUI (456ms)
  ✓  3 [dev] › tests/webapp/functional/learn/lab-page.test.ts:19:1 › a page object can also be created by hand @GUI (604ms)

  3 passed (2.6s)
```

With two workers the order of the lines can differ. What matters is `3 passed`. To run the same test in Firefox and WebKit, install the browsers once and use the projects from the [projects guide](projects-and-environments.md#a-complete-playwrightconfigts):

```bash
npx playwright install firefox webkit
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/lab-page.test.ts --project=dev-chromium
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/lab-page.test.ts --project=dev-firefox
DEV_BASE_URL=https://dev.example.test npx playwright test tests/webapp/functional/learn/lab-page.test.ts --project=dev-webkit
```

Each run ends with `3 passed`.

### Using page objects well

| Question | Recommendation |
| --- | --- |
| Where do the files go? | `tests/webapp/pages/<Name>Page.ts`, one class per page or component |
| How big is a page object? | Small. Split a class that grows past what you can scan on one screen |
| Where do selectors live? | In `objectRepositories/GUI/<page>GUI.json`, never inline |
| Where do assertions go? | Repeated checks that describe the component's state may be `expect...` methods; one-off checks stay in the scenario |
| Where do workflows go? | In common functions that several scenarios and page objects can call. Do not copy a workflow into a class |
| Should a page object keep state? | Only when the component needs it. A fresh page object is created for every test |

## Common mistakes

| Mistake | What happens | Fix |
| --- | --- | --- |
| Importing `test` from `@playwright/test` | `npm run lint` reports `framework-import`, and `webActions` is not available | Import from `@core/lib/BaseTest` |
| Naming a file `first.ts` | `No tests found` | End the name in `.test.ts` and keep it under `tests/` |
| Misspelled key such as `lab.nameInpt` | `npm run build` fails with a TypeScript error | Fix the key; the compiler checks repository keys |
| Calling `waitForDialogAndAccept` after the click that opens the dialog | The dialog is already gone, so the call waits until the test times out | Register it before the click, as shown in the [dialog example](web-actions.md#dialogs) |
| Hard-coding an environment URL in a test | The test only works in one environment | Use `baseURL` and `page.goto('/path')` |
| Importing `test` from a fixtures file instead of `@core/lib/BaseTest` | `npm run lint` reports `framework-fixture` | Import `test as base` from `@core/lib/BaseTest` and call `base.extend(...)` in the test file, as in [Optional: Traditional Page Object Model](#provide-it-as-a-fixture-and-use-it) |
| Writing a selector string inside a page object | `npm run lint` reports `inline-locator` | Put it in the object repository and use `page.locator(lab.entry)` |
| Passing a selector string to `highlightAndClick` or `highlightAndFill` | The string is treated as visible text, so the element is not found | Pass `page.locator(lab.entry)`; see the [browser helpers guide](web-actions.md#clicking) |

Next: [Browser helpers (`webActions`)](web-actions.md).
