# TestTalon Community

## AI-Powered Unified Test Automation Platform

**Community Edition 2.1.0**

TestTalon Community is a Playwright + TypeScript starter for **Web GUI automation**. It gives you a ready-to-run example, browser helpers, CSV test-data helpers, basic logging and Playwright HTML/JSON reports, with no account, service or credential needed to get started.

## What is included

| Included in Community | Commercial only |
| --- | --- |
| Web GUI automation with Playwright (bundled Chromium) | API testing and Swagger/OpenAPI conversion |
| `test`/`expect` fixtures and browser helpers (`webActions`) | Native, hybrid and mobile-browser testing with Appium |
| Repository-backed selectors in `objectRepositories/GUI/` | Database helpers |
| CSV test data and data-generation helpers | ReportPortal, email, Jira and Rally reporting |
| Playwright list, HTML and JSON reports | TestCreator AI scenario-to-test tooling |
| Optional local configuration profiles, basic logging | |

Community does not include AI TestCreator agents or generation functionality. Security testing and Allure reporting are not part of any edition.

For a one-page summary of what Community V1 can do, see [Features & capabilities](core/docs/community/features-and-capabilities.md).

## Documentation

[Installation, IDE Setup & Getting Started Guide](docs/shared/TestTalon-Getting-Started.md)

Step-by-step guides are in the [Community documentation index](core/docs/community/README.md), with a recommended learning sequence:

1. [Getting started](core/docs/community/setup.md)
2. [Write your own tests](core/docs/community/writing-tests.md): the recommended architecture (object repository, `webActions`, common functions, scenarios, data), a login example, tags, optional Page Object Model
3. [Browser helpers (`webActions`)](core/docs/community/web-actions.md)
4. [Test data](core/docs/community/test-data.md)
5. [Configuration and profiles](core/docs/community/configuration-and-profiles.md)
6. [Playwright projects and environments](core/docs/community/projects-and-environments.md): a quick start for your first Web projects, then Dev, QA, Staging, Production; Chromium, Firefox, WebKit, Google Chrome, Microsoft Edge
7. [Reports and logs](core/docs/community/reporting-and-logging.md)
8. [GitHub Actions](core/docs/community/github-actions.md)

Also: [Troubleshooting](core/docs/community/troubleshooting.md).

## Requirements

- Node.js 24 or later (with npm) and Git

## Quick start

```bash
git clone <repository-url>
cd testtalon-community
npm ci --ignore-scripts
npx playwright install chromium
npm test
npm run showreport
```

1. `git clone` copies the project into a folder named `testtalon-community` (replace `<repository-url>` with the clone URL shown on the Community repository page), and `cd testtalon-community` enters it. If you downloaded a ZIP instead, extract it and open a terminal in the folder that contains `package.json`.
2. `npm ci --ignore-scripts` installs the exact dependencies from `package-lock.json`.
3. `npx playwright install chromium` downloads the browser Playwright drives. Google Chrome is not needed.
4. `npm test` builds the project, runs the unit checks, then runs the bundled smoke test. It works offline and needs no profile file or credentials. A passing run ends with `1 passed`.
5. `npm run showreport` opens the HTML report (`logs/html-report`). A JSON report is written to `logs/json-report.json`.

The bundled example is `tests/webapp/functional/community/browser.test.ts`. It loads a local page (`demo.html`), fills a form with a value from `demo.csv`, and checks the result, using selectors from `objectRepositories/GUI/communityDemoGUI.json`.

