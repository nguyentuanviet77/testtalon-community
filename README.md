<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/shared/images/brand/testtalon-logo-horizontal-white.svg">
    <img src="docs/shared/images/brand/testtalon-logo-horizontal.png" alt="TestTalon" width="360">
  </picture>
</p>

# TestTalon Community

## AI-Powered Unified Test Automation Platform

**Community Edition 3.0.0**

TestTalon Community is a Playwright + TypeScript starter for **Web GUI automation**. It gives you a ready-to-run example, browser helpers, CSV test-data helpers, basic logging and Playwright HTML/JSON reports, with no account, service or credential needed to get started.

## What is included

| Included in Community                                       | Commercial only                                       |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| Web GUI automation with Playwright (bundled Chromium)       | API testing and Swagger/OpenAPI conversion            |
| `test`/`expect` fixtures and browser helpers (`webActions`) | Native, hybrid and mobile-browser testing with Appium |
| Repository-backed selectors in `object-repositories/gui/`   | Database helpers                                      |
| CSV test data and data-generation helpers                   | ReportPortal, email, Jira and Rally reporting         |
| Playwright list, HTML and JSON reports                      | TestCreator AI scenario-to-test tooling               |
| Optional local configuration profiles, basic logging        |                                                       |

Community does not include AI TestCreator agents or generation functionality. It focuses on Web GUI testing. API, Appium, Database, Security, AIO, Allure and other external reporting integrations, plus TestCreator AI tooling, belong to Commercial.

For a one-page summary of Community 3.0.0, see [Features & capabilities](docs/guide/about/features-and-capabilities.md).

## Documentation

Start at the [documentation home](docs/guide/README.md), which follows the work from understanding the platform to reading the results. The recommended learning sequence:

1. [Getting started](docs/guide/start/setup.md)
2. [Write your own tests](docs/guide/create-tests/writing-tests.md): the recommended architecture (object repository, `webActions`, common functions, scenarios, data), a login example, tags, optional Page Object Model
3. [Browser helpers (`webActions`)](docs/guide/create-tests/web-actions.md)
4. [Test data](docs/guide/create-tests/test-data.md)
5. [Configuration and profiles](docs/guide/configure/configuration-and-profiles.md)
6. [Playwright projects and environments](docs/guide/configure/projects-and-environments.md): a quick start for your first Web projects, then Dev, QA, Staging, Production; Chromium, Firefox, WebKit, Google Chrome, Microsoft Edge
7. [Reports and logs](docs/guide/results/reports-and-logs.md)
8. [GitHub Actions](docs/guide/run/github-actions.md)

Also: [Troubleshooting](docs/guide/help/troubleshooting.md).

Shared guide for your own project: [Configure your own environments](docs/guide/configure/configure-your-environment.md) (plaintext, your own encryption keys, or CI secrets).

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

The bundled example is `tests/sample/webapp/functional/community/browser.test.ts`. It loads a local page (`demo.html`), fills a form with a value from `demo.csv`, and checks the result, using selectors from `object-repositories/gui/community-demo-gui.json`.

