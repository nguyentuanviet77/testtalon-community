# Platform structure

[Documentation home](../README.md) | Previous: [What is TestTalon](what-is-testtalon.md)

This page shows what is in a TestTalon Community project, where your own files go, and how names and imports work. Run every command from the project root, the folder that contains `package.json`.

## The folder map

```text
.
|-- .github/workflows/        GitHub Actions workflow (testtalon-community-ci.yml)
|-- config/
|   |-- global/               global-settings.ts: platform defaults such as timeouts
|   |-- project-profiles/     One .env.<name> per environment, plus .env.example
|   `-- shared/               Helper used to read the global settings
|-- data/web/                 CSV, PDF and JSON data used by the examples
|-- docs/
|   |-- guide/                These guides
|   `-- shared/               Getting started and environment configuration guides, images
|-- object-repositories/gui/  Selectors, one <page>-gui.json per page
|-- packages/
|   |-- community/            Playwright configuration for this edition
|   |-- core/                 Shared helpers: base-test, common-funcs, generate-data, logger, profile loader
|   |-- reporting/custom/     The TestTalon run reporter
|   `-- web/                  webActions, browser fixtures, projects, locator extraction
|-- sample-app/               Local pages the examples open (no network needed)
|-- tests/
|   |-- real-projects/        Your own tests
|   `-- sample/               Bundled examples to read and copy from
|-- Dockerfile
|-- package.json              Dependencies and npm scripts
|-- playwright.config.ts      Projects, reporters and timeouts
`-- tsconfig.json             TypeScript settings and import aliases
```

After a run, a `logs/` folder appears with the reports, the run log and failure artifacts. It is ignored by Git.

## Where your files go

| You are adding                          | Put it in                                       | Name it                        |
| --------------------------------------- | ----------------------------------------------- | ------------------------------ |
| A test                                  | `tests/real-projects/webapp/functional/<area>/` | `<feature>.test.ts`            |
| Selectors for a page                    | `object-repositories/gui/`                      | `<page>-gui.json`              |
| Test data                               | `data/web/` or next to the test                 | `<domain>.<purpose>.csv`       |
| A shared workflow used by several tests | `tests/real-projects/webapp/common/`            | `<area>.ts`                    |
| Settings for an environment             | `config/project-profiles/`                      | `.env.<name>`                  |
| A new Playwright project                | `playwright.config.ts`                          | a project with a unique `name` |

Playwright runs only files that end in `.test.ts` or `.spec.ts`, so shared code must use other names.

## Import aliases

`tsconfig.json` defines these prefixes. Use them instead of long relative paths.

| Alias                   | Points to                                               |
| ----------------------- | ------------------------------------------------------- |
| `@packages/*`           | `packages/*`, for example `@packages/web/lib/base-test` |
| `@config/*`             | `config/*`                                              |
| `@data/*`               | `data/*`                                                |
| `@objectRepositories/*` | `object-repositories/*`                                 |

## Naming conventions

| Item                          | Rule                                           | Example                            |
| ----------------------------- | ---------------------------------------------- | ---------------------------------- |
| Files and folders             | lowercase `kebab-case`                         | `web-actions.ts`, `product-store/` |
| Classes, interfaces and types | `PascalCase`                                   | `LoginPage`                        |
| Functions and methods         | `camelCase`, starting with a verb              | `clickLoginButton()`               |
| Variables and object keys     | `camelCase`                                    | `usernameInput`                    |
| Constants and settings keys   | `UPPER_SNAKE_CASE`                             | `GUI_TIMEOUT`                      |
| Selector repository keys      | `camelCase`, named for what the element is for | `nameInput`, `greetButton`         |

`npm run lint` checks the test conventions. When you rename a file, update every import, link and script that mentions it.

## Next

- [Test basics](../create-tests/test-basics.md): the parts of a test and how to run it
- [Write your own tests](../create-tests/writing-tests.md): the full tutorial
