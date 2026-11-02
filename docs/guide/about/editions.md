# Community and Commercial editions

[Documentation home](../README.md)

TestTalon is published in two editions. Both use the same folder layout and the same way of writing tests, so a Community project moves to Commercial without relearning the framework.

| Capability                                                                        | Community | Commercial |
| --------------------------------------------------------------------------------- | --------- | ---------- |
| Web GUI automation with Playwright (Chromium, Firefox, WebKit, Chrome, Edge)      | Yes       | Yes        |
| `test` and `expect` fixtures, `webActions` helpers, object repositories           | Yes       | Yes        |
| Environment profiles, several projects, encrypted secrets with dotenvx            | Yes       | Yes        |
| CSV, Excel, text and PDF test data helpers, data generators                       | Yes       | Yes        |
| Browser emulation of phone device presets                                         | Yes       | Yes        |
| Terminal list, run log, HTML and JSON reports                                     | Yes       | Yes        |
| Docker image and a GitHub Actions workflow                                        | Yes       | Yes        |
| Locator extraction                                                                | Yes       | Yes        |
| API testing, Swagger and OpenAPI conversion, contract tests                       | No        | Yes        |
| Native Android and iOS testing and mobile browser testing with Appium             | No        | Yes        |
| Database testing                                                                  | No        | Yes        |
| Security testing                                                                  | No        | Yes        |
| Allure, email, ReportPortal, AIO Tests for Jira, and Jira and Rally bug reporting | No        | Yes        |
| TestCreator: AI agents that turn a scenario into a test                           | No        | Yes        |

Every edition contains a `LICENSE.txt` with its exact terms. Community is source-available for learning, evaluation, demonstrations and proofs of concept; ongoing business use needs the Commercial license.

## Which edition do I have?

Open `README.md` in the project root. Its title says **TestTalon Community** or **TestTalon Commercial**. The folders also tell you: the `packages/` folder of a Commercial project contains `api`, `mobile`, `database`, `security` and `ai`, which a Community project does not have.

## Related

- [What is TestTalon](../start/what-is-testtalon.md)
- [Platform structure](../start/platform-structure.md)
