# TestTalon Community 3.0.0 release notes

This release moves TestTalon Community to one package layout (`packages/core`, `packages/web` and `packages/community`), renames files to kebab-case, and adds new samples and helpers. Import paths and some file locations changed, so **tests and configuration written for 2.1.0 need the updates listed in the next section.** Nothing is migrated automatically.

## Before you upgrade: breaking changes

| 2.1.0                                                                              | 3.0.0                                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/` (code and docs)                                                            | `packages/core/` (shared helpers, documentation) and `packages/web/` (browser helpers)                                                                                             |
| `import … from '@core/lib/BaseTest'`                                               | `import … from '@packages/web/lib/base-test'`                                                                                                                                      |
| `@core/lib/CommonFuncs`                                                            | `@packages/core/lib/common-funcs`                                                                                                                                                  |
| `@core/lib/WebActions`                                                             | `@packages/web/lib/web-actions`                                                                                                                                                    |
| `@core/lib/GenerateData` (separate functions such as `randomPick(...)`)            | `@packages/core/lib/generate-data`, class `GenerateData` with static methods: `GenerateData.randomPick(...)`                                                                       |
| `objectRepositories/GUI/todoMvcGUI.json`, imported as `@objectRepositories/GUI/…`  | `object-repositories/gui/todo-mvc-gui.json`, imported as `@objectRepositories/gui/todo-mvc-gui.json` (all repository files are kebab-case with a `-gui` suffix)                    |
| `config/.env.example`, `.env.qa`, `.env.staging`                                   | `config/project-profiles/.env.example`, `.env.qa`, `.env.staging`                                                                                                                  |
| `config/loadProfileData.ts`, `config/logger.ts`                                    | `packages/core/config/load-profile-data.ts`, `packages/core/config/logger.ts`                                                                                                      |
| `config/community/globalVariables.ts`                                              | `config/global/global-settings.ts` (with `config/shared/global-settings-runtime.ts`)                                                                                               |
| `config/community/playwrightConfig.ts`                                             | `packages/community/config/playwright-config.ts` (the root `playwright.config.ts` imports it)                                                                                      |
| `config/community/lint.cjs`                                                        | `packages/community/distribution/lint.cjs` (the `lint:tests` script already points there)                                                                                          |
| `data/pdf/sample.pdf`                                                              | `data/web/pdf/sample.pdf`                                                                                                                                                          |
| `tests/sample/webapp/functional/community/demo.csv`                                | `data/web/demo.csv`                                                                                                                                                                |
| `tests/sample/webapp/functional/otherProjects/…`, `playwright-site/…`, `todomvc/…` | `tests/sample/webapp/functional/community/samples/…` (file names are kebab-case; the two online examples are `playwright-site-get-started.test.ts` and `todomvc-add-todo.test.ts`) |
| `tests/sample/webapp/functional/community/demo.html`                               | `sample-app/community-demo/demo.html`                                                                                                                                              |
| `.github/workflows/community.yml`                                                  | `.github/workflows/testtalon-community-ci.yml` (same workflow, new file name)                                                                                                      |

The `@config/*` alias is unchanged. `@packages/*` is new.

## New

- **More test data in `GenerateData`:** `firstName()`, `lastName()`, `fullName()`, `email()`, `password()`, `address()`, `city()`, `zipCode()`, `phoneNumber()`, `phoneIMEI()`, `person()` and `organization()`, in addition to the existing random-value and account helpers. All are described in the test-data guide.
- **Test-Run reporting.** Every project now reports with four reporters, set once in `packages/community/config/playwright-config.ts`: **List** (terminal), **Test-Run** (`packages/reporting/custom/test-run-reporter.ts`), **HTML** (`logs/html-report`) and **JSON** (`logs/json-report.json`). Run `npm run showreport` after a test run to open the HTML report.
- **Sample applications in `sample-app/`.** Pages that tests open locally live in `sample-app/<name>/`: the bundled demo page, the dialogs, frame and new-tab pages, and a widgets page (accordion, tabs, slider, progress bar, date input and autocomplete). `serveSampleApp(page.context(), 'widgets', origin)` from `@packages/web/lib/sample-app` serves one of these folders at an address that is not a real site, so a test needs no server, network or account.
- **Widgets sample test.** `tests/sample/webapp/functional/community/samples/widgets.test.ts` exercises the widgets page offline and two interactive elements of the public Playwright site.
- **Product-store sample tests.** Three tests in `tests/sample/webapp/functional/community/product-store/` (login, and two variants of adding a product and buying it) with their data in `data/web/`, their selectors in `object-repositories/gui/` and shared helpers in `packages/web/lib/product-store.ts` (`openCart`, `getCreatedRow`, `addProductToCart`, `cleanupCreatedRows`) and `packages/web/lib/login.ts`. They run against a public demo shop and clean up the cart rows they create.
- **Locator extraction.** `npm run locator:extract` collects the selectors of a page into `object-repositories/gui/`. The XPath strategies guide is `docs/guide/create-tests/xpath-locator-strategies.md`.
- **Credential helpers** (`packages/core/lib/credential-helpers.ts`): `encipherPassword()` and `decipherPassword()` take the key from `TESTTALON_ENCRYPTION_KEY` and never log the plaintext.
- **Docker support.** A `Dockerfile` and a `.dockerignore` in the project root build an image with Node.js 24, your locked dependencies and Chromium, and run `npm test`. Build and run commands are in `docs/guide/start/setup.md` ("Run the tests in Docker").
- **Browser projects.** `packages/web/config/projects.ts` is part of the package and the root `playwright.config.ts` uses it. Community now has these projects: `dev` (Chromium), `local`, `uat`, `prodBeta`, `prod`, `webkit`, the device-emulation projects `Pixel 4a (5G)` and `iPhone 14 (mobile safari)`, and the two sample projects `staging-chromium` and `qa-firefox`.
- **Data file aliases.** `readCsvDataFile` and `getPDFText` accept project aliases such as `@data/web/demo.csv`, as well as relative and absolute paths.
- **Compiled output runs in plain Node.** `npm run build` rewrites the path aliases in `dist/` to relative paths, so compiled modules load each other directly.

## Changed

- **Sample profile files.** The profiles in `config/project-profiles/` (`dev`, `local`, `uat`, `prodBeta`, `prod`, `qa`, `staging` and `.env.example`) are plain sample files with placeholder values such as `your-username-here`. They contain no credentials. Replace the values with your own, and encrypt real credentials with dotenvx before you commit them (see `docs/guide/configure/configuration-and-profiles.md`).
- `npm run test:smoke` runs only the bundled demo (`tests/sample/webapp/functional/community/browser.test.ts`). `npm test` keeps its meaning: build, unit tests, then that smoke test. The sample tests run with `npm run test:web` (offline ones) and `npm run test:online` (the two that visit a public site).
- The TodoMVC sample opens its public address (`https://demo.playwright.dev/todomvc/#/`) directly; the project's `baseURL` and the `qa` profile do not affect it.
- The documentation was updated for the new layout and for the samples above.

## Fixed

- `npm run test:unit` pointed at a folder that is not part of the package and skipped the shipped Web unit test. It now runs `packages/core/tests`, `packages/web/tests/unit` and the reporter's test.
- `getPDFText` no longer fails when given an `@data/...` path.

## Requirements

- Node.js 24 or later with npm, and Git.
- `npm ci` (a full install; `--omit=dev` is not supported), then `npx playwright install chromium`. Firefox and WebKit are needed only for projects that use them.
