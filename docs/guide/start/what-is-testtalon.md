<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../../shared/images/brand/testtalon-logo-horizontal-white.svg">
    <img src="../../shared/images/brand/testtalon-logo-horizontal.png" alt="TestTalon" width="360">
  </picture>
</p>

# What is TestTalon

## AI-Powered Unified Test Automation Platform

**Describe the scenario. Let AI build the automation.**

[Documentation home](../README.md) | Next: [Install and run your first test](getting-started.md)

TestTalon is one test automation platform for Web, API, Mobile, Database and Security testing, powered by AI agents, Playwright and TypeScript. It is built for scenario-driven test creation, execution and reporting across modern quality engineering workflows.

You receive the source code, open it in your editor, add your tests next to the examples, and run them from a terminal, from VS Code, or in a CI pipeline. It is not a hosted service or a desktop application.

| Edition    | What it covers                                                                                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Community  | Web GUI automation with Playwright, browser device emulation, environment profiles, shared helpers, test data, logging, failure artifacts, and HTML and JSON reports                                                                                                                                            |
| Commercial | Everything in Community, plus API testing, native Android and iOS testing through Appium, mobile browser testing, database testing, security testing, reporting integrations (Allure, email, ReportPortal, AIO Tests for Jira, Jira and Rally), and TestCreator, the AI agents that turn a scenario into a test |

The [editions page](../about/editions.md) has the full comparison.

## What you get

| You get                        | What it does                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Ready-to-run examples          | A bundled sample that runs offline, so you can see a passing test and its report in minutes                                         |
| The `test` fixture             | Playwright's `test` and `expect`, extended with the `page` and `webActions` fixtures and automatic loading of the project's profile |
| Browser helpers (`webActions`) | Waiting, clicking, filling, dialogs, downloads and highlighting, written once and reused by every test                              |
| Object repositories            | Selectors kept in JSON files under `object-repositories/`, so a changed page means one edit, not many                               |
| Test data helpers              | CSV and other file readers, and generators for random text, numbers, dates and accounts                                             |
| Profiles                       | One `.env` file per environment under `config/project-profiles/`, so the same test runs against dev, UAT or production              |
| Reports                        | A terminal list, a run log, an HTML report and a JSON report, with screenshots, video and traces kept for failed tests              |

The rows above apply to every edition. Commercial adds the API, mobile, database, security and TestCreator guides listed in its documentation home.

## How a run works

```text
npx playwright test
        |
        v
playwright.config.ts      defines the projects (environments and browsers), timeouts and reporters
        |
        v
selected project          chooses the browser and the profile to load
        |
        v
test file                 imports test and expect, gets its fixtures, reads selectors and data
        |
        v
reporters                 write the terminal output, the run log, the HTML and JSON reports
```

1. **You start a run** with a command such as `npx playwright test --project=dev`, or by pressing the run button in VS Code.
2. **Playwright reads `playwright.config.ts`.** It lists the projects. A project is one combination of browser, settings and profile, for example `dev` or `uat`.
3. **Each test receives fixtures.** The profile of the project is loaded first, so `process.env` holds the values of the selected environment, such as the application address.
4. **The test runs.** It opens the application, performs steps through `webActions` and Playwright, and checks results with `expect`. Selectors come from an object repository and data from a file or a generator.
5. **Reporters write the results**, and screenshots, video and a trace are kept for tests that fail.

## The ideas to learn first

- **Project.** A named Playwright setup: browser, device, timeouts and the profile it loads. You select one with `--project=<name>`.
- **Profile.** A file named `.env.<name>` in `config/project-profiles/` that holds the values for one environment. Secrets in it must be encrypted or supplied by CI.
- **Object repository.** A JSON file of selectors for one page, `object-repositories/gui/<page>-gui.json`.
- **Sample and real projects.** `tests/sample/` holds examples to read and copy from. Your own tests go in `tests/real-projects/`.

The [glossary](../reference/glossary.md) explains every term used in these guides.

## Where to go next

| I want to                            | Go to                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| See the folders and what goes where  | [Platform structure](platform-structure.md)                             |
| Install TestTalon and run the sample | [Installation and first run](getting-started.md) |
| Understand how a test is written     | [Test basics](../create-tests/test-basics.md)                           |
| Choose my edition                    | [Editions](../about/editions.md)                                        |
| Find a quick answer                  | [FAQ](../help/faq.md)                                                   |
