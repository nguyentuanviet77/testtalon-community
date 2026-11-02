# Frequently asked questions

[Documentation home](../README.md)

## Setup

**Which Node.js version do I need?**
Node.js 24 or later, with npm and Git. Check it with `node --version`.

**Do I need an account or a credential to try TestTalon?**
No. The bundled sample loads a local page, so it runs offline without a profile file. Follow [Installation and first run](../start/getting-started.md).

**Which browsers must I install?**
Install the browser your projects use. For the sample, run `npx playwright install chromium`. Firefox, WebKit, Google Chrome and Microsoft Edge are needed only by projects that select them.

**Can I use an editor other than VS Code?**
Yes. The guide covers VS Code and IntelliJ IDEA; the commands in the terminal work in any editor.

## Writing tests

**Where do I put my own tests?**
In `tests/real-projects/`. Keep `tests/sample/` as it is: it holds the examples to read and copy from.

**Where do selectors go?**
In an object repository, one JSON file per page: `object-repositories/gui/<page>-gui.json`. See [Test basics](../create-tests/test-basics.md).

**Which `test` and `expect` do I import?**
The ones from your edition's `base-test` file, not from `@playwright/test`. [Test basics](../create-tests/test-basics.md) shows the exact import.

**How do I run only some tests?**
Pass a file path, a project (`--project=<name>`), or a tag filter (`--grep @Smoke`). See [Test basics](../create-tests/test-basics.md#run-your-test).

## Configuration and secrets

**How do I point a test at a different environment?**
Select a different project. Each project loads the profile named in its `metadata.envProfile`, for example `config/project-profiles/.env.uat`.

**May I commit a profile file?**
Yes, if every secret in it is encrypted with dotenvx. Never commit `.env.keys` or a plain-text credential. See [Configure your own environments](../configure/configure-your-environment.md).

## Results

**Where are the reports?**
`logs/html-report/` (open it with `npm run showreport`), `logs/json-report.json`, and `logs/test-results/` for screenshots, video and traces of failed tests.

**Why does `npm run showreport` show nothing?**
No run has created the report yet. Run a test first.

**How do I see why a test failed?**
Open the HTML report, select the failed test, and read the steps and the error. Its screenshot, video and trace are attached.

## Editions

**What is the difference between Community and Commercial?**
See [Community and Commercial editions](../about/editions.md).

**How do I know which edition I have?**
The title of `README.md` in the project root names it.
