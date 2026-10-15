# TestTalon Community V1 — Features & Capabilities

[Documentation index](README.md)

TestTalon Community is a free Playwright + TypeScript Web test automation framework. Community V1 focuses exclusively on Web automation. It is free to use for learning, evaluation, demonstrations and proofs of concept under the Community license (see `LICENSE.txt`).

| Category | Community V1 Capabilities |
| --- | --- |
| Web Automation | Playwright + TypeScript browser tests, run in Chromium, Firefox and WebKit. Start with [Getting started](setup.md) |
| Branded Browsers | Google Chrome and Microsoft Edge, configured per project with Playwright's `channel` option. They are installed separately; see [Chrome and Edge](projects-and-environments.md#google-chrome-and-microsoft-edge) |
| Configuration | Multiple environments, environment profiles (`config/.env.<profile>`, selected with `metadata.envProfile`), multiple Playwright projects in one `playwright.config.ts` and a browser per project. Three projects ship ready to run: `dev`, `staging-chromium` and `qa-firefox`. See the [quick start](projects-and-environments.md#quick-start-your-first-web-projects) and [Configuration and profiles](configuration-and-profiles.md) |
| Execution | Parallel execution (two workers by default); headed on your machine and headless in CI; run one, several or all projects with `--project`; filter tests by tag or title with `--grep`; retries and timeouts you can change (by default no retries, 120 seconds per test and 10 seconds per assertion). See [Run your tests](writing-tests.md#run-your-tests) |
| Architecture | Object Repository (JSON selectors in `objectRepositories/GUI/`), WebActions (browser helpers such as waiting for a page, highlighting, clicking, filling, handling dialogs and downloads) and reusable common functions (framework helpers plus your own workflows). See [The recommended architecture](writing-tests.md#the-recommended-architecture) and [Browser helpers](web-actions.md) |
| Testing | Assertions with Playwright `expect`; test data generation (random text, numbers, dates and accounts) and CSV, Excel, text and PDF data helpers; reusable test scenarios with tags and steps; fixtures from `@core/lib/BaseTest` (`page`, `webActions` and automatic profile loading). See [Write your own tests](writing-tests.md) and [Test data](test-data.md) |
| Web Examples | Approved Web examples under `tests/webapp/`: a bundled smoke test, `AlertsFrameWindows.test.ts` (alerts, confirms, prompts, an iframe and a new tab), `Widgets.test.ts` (accordion, tabs, slider, progress bar, date input and autocomplete), the Playwright website and TodoMVC examples, a HAR record-and-replay test and a PDF text test. See [The sample Web tests](setup.md#the-sample-web-tests) |
| Debugging | Screenshots, Playwright traces and video recording where the browser supports it, kept for failed tests in `logs/test-results/`. See [Investigate a failure](reporting-and-logging.md#investigate-a-failure) |
| Reporting | List reporter in the terminal, HTML reporter in `logs/html-report/` and JSON reporter in `logs/json-report.json`. See [Reports and logs](reporting-and-logging.md) |
| CI/CD | A GitHub Actions workflow that runs the tests and saves the reports as downloadable artifacts. See [GitHub Actions](github-actions.md) |
| Documentation | Guides for installation, configuration, environment profiles, Web testing, reporting, CI/CD and troubleshooting, listed in the [documentation index](README.md) and [Troubleshooting](troubleshooting.md) |
| Security | Only Web features ship: no premium, internal or experimental modules. The package contains no secrets and no private profiles; its two demo profiles hold only a public demo site address. See [Secrets](configuration-and-profiles.md#secrets) |

## Need More Advanced Testing Capabilities?

Community focuses on Web automation.

If your work also needs Mobile, API or Database testing, ReportPortal reporting or the AI-powered TestCreator, see TestTalon Commercial.

[Explore Commercial](https://testtalon.com)
