# Glossary

[Documentation home](../README.md)

Terms used in the TestTalon guides, in alphabetical order.

| Term              | Meaning                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alias             | A short import prefix defined in `tsconfig.json`, for example `@packages/...`, `@config/...`, `@data/...` and `@objectRepositories/...`. It lets a test import a file without a long relative path |
| Assertion         | A check in a test, written with `expect(...)`. Playwright assertions retry until they pass or the timeout ends                                                                                     |
| Browser channel   | A branded browser Playwright can drive, such as Google Chrome (`chrome`) or Microsoft Edge (`msedge`), selected per project                                                                        |
| dotenvx           | The tool that encrypts the values in a profile file. Encrypted files can be committed; the private key stays in `.env.keys` or in your CI secret store                                             |
| `.env.keys`       | The file that holds the private decryption keys. It is ignored by Git and must never be committed                                                                                                  |
| Fixture           | A value Playwright prepares for a test and passes in by name, for example `page` or `webActions`                                                                                                   |
| Global settings   | Platform-wide defaults, such as timeouts, in `config/global/global-settings.ts`. A profile cannot change them                                                                                      |
| HTML report       | The interactive report written to `logs/html-report/` after a run. Open it with `npm run showreport`                                                                                               |
| JSON report       | The machine-readable report written to `logs/json-report.json`                                                                                                                                     |
| Locator           | A Playwright description of an element on a page, built from a selector                                                                                                                            |
| Object repository | A JSON file of selectors for one page, kept in `object-repositories/gui/<page>-gui.json`                                                                                                           |
| Profile           | A file `config/project-profiles/.env.<name>` with the values for one environment, such as the application address                                                                                  |
| Project           | A named Playwright setup: browser, device, timeouts and the profile it loads. Select one with `--project=<name>`                                                                                   |
| Real projects     | `tests/real-projects/`, the folder for your own tests                                                                                                                                              |
| Run log           | `logs/info-<date>.log`, the log of test and step messages written by the TestTalon reporter and helpers                                                                                            |
| Sample tests      | `tests/sample/`, bundled examples to read and copy from. Keep this folder in your project                                                                                                          |
| Selector          | A string, usually CSS or XPath, that finds an element                                                                                                                                              |
| Step              | A named group of actions inside a test, created with `test.step(...)`, shown in the HTML report                                                                                                    |
| Tag               | A label on a test, such as `@Smoke`, used to select tests with `--grep`                                                                                                                            |
| Trace             | A Playwright recording of a test, kept for failed tests, that you open in the trace viewer                                                                                                         |
| `webActions`      | The TestTalon fixture with reusable browser helpers: waiting, clicking, filling, dialogs and downloads                                                                                             |
| Worker            | A process that runs test files in parallel. The worker count is set in `playwright.config.ts`                                                                                                      |
