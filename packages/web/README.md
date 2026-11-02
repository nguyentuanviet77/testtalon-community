# Web automation

The Web module provides browser testing on Playwright: the profile-aware `test` fixture, the `webActions` helpers, locator repositories and example tests. It builds on the required [Core foundation](../core/README.md). The root `playwright.config.ts` defines the Playwright projects that run the Web tests.

| Location                             | What it contains                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `lib/BaseTest.ts`, `lib/fixtures.ts` | The profile-aware `test` fixture and the browser fixtures                                               |
| `lib/web-actions.ts`                  | The `webActions` helpers: waiting, clicking, filling, dialogs, downloads, highlighting and file helpers |
| `../../object-repositories/gui/`      | JSON locator repositories, one file per page, imported with `@objectRepositories/gui/<page>-gui.json`    |
| `tests/sample/webapp/functional/`                         | Example Web tests                                                                                       |
| `tests/unit/`                        | Unit tests for the module                                                                               |
| `data/`, `docs/`                     | Sample data used by the examples, and the guides for this module                                        |

In this workspace, the root `tsconfig.json` resolves GUI imports from the repository-root `object-repositories/gui/` directory. Community configuration and edition packaging retain their existing mappings.

Some parts exist only in editions that include the matching capability: browser emulation (`config/projects.ts` and `tests/emulation/`) and the locator extraction tool (`scripts/extract-locators.js` and its unit test). If a path is not in your copy, that capability is not part of your edition. The example tests, locator repositories and guides present also depend on the edition.

The public `@packages/web/lib/base-test` and `@packages/web/lib/web-actions` imports are supported; there is no `@core` alias. Native/Appium and physical-device browser examples are not part of this module.

The module needs no separate installation: it uses the dependencies of the project it is part of.
