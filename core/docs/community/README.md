# TestTalon Community documentation

[Project README](../../../README.md) | Documentation for TestTalon Community 2.1.0

These guides take you from an empty machine to a working Web test suite that runs against several environments and browsers, reads test data, produces reports and runs in GitHub Actions. Every command runs from the project root, the folder that contains `package.json`. Every runnable example in these guides was run against this edition, and each one states the result you should see.

## Recommended learning sequence

Follow the guides in this order. Each one builds on the one before it and ends with a link to the next.

| Step | Guide | You will learn | Time |
| --- | --- | --- | --- |
| 1 | [Getting started](setup.md) | Install the tools, run the bundled test, read the report, find your way around the project | 15 min |
| 2 | [Write your own tests](writing-tests.md) | The recommended architecture (object repository, `webActions`, common functions, scenarios, data), a login example, test files, tags, test steps, the convention checker, optional Page Object Model | 50 min |
| 3 | [Browser helpers (`webActions`)](web-actions.md) | Every `webActions` helper with a runnable example | 30 min |
| 4 | [Test data](test-data.md) | CSV, generated data, Excel, text and PDF files, data-driven tests | 30 min |
| 5 | [Configuration and profiles](configuration-and-profiles.md) | Settings, local profiles, precedence, secrets | 20 min |
| 6 | [Playwright projects and environments](projects-and-environments.md) | A quick start (profile, project, CLI, VS Code, more projects); then Dev, QA, Staging and Production URLs; Chromium, Firefox and WebKit; Google Chrome and Microsoft Edge; custom projects | 40 min |
| 7 | [Reports and logs](reporting-and-logging.md) | HTML and JSON reports, failure artifacts, traces, log files | 20 min |
| 8 | [GitHub Actions](github-actions.md) | The included workflow and how to run environments and browsers in CI | 20 min |
| Reference | [Troubleshooting](troubleshooting.md) | Symptoms, causes and fixes in one place | as needed |
| Reference | [Project template](templates/project-template.md) | A copy-paste project, profile files, commands and checklist | 5 min |

## Guides by area

The same guides, grouped by what you are working on. Everything here is Web GUI automation, the scope of Community.

| Area | Guides |
| --- | --- |
| Getting started | [Getting started](setup.md), then the [quick start for your first Web projects](projects-and-environments.md#quick-start-your-first-web-projects) |
| Configuration | [Configuration and profiles](configuration-and-profiles.md) (settings, profiles, [where the application address comes from](configuration-and-profiles.md#where-the-application-address-comes-from)), [Playwright projects and environments](projects-and-environments.md) (advanced: environments, browsers, Chrome and Edge), [Project template](templates/project-template.md) |
| Web tests | [Write your own tests](writing-tests.md), [Browser helpers](web-actions.md), [Test data](test-data.md) |
| Reporting | [Reports and logs](reporting-and-logging.md) |
| CI/CD | [GitHub Actions](github-actions.md) |
| Help | [Troubleshooting](troubleshooting.md) |

If you only need one thing:

| I want to... | Go to |
| --- | --- |
| See what Community V1 can do | [Features & capabilities](features-and-capabilities.md) |
| Install and run something right now | [Getting started](setup.md) |
| Add my first test | [Write your own tests](writing-tests.md#step-2-write-the-test) |
| Click, fill, wait for a page, handle a dialog or download | [Browser helpers](web-actions.md) |
| Run one test with many data rows | [Test data](test-data.md#data-driven-tests) |
| Set up and run your first Web project, then add a second | [Quick start: your first Web projects](projects-and-environments.md#quick-start-your-first-web-projects) |
| Point tests at QA or Staging | [Playwright projects and environments](projects-and-environments.md#choose-what-to-edit) |
| Start a new project from a copy-paste block | [Project template](templates/project-template.md) |
| See how a project and its profile file fit together | [Project and profile side by side](projects-and-environments.md#a-project-and-its-profile-side-by-side) |
| Run in Firefox or WebKit | [Playwright projects and environments](projects-and-environments.md#browser-strategy) |
| Run in Google Chrome or Microsoft Edge | [Google Chrome and Microsoft Edge](projects-and-environments.md#google-chrome-and-microsoft-edge) |
| Understand the recommended architecture and why | [The recommended architecture](writing-tests.md#the-recommended-architecture) |
| Write a reusable workflow such as login and use it in many tests | [Example: log in once, reuse everywhere](writing-tests.md#example-log-in-once-reuse-everywhere) |
| Organize several applications, environments and projects | [Organizing a larger or multi-project suite](writing-tests.md#organizing-a-larger-or-multi-project-suite) |
| Use the optional Page Object Model | [Optional: Traditional Page Object Model](writing-tests.md#optional-traditional-page-object-model) |
| Find out why a test failed | [Reports and logs](reporting-and-logging.md#investigate-a-failure) |
| Run tests on every push | [GitHub Actions](github-actions.md) |
| Fix an error message | [Troubleshooting](troubleshooting.md) |

## What Community includes

| Capability | Where it is documented |
| --- | --- |
| Web GUI automation with Playwright and TypeScript | [Write your own tests](writing-tests.md) |
| `test` and `expect` fixtures from `@core/lib/BaseTest` | [Write your own tests](writing-tests.md#the-parts-of-a-test) |
| Repository-backed selectors in `objectRepositories/GUI/` | [Write your own tests](writing-tests.md#step-1-put-selectors-in-an-object-repository) |
| Browser helpers (`webActions`) | [Browser helpers](web-actions.md) |
| CSV, Excel, text and PDF data helpers, generated test data | [Test data](test-data.md) |
| Local configuration profiles | [Configuration and profiles](configuration-and-profiles.md) |
| Your own Playwright projects for environments and browsers (Chromium, Firefox, WebKit) | [Playwright projects and environments](projects-and-environments.md) |
| Playwright list, HTML and JSON reports, failure artifacts, basic logging | [Reports and logs](reporting-and-logging.md) |
| A GitHub Actions workflow | [GitHub Actions](github-actions.md) |
| Test convention checker (`npm run lint`) | [Write your own tests](writing-tests.md#check-your-conventions) |

The default setup needs no account, service, credential or profile file: `npm test` works offline, and everything in these guides is opt-in. For how the editions differ, see `LICENSE.txt` and [testtalon.com](https://testtalon.com/pricing).

## Conventions used in these guides

- Commands are for macOS, Linux and Windows unless a note says otherwise. In Windows PowerShell, set a variable with `$env:NAME = "value"` instead of putting `NAME=value` in front of a command.
- A block marked `text` under a command is the result you should see. Timings and the order of lines can differ.
- A code block whose first line names a file (for example `title="tests/webapp/functional/learn/first.test.ts"`) is a file you create at that path.
- Example addresses use `example.test`, a reserved name that never resolves to a real site. Replace them with your own. The quick-start projects are the exception: they use two public Playwright demo sites so that they run as written.
- The license for Community permits learning, evaluation, demonstrations and proofs of concept. Read `LICENSE.txt` before using the product for ongoing business work.
