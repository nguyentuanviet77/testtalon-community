# Troubleshooting

[Documentation index](README.md) | Previous: [GitHub Actions](github-actions.md)

Find your symptom, read the cause, apply the fix. Messages are quoted as Community prints them. Where a longer explanation exists, the last column links to it.

## First aid

Run these in order before digging further. Each one narrows the problem:

```bash
node --version
npm run typecheck
npm run lint
npx playwright test --list
```

| Command | If it fails, the problem is in... |
| --- | --- |
| `node --version` | Your Node.js installation (needs 24 or later) |
| `npm run typecheck` | TypeScript: a typo, a wrong import or a wrong repository key |
| `npm run lint` | A test that breaks a convention |
| `npx playwright test --list` | Configuration, the project name, or test discovery |

If all four succeed, the problem is at run time: read the error of the failing test and open its [trace](reporting-and-logging.md#investigate-a-failure).

## Installation

| Symptom | Cause and fix |
| --- | --- |
| `npm warn EBADENGINE` or `Unsupported engine` | Your Node.js is older than 24. Install Node.js 24 or later and open a new terminal |
| `npm ci` fails with `can only install packages when your package.json and package-lock.json ... are in sync` | One of the two files was edited by hand. Restore both from your Git history or the original download |
| `npm warn deprecated ...` and `4 vulnerabilities` after `npm ci` | Informational output from dependencies. It does not stop the install and needs no action to get started |
| `npm run build` fails because `tsc` is not found | Dependencies are missing or were installed without development packages. Run `npm ci --ignore-scripts` (not `--omit=dev`) |
| Browser download fails or times out | Check your network. Behind a proxy, set `HTTPS_PROXY` before running `npx playwright install` |
| `Host system is missing dependencies to run browsers` (Linux) | Run `npx playwright install --with-deps chromium` |

## Running tests

| Symptom | Cause and fix |
| --- | --- |
| `browserType.launch: Executable doesn't exist ...` | That browser is not installed. Run `npx playwright install chromium` (or `firefox`, or `webkit`) |
| `Error: No tests found.` | The file path or filter matches nothing. Test files must be under `tests/` and end in `.test.ts`. Check with `npx playwright test --list` |
| `Error: Project(s) "qa" not found. Available projects: "dev"` | The project does not exist. Community ships `dev`, `staging-chromium` and `qa-firefox`; add others in `playwright.config.ts` ([projects guide](projects-and-environments.md#troubleshooting)) |
| `Error: duplicate test title "same", first declared in ...` | Two tests in one file share a title. In a data-driven loop, put something unique from the row in the title ([Data-driven tests](test-data.md#data-driven-tests)) |
| `page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL` | `page.goto('/')` was used but the project has no `baseURL`. Run an environment project, or use a full URL ([projects guide](projects-and-environments.md#troubleshooting)) |
| `TimeoutError: locator.click: Timeout 1000ms exceeded` with `waiting for locator('#nope')` | The selector matches nothing, or the element is hidden. Check the object repository entry and the page. The trace shows what the page looked like |
| `Error: expect(locator).toHaveText(expected) failed` | The page showed different text than expected. The message prints expected and received values |
| `Test timeout of 120000ms exceeded` | The test took longer than its limit. Find the slow step in the trace; do not just raise the limit ([change defaults](configuration-and-profiles.md#change-playwrights-defaults)) |
| Tests are slow and the browser seems to move in slow motion | The default configuration pauses 200 ms between browser operations (`slowMo`). Set `launchOptions: { slowMo: 0 }` in `use` ([change defaults](configuration-and-profiles.md#change-playwrights-defaults)) |
| A browser window opens during every run | Normal outside CI. It runs headless when the `CI` environment variable is set, or add `headless: true` to `use` |
| A test passes alone but fails in the full run | Tests share data or order. Give each test its own data ([Test data](test-data.md#best-practices)), or run with `--workers=1` to confirm |
| A test passes sometimes and fails sometimes | Measure it with `--repeat-each=10`, then fix the wait. Prefer `expect(...)` over `webActions.delay` |
| A dialog helper never finishes | Register `waitForDialogAndAccept...` **before** the action that opens the dialog ([Dialogs](web-actions.md#dialogs)) |
| `Column "<name>" does not exist in the CSV file.` | You read a column that `readDataFromFile` did not produce. Its columns are named `column0`, `column1`...; or switch to `readCsvDataFile` ([Test data](test-data.md#the-older-readdatafromfile-helper)) |
| `File not found: ...` and an empty data array | `readCsvDataFile` was given a path that does not exist. Paths start at the project root |

## Writing tests

| Symptom | Cause and fix |
| --- | --- |
| `npm run lint` reports `[framework-import]` or `[framework-fixture]` | Import `test` and `expect` from `@core/lib/BaseTest`, not from `@playwright/test` |
| `npm run lint` reports `[inline-locator]` | A selector or text was written inline. Move it to `objectRepositories/GUI/<page>GUI.json` and import it ([Check your conventions](writing-tests.md#check-your-conventions)) |
| `error TS2551: Property 'nameInpt' does not exist on type ... Did you mean 'nameInput'?` | A repository key is misspelled. Fix the key in the test or the JSON file |
| `Cannot find module '@objectRepositories/GUI/xGUI.json'` (shown by Playwright and by `npm run build`) | The file name or folder is wrong. It must be `objectRepositories/GUI/xGUI.json` |
| `Cannot find module '@core/lib/...'` | Use one of the supported aliases: `@core/lib/BaseTest`, `WebActions`, `CommonFuncs` or `GenerateData` ([aliases](writing-tests.md#the-parts-of-a-test)) |
| `Test has unknown parameter "webActions".` | The test imports `test` from `@playwright/test` instead of `@core/lib/BaseTest` |

## Configuration and profiles

| Symptom | Cause and fix |
| --- | --- |
| `Environment profile "dev": malformed profile.` | `config/.env.dev` has a line that is not `KEY=value` or a `#` comment. Fix or delete the file |
| `Environment profile: invalid nonnegative numeric setting.` | `GUI_TIMEOUT` is not a number, or is negative |
| `Environment profile: invalid boolean setting.` | `HIGHLIGHT_TEST_OBJECT_ENABLED` is not exactly `true` or `false` |
| `Environment profile: invalid profile name.` | The project name contains a space or another unsupported character. Rename it, or set `metadata.envProfile` |
| A profile value is `undefined` | It is read at the top of a file instead of inside a test. Profile values exist only while a test runs ([details](configuration-and-profiles.md#read-settings-inside-tests-not-at-the-top-of-a-file)) |
| `ENV_PROFILE=qa` has no effect | `ENV_PROFILE` is not used. The profile is chosen by the project's `metadata.envProfile` or its name |
| A setting in the profile is ignored | The same variable is set in your shell or CI; the environment you start with wins |
| `Missing base URL for required environment(s): staging` | `REQUIRED_ENVIRONMENTS` lists an environment whose `<NAME>_BASE_URL` is not set |
| `QA_BASE_URL is not a valid URL.` | The value is not a complete URL. Include `https://` |
| `git status` lists `config/.env.keys` as a new file | The private key file is not ignored. Check that `.gitignore` still contains `.env.keys`, and never commit it |
| `Environment profile "shop": decryption/key failure` | The profile is encrypted and no private key is available. Put `config/.env.keys` next to it, or set `DOTENV_PRIVATE_KEY_SHOP` (named after the profile) in the shell or CI ([Encrypt a profile](configuration-and-profiles.md#encrypt-a-profile-with-dotenvx)) |

## Projects and browsers

| Symptom | Cause and fix |
| --- | --- |
| A project is missing from `--list` | Environment projects exist only when their URL is set. Count the variables you set times the browsers, plus `dev` |
| More projects run than expected | `npx playwright test` with no `--project` runs every project. Select with `--project=<name>` |
| A test passes in Chromium and fails in Firefox or WebKit | A real browser difference. Run it alone with `--project=<name> --headed`; fix the test or the selector |
| `browserType.launch: Executable doesn't exist ...` for Firefox or WebKit | That browser is not installed. Run `npx playwright install firefox webkit` (or `chromium`) |
| Tests ran against the wrong environment | Print what is selected with `npx playwright test --list --project=<name>`, check the shell and CI variables, and remember that shell and CI values win over `config/.env.environments` |
| `Environment profile "environments"` error | `config/.env.environments` has a line that is not `KEY=value` or a `#` comment. Fix or delete the file |
| `npm run typecheck` reports an error in `playwright.config.ts` | Read the first message. Common causes are a missing comma, or a browser name other than `chromium`, `firefox` or `webkit` |
| `Chromium distribution 'chrome' is not found at ...` (or `'msedge'`) | The project uses `channel: 'chrome'` or `'msedge'` but that browser is not installed. Install it, or run `npx playwright install chrome` / `npx playwright install msedge` (this replaces an existing stable install). See [Google Chrome and Microsoft Edge](projects-and-environments.md#google-chrome-and-microsoft-edge) |
| `Unsupported firefox channel "chrome"` | `channel` works only with `browserName: 'chromium'`. Remove it from Firefox and WebKit projects |

Four problems that belong to the project-building flow itself (`Project(s) ... not found`, `No tests found` for `prod-*`, `Cannot navigate to invalid URL`, invalid or missing base URL) are in the [projects guide](projects-and-environments.md#troubleshooting).

## Reports and logs

| Symptom | Cause and fix |
| --- | --- |
| `npm run showreport` shows nothing or fails | No report exists. Run `npm test` or any Playwright run first |
| The report is from an older run | Each run replaces `logs/html-report`. Re-open it after the new run |
| No screenshot, video or trace for a failed test | They are kept only for failures, in `logs/test-results/<test>/`. A passing test keeps none ([captured artifacts](reporting-and-logging.md#what-is-captured-and-when)) |
| `--reporter=dot` produced no HTML report | A `--reporter` option replaces the configured reporters for that run |
| Log lines appear twice on the console | Expected outside production mode: one formatted line and one plain line. The log file has only the formatted line |
| No log file | Nothing used the logger. Importing `test` from `@core/lib/BaseTest`, or printing with `console.log` in such a test, creates `logs/info-<date>.log` |

## GitHub Actions

See the table in the [GitHub Actions guide](github-actions.md#troubleshooting-ci).

## Collect details before you ask for help

If the issue is not covered here, gather this so it can be reproduced:

1. The exact command you ran.
2. The full output, including the first error.
3. `node --version`, `npm --version` and `npx playwright --version`.
4. Your operating system, and whether the run was local or in CI.
5. Your root `playwright.config.ts` if you changed it, and the failing test file.

Remove passwords, tokens and internal addresses from anything you share.