Other commands: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:list` (lists tests without running them), `npm run test:web` (all sample Web tests that need no network: alerts, frames, windows, widgets, HAR and PDF) and the `test:online` script (the sample tests that visit the public playwright.dev site). Community ships `dev` and two sample projects (`staging-chromium`, `qa-firefox`) with public demo profiles; there is no separate `test:dev` or `test:all`.

**Next: set up your own Web project.** The [Quick start in the projects guide](core/docs/community/projects-and-environments.md#quick-start-your-first-web-projects) shows, step by step, how to create an environment profile, configure a Web project in `playwright.config.ts` (name, browser, tests, profile), run it from the command line and from VS Code, add a second project, and run one or all projects. For several environments (Dev, QA, Staging, Production) and browsers (Chromium, Firefox, WebKit), continue with the rest of the [Playwright projects and environments guide](core/docs/community/projects-and-environments.md#advanced-configuration).

## Add your own Web test

1. Put selectors in `objectRepositories/GUI/<page>GUI.json`:

   ```json
   { "login": { "username": "#username", "submit": "button[type=submit]" } }
   ```

2. Create `tests/webapp/functional/<area>/<name>.test.ts`:

   ```ts
   import { test, expect } from '@core/lib/BaseTest';
   import { login } from '@objectRepositories/GUI/loginGUI.json';

   test('login form is shown', { tag: ['@GUI'] }, async ({ page, webActions }) => {
       await page.goto(process.env.GUI_BASE_URL ?? 'https://example.test/login');
       await webActions.highlightAndFill(page.locator(login.username), 'demo-user');
       await expect(page.locator(login.submit)).toBeVisible();
   });
   ```

3. Run it: `npx playwright test tests/webapp/functional/<area>/<name>.test.ts --project=dev`.

Always import `test` and `expect` from `@core/lib/BaseTest`, keep selectors in the repository files, and replace the invented URL with your application's. Read application URLs from your profile or CI environment rather than hard-coding them.

## Local Web configuration

- `playwright.config.ts` is the entry point. Each project selects the profile named in its `metadata.envProfile` (`dev` for the default `dev` project; `staging` and `qa` for the two sample projects, whose public demo profiles ship with Community). `ENV_PROFILE` does not select a profile.
- Settings live in a profile such as `config/.env.dev` (committed with your source code), or in the environment you start Playwright with. Invocation/CI values win over profile values; profile values win over built-in defaults.
- A missing profile is fine for the bundled example. A profile that exists but is unreadable or malformed fails with an error naming it.
- `config/.env.example` lists the supported settings (`GUI_TIMEOUT`, `HIGHLIGHT_TEST_OBJECT_ENABLED`). Copy it, do not edit it:

  ```bash
  test -e config/.env.dev || cp config/.env.example config/.env.dev
  ```

- To use a different profile name, set it in the project's `metadata.envProfile` and create `config/.env.<name>` (letters, digits, `_`, `-` and single dots only).
- The application address (`GUI_BASE_URL`) belongs in the profile, and tests read it with `process.env`: see [where the application address comes from](core/docs/community/configuration-and-profiles.md#where-the-application-address-comes-from).
- To add projects, environments and browsers, start with the [Quick start](core/docs/community/projects-and-environments.md#quick-start-your-first-web-projects).
- Profiles are committed with your source code, so never put plain-text credentials in them: encrypt secrets with dotenvx or use CI secrets (see [Secrets](core/docs/community/configuration-and-profiles.md#secrets)). Only `config/.env.keys`, which holds the private keys, is ignored by Git; never commit it, authentication state or private keys.

Reports go to `logs/html-report`, `logs/json-report.json` and `logs/test-results`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Executable doesn't exist` or browser launch error | Run `npx playwright install chromium` |
| Node version or `engines` error | Install Node.js 24 or later (`node --version`) |
| `Environment profile "<name>"` error | Fix or remove `config/.env.<name>`: it must contain only valid `KEY=value` lines and `#` comments |
| `No tests found` | Test files must be under `tests/` and end in `.test.ts` |
| `npm run showreport` shows nothing | Run `npm test` first so `logs/html-report` exists |
| Build or typecheck errors after adding a test | Run `npm run build` and fix the reported file; imports must use `@core/lib/BaseTest` and `@objectRepositories/...` |
| `Project(s) "..." not found`, or a missing browser, after adding projects | See the troubleshooting table in the [Playwright projects and environments guide](core/docs/community/projects-and-environments.md#troubleshooting) |

Run a failing test alone with `npx playwright test <file> --project=dev` to see the full error.

## Feedback and participation

Bug reports, feature requests, documentation feedback and technical discussions from developers worldwide are welcome through issues, or by email to support@testtalon.com. TestTalon is developed in a private source repository and this repository is generated from it at each release, so external source-code pull requests are not accepted at this stage. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

TestTalon Community is proprietary, source-available software under the TestTalon Free / Community Source Code License V4. It is intended for learning, evaluation, demonstrations and proofs of concept; ongoing business use requires a Commercial License. The exact terms are in `LICENSE.txt`: read them before using or sharing the product. It is not an open-source license and is not MIT. Dependency licenses remain separate. The included GitHub Actions workflow is a template (the [GitHub Actions guide](core/docs/community/github-actions.md#run-an-environment-in-several-browsers) shows how to run a selected environment and browser); check the license before using it for business CI.

Upgrade to Commercial for API, Swagger, mobile, database, reporting integrations and TestCreator at https://testtalon.com/pricing.

## Customer profile template

Copy `config/.env.example` to `config/.env.<profile>` without replacing an existing profile; profiles are committed with your source code, so keep plain-text credentials out of them. Set the corresponding project `metadata.envProfile` in the root `playwright.config.ts`. Invocation/CI values take precedence; inject secrets through the CI secret store, or encrypt them with dotenvx (the private keys file `config/.env.keys` is ignored by Git and must never be committed).