Other commands: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:unit`,
`npm run test:list` (discovery only), and `npm run test:web` (the offline Web examples).
Community ships its examples under `tests/sample/webapp/functional/community/`; add your own tests
under `tests/real-projects/webapp/functional/`, so they stay separate from the examples. The `test:online` script selects bundled and customer `@Online` tests and requires network access; examples include Playwright's website and TodoMVC. Community ships `dev`, the browser projects of `packages/web/config/projects.ts` (desktop browsers and device emulation in a desktop browser) and two sample browser projects
(`staging-chromium`, `qa-firefox`). These projects select the local demo and Product Store examples in the Community example directory, excluding its `samples/` subtree. To run only the local demo, pass `tests/sample/webapp/functional/community/browser.test.ts` explicitly. The sample profiles
illustrate environment selection; their URLs are not used by the local demo. There is no
separate `test:dev` or `test:all`.

**Next: set up your own Web project.** The [Quick start in the projects guide](docs/guide/configure/projects-and-environments.md#quick-start-your-first-web-projects) shows, step by step, how to create an environment profile, configure a Web project in `playwright.config.ts` (name, browser, tests, profile), run it from the command line and from VS Code, add a second project, and run one or all projects. For several environments (Dev, QA, Staging, Production) and browsers (Chromium, Firefox, WebKit), continue with the rest of the [Playwright projects and environments guide](docs/guide/configure/projects-and-environments.md#advanced-configuration).

## Add your own Web test

1. Put selectors in `object-repositories/gui/<page>-gui.json`:

   ```json
   { "login": { "username": "#username", "submit": "button[type=submit]" } }
   ```

2. Create `tests/real-projects/webapp/functional/<area>/<name>.test.ts`:

   ```ts
   import { test, expect } from '@packages/web/lib/base-test';
   import { login } from '@objectRepositories/gui/login-gui.json';

   test('login form is shown', { tag: ['@GUI'] }, async ({ page, webActions }) => {
       await page.goto(process.env.GUI_BASE_URL ?? 'https://example.test/login');
       await webActions.highlightAndFill(page.locator(login.username), 'demo-user');
       await expect(page.locator(login.submit)).toBeVisible();
   });
   ```

3. Run it: `npx playwright test tests/real-projects/webapp/functional/<area>/<name>.test.ts --project=dev`.

Always import `test` and `expect` from `@packages/web/lib/base-test`, keep selectors in the repository files, and replace the invented URL with your application's. Read application URLs from your profile or CI environment rather than hard-coding them.

## Local Web configuration

- `playwright.config.ts` is the entry point. Each project selects the profile named in its `metadata.envProfile` (`dev` for the default `dev` project; `staging` and `qa` for the two sample projects, whose public demo profiles ship with Community). `ENV_PROFILE` does not select a profile.
- Platform defaults live in `config/global/global-settings.ts`. Invocation/CI values win for declared global settings; profiles cannot change them. Project values live in `config/project-profiles/.env.<profile>` and replace matching application environment values during tests. Globals are never copied into `process.env`.
- A missing profile is fine for the bundled example. A profile that exists but is unreadable or malformed fails with an error naming it.
- `config/project-profiles/.env.example` lists profile examples. Set `GUI_TIMEOUT` and `HIGHLIGHT_TEST_OBJECT_ENABLED` in global settings instead of profiles. Copy the template without editing it:

  ```bash
  test -e config/project-profiles/.env.dev || cp config/project-profiles/.env.example config/project-profiles/.env.dev
  ```

- To use a different profile name, set it in the project's `metadata.envProfile` and create `config/project-profiles/.env.<name>` (letters, digits, `_`, `-` and single dots only).
- The application address (`GUI_BASE_URL`) belongs in the profile, and tests read it with `process.env`: see [where the application address comes from](docs/guide/configure/configuration-and-profiles.md#where-the-application-address-comes-from).
- To add projects, environments and browsers, start with the [Quick start](docs/guide/configure/projects-and-environments.md#quick-start-your-first-web-projects).
- Profiles are committed with your source code, so never put plain-text credentials in them: encrypt secrets with dotenvx or use CI secrets (see [Secrets](docs/guide/configure/configuration-and-profiles.md#secrets)). Only `config/project-profiles/.env.keys`, which holds the private keys, is ignored by Git; never commit it, authentication state or private keys.

Reports go to `logs/html-report`, `logs/json-report.json` and `logs/test-results`.

## Troubleshooting

| Symptom                                                                   | Fix                                                                                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Executable doesn't exist` or browser launch error                        | Run `npx playwright install chromium`                                                                                                                        |
| Node version or `engines` error                                           | Install Node.js 24 or later (`node --version`)                                                                                                               |
| `Environment profile "<name>"` error                                      | Fix or remove `config/project-profiles/.env.<name>`: it must contain only valid `KEY=value` lines and `#` comments                                           |
| `No tests found`                                                          | Test files must be under `tests/` and end in `.test.ts`                                                                                                      |
| `npm run showreport` shows nothing                                        | Run `npm test` first so `logs/html-report` exists                                                                                                            |
| Build or typecheck errors after adding a test                             | Run `npm run build` and fix the reported file; imports must use `@packages/web/lib/base-test` and `@objectRepositories/...`                                  |
| `Project(s) "..." not found`, or a missing browser, after adding projects | See the troubleshooting table in the [Playwright projects and environments guide](docs/guide/configure/projects-and-environments.md#troubleshooting) |

Run a failing test alone with `npx playwright test <file> --project=dev` to see the full error.

## Feedback and participation

Bug reports, feature requests, documentation feedback and technical discussions from developers worldwide are welcome through issues, or by email to support@testtalon.com. TestTalon is developed in a private source repository and this repository is generated from it at each release, so external source-code pull requests are not accepted at this stage. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

TestTalon Community is proprietary, source-available software under the TestTalon Free / Community Source Code License V4. It is intended for learning, evaluation, demonstrations and proofs of concept; ongoing business use requires a Commercial License. The exact terms are in `LICENSE.txt`: read them before using or sharing the product. It is not an open-source license and is not MIT. Dependency licenses remain separate. The included GitHub Actions workflow is a template (the [GitHub Actions guide](docs/guide/run/github-actions.md#run-an-environment-in-several-browsers) shows how to run a selected environment and browser); check the license before using it for business CI.

Upgrade to Commercial for API, Swagger, mobile, database, reporting integrations and TestCreator at https://testtalon.com/pricing.

## Customer profile template

Copy `config/project-profiles/.env.example` to `config/project-profiles/.env.<profile>` without replacing an existing profile; profiles are committed with your source code, so keep plain-text credentials out of them. Set the corresponding project `metadata.envProfile` in the root `playwright.config.ts`. Invocation/CI values take precedence; inject secrets through the CI secret store, or encrypt them with dotenvx (the private keys file `config/project-profiles/.env.keys` is ignored by Git and must never be committed).
