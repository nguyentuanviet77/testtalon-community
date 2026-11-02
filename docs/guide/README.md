<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../shared/images/brand/testtalon-logo-horizontal-white.svg">
    <img src="../shared/images/brand/testtalon-logo-horizontal.png" alt="TestTalon" width="360">
  </picture>
</p>

# TestTalon Community documentation

[Project README](../../README.md)

This is the starting point for every guide. The guides follow the order of the work: understand the platform, install it, configure it, write tests, run them and read the results. All guides are in this `docs/guide/` folder. Run every command from the project root, the folder that contains `package.json`.

## Follow the journey

| Stage           | Guide                                                                          | You will learn                                                        |
| --------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1. Understand   | [What is TestTalon](start/what-is-testtalon.md)                                | What you get and how a test run works                                 |
|                 | [Platform structure](start/platform-structure.md)                              | Folders, where your files go, import aliases, naming                  |
|                 | [Community and Commercial editions](about/editions.md)                         | What each edition includes                                            |
|                 | [Features and capabilities](about/features-and-capabilities.md)                | A one-page summary of Community 3.0.0                                 |
| 2. Install      | [Installation and first run](start/getting-started.md)                         | Requirements, IDE, dependencies, browsers, the first test and report  |
|                 | [Getting started](start/setup.md)                                              | The shortest path from an empty machine to a passing test, and Docker |
| 3. Configure    | [Configuration and profiles](configure/configuration-and-profiles.md)          | Settings, profiles, precedence and secrets                            |
|                 | [Playwright projects and environments](configure/projects-and-environments.md) | Environments, browsers, Chrome and Edge, your own projects            |
|                 | [Configure your own environments](configure/configure-your-environment.md)     | Plain text, your own encryption keys, or CI secrets                   |
|                 | [Project template](reference/project-template.md)                              | A copy-paste project, profile files and checklist                     |
| 4. Create tests | [Test basics](create-tests/test-basics.md)                                     | The parts of a test, running it, checking conventions                 |
|                 | [Write your own tests](create-tests/writing-tests.md)                          | The full tutorial: object repository, `webActions`, scenarios, data   |
|                 | [Browser helpers](create-tests/web-actions.md)                                 | Every `webActions` helper with an example                             |
|                 | [Test data](create-tests/test-data.md)                                         | CSV, generated data, Excel, text and PDF files                        |
|                 | [XPath locator strategies](create-tests/xpath-locator-strategies.md)           | Writing reliable selectors                                            |
|                 | [Browser emulation](create-tests/browser-emulation.md)                         | Phone device presets in a desktop browser                             |
| 5. Run          | [Run your tests](create-tests/writing-tests.md#run-your-tests)                 | Select a file, project or tag; headed, debug and UI modes             |
|                 | [GitHub Actions](run/github-actions.md)                                        | Run environments and browsers in CI                                   |
| 6. View results | [Reports and logs](results/reports-and-logs.md)                                | HTML and JSON reports, failure artifacts, traces, log files           |
| 7. Get help     | [Troubleshooting](help/troubleshooting.md)                                     | Symptoms, causes and fixes                                            |
|                 | [Upgrade from 2.1.0](help/upgrading.md)                                        | The order of work to move a project to 3.0.0                          |
|                 | [FAQ](help/faq.md)                                                             | Short answers                                                         |
|                 | [Licensing and support](about/licensing-and-support.md)                        | Your license, what support covers, how to reach us                    |
|                 | [Glossary](reference/glossary.md)                                              | The terms used in the guides                                          |
|                 | [Commands](reference/commands.md)                                              | Every npm script and Playwright command, grouped by task              |
|                 | [Settings reference](reference/settings.md)                                    | Global settings, profiles and what each one controls                  |

## I want to...

| I want to                                 | Go to                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Run something right now                   | [Getting started](start/setup.md)                                              |
| Find where a file goes                    | [Platform structure](start/platform-structure.md#where-your-files-go)          |
| Write my first test                       | [Test basics](create-tests/test-basics.md)                                     |
| Run the tests against another environment | [Playwright projects and environments](configure/projects-and-environments.md) |
| Keep passwords out of source control      | [Configuration and profiles](configure/configuration-and-profiles.md#secrets)  |
| Open the report of the last run           | [Reports and logs](results/reports-and-logs.md)                                |
| Fix an error                              | [Troubleshooting](help/troubleshooting.md)                                     |
| See what changed in this release          | [Release notes](../../RELEASE_NOTES.md)                                        |

## About this release

[Release notes](../../RELEASE_NOTES.md), [contributing](../../CONTRIBUTING.md) and the license terms in `LICENSE.txt`.
