# Settings reference

[Documentation home](../README.md)

Community has two kinds of settings: **global settings**, which apply to every run, and **profile values**, which belong to one environment.

## Global settings

They are in `config/global/global-settings.ts`. A project profile cannot change them. A value set in the environment for the same key wins over the file, so CI can change one for one run without editing code.

| Setting                         | Default                               | Meaning                                                                                                                    |
| ------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `TEST_TIMEOUT`                  | `120000`                              | Timeout of each test, in milliseconds                                                                                      |
| `EXPECT_TIMEOUT`                | `10000`                               | Timeout of each retrying assertion, in milliseconds                                                                        |
| `GUI_TIMEOUT`                   | `30000`                               | Timeout of each browser action such as a click or a wait, in milliseconds                                                  |
| `NAVIGATION_TIMEOUT`            | `60000`                               | Timeout of each page navigation, in milliseconds                                                                           |
| `HIGHLIGHT_TEST_OBJECT_ENABLED` | `false`                               | Draws a highlight around the element a helper acts on                                                                      |
| `TEST_OPTIONS`                  | `{ region: 'APAC', currency: 'USD' }` | An example of your own settings. Add, change or remove keys in the customer-defined section. Keep secrets out of this file |

Global settings are not copied into `process.env`. Read them in code with `globalSettings` from `config/global/global-settings.ts`.

## Profile values

A profile is a file `config/project-profiles/.env.<name>`. The project you run selects it with `metadata.envProfile` in `playwright.config.ts`. Its values are loaded into `process.env` around each test.

| Value          | Meaning                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GUI_BASE_URL` | The address of the application under test. Tests read it with `process.env.GUI_BASE_URL`                                |
| Your own keys  | Credentials, user names and any value that differs per environment. Encrypt secrets with dotenvx or supply them from CI |

`config/project-profiles/.env.example` lists example profiles. A missing profile is fine for the bundled sample; a profile that exists but is malformed fails with an error that names it. The profile name may contain letters, digits, `_`, `-` and single dots.

## Playwright settings

Retries, workers, reporters and browser options are set in `playwright.config.ts`, not in global settings. By default Community runs two workers with no retries.

## Related

- [Configuration and profiles](../configure/configuration-and-profiles.md)
- [Playwright projects and environments](../configure/projects-and-environments.md)
