# Upgrade from 2.1.0 to 3.0.0

[Documentation home](../README.md) | See also: [Release notes](../../../RELEASE_NOTES.md)

3.0.0 uses one package layout, renames files to kebab-case and changes import paths and some file locations. Tests and configuration written for 2.1.0 need the updates below. Nothing is migrated automatically. The [release notes](../../../RELEASE_NOTES.md) hold the complete table of changes; this page turns it into an order of work.

## Before you start

1. Commit or back up your project, so you can compare the old and new folders.
2. Take 3.0.0 as a new copy and bring your own files into it. Your tests, object repositories, data and profiles are the only files you need to carry over.
3. Keep `tests/sample/` from 3.0.0. It shows the new layout and imports.

## Steps

1. **Move your files to the new folders.**

   | From (2.1.0)                                        | To (3.0.0)                                                            |
   | --------------------------------------------------- | --------------------------------------------------------------------- |
   | `objectRepositories/GUI/<page>...json`              | `object-repositories/gui/<page>-gui.json` (kebab-case, `-gui` suffix) |
   | `config/.env.example`, `.env.qa`, `.env.staging`    | `config/project-profiles/.env.example`, `.env.qa`, `.env.staging`     |
   | `data/pdf/sample.pdf`                               | `data/web/pdf/sample.pdf`                                             |
   | `tests/sample/webapp/functional/community/demo.csv` | `data/web/demo.csv`                                                   |
   | `.github/workflows/community.yml`                   | `.github/workflows/testtalon-community-ci.yml`                        |

2. **Update the imports in your tests.**

   | 2.1.0                                         | 3.0.0                                                                                                                    |
   | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
   | `@core/lib/BaseTest`                          | `@packages/web/lib/base-test`                                                                                            |
   | `@core/lib/CommonFuncs`                       | `@packages/core/lib/common-funcs`                                                                                        |
   | `@core/lib/WebActions`                        | `@packages/web/lib/web-actions`                                                                                          |
   | `@core/lib/GenerateData` (separate functions) | `@packages/core/lib/generate-data`, class `GenerateData` with static methods, for example `GenerateData.randomPick(...)` |
   | `@objectRepositories/GUI/...`                 | `@objectRepositories/gui/...`                                                                                            |

   The `@config/*` alias is unchanged. `@packages/*` is new.

3. **Move your configuration.** `config/loadProfileData.ts` and `config/logger.ts` are now `packages/core/config/load-profile-data.ts` and `packages/core/config/logger.ts`. `config/community/globalVariables.ts` is now `config/global/global-settings.ts`, and `config/community/playwrightConfig.ts` is `packages/community/config/playwright-config.ts`, which the root `playwright.config.ts` imports.

4. **Update the sample paths you copied.** The online examples are now `playwright-site-get-started.test.ts` and `todomvc-add-todo.test.ts` under `tests/sample/webapp/functional/community/samples/`, and the demo page is `sample-app/community-demo/demo.html`.

5. **Replace the profiles.** The profiles in `config/project-profiles/` are plain samples with placeholder values and no credentials. Replace the values with your own and encrypt real credentials with dotenvx before you commit ([Configuration and profiles](../configure/configuration-and-profiles.md)).

## Check the result

```bash
npm ci --ignore-scripts
npm run build
npm run typecheck
npm run lint
npm test
```

Fix the first error each command reports before moving to the next. A stale import path or alias is the usual cause. [Troubleshooting](troubleshooting.md) lists the common problems.

## Related

- [Release notes](../../../RELEASE_NOTES.md)
- [Platform structure](../start/platform-structure.md)
