# Commands

[Documentation home](../README.md)

Run every command from the project root, the folder that contains `package.json`.

## npm scripts

| Task                  | Command                           | What it does                                                             |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| Install               | `npm ci --ignore-scripts`         | Installs the exact dependencies from `package-lock.json`                 |
| Install a browser     | `npx playwright install chromium` | Downloads the browser Playwright drives                                  |
| Build                 | `npm run build`                   | Compiles the TypeScript sources and rewrites the path aliases in `dist/` |
| Type check            | `npm run typecheck`               | Checks types without writing files                                       |
| Check conventions     | `npm run lint`                    | Checks the test conventions (same as `npm run lint:tests`)               |
| Run the default check | `npm test`                        | Builds, runs the unit tests, then the bundled smoke test                 |
| Run the smoke test    | `npm run test:smoke`              | Runs only the bundled demo test                                          |
| Run offline examples  | `npm run test:web`                | Runs the tests tagged `@Offline`                                         |
| Run online examples   | `npm run test:online`             | Runs the tests tagged `@Online`; needs network access                    |
| Unit tests            | `npm run test:unit`               | Runs the unit tests of the shipped packages                              |
| List tests            | `npm run test:list`               | Lists the tests of the `dev` project without running them                |
| Open the report       | `npm run showreport`              | Serves the HTML report from `logs/html-report`                           |
| Extract locators      | `npm run locator:extract`         | Collects the selectors of a page into `object-repositories/gui/`         |

## Playwright commands

| Task                        | Command                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| Run every test of a project | `npx playwright test --project=dev`                                                             |
| Run one file                | `npx playwright test tests/real-projects/webapp/functional/<area>/<name>.test.ts --project=dev` |
| Run tests by tag            | `npx playwright test --project=dev --grep @Smoke`                                               |
| Watch the browser           | `npx playwright test --project=dev --headed`                                                    |
| Step through a test         | `npx playwright test <file> --project=dev --debug`                                              |
| Use Playwright's UI mode    | `npx playwright test --project=dev --ui`                                                        |
| Run one test at a time      | `npx playwright test --project=dev --workers=1`                                                 |
| Retry failures              | `npx playwright test --project=dev --retries=1`                                                 |
| Record a test               | `npx playwright codegen`                                                                        |
| Open a trace                | `npx playwright show-trace <path-to-trace.zip>`                                                 |

## Related

- [Test basics](../create-tests/test-basics.md)
- [Reports and logs](../results/reports-and-logs.md)
