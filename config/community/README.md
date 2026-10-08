# TestTalon Community

## AI-Powered Unified Test Automation Platform

Community provides Web GUI automation, browser helpers, CSV test data, optional customer environment profiles, basic logging, and Playwright list/HTML/JSON reporting. API, Swagger, native/Appium mobile, databases, enterprise integrations, premium email/reporting, and TestCreator are Commercial capabilities.

The platform name describes the TestTalon product family. Community does not include AI TestCreator agents or generation functionality. Security and Allure are not implemented or included in this release.

## Independent setup and validation

Use Node.js 24 or later. No maintainer credentials, private profiles, agent instructions, or Commercial packages are required.

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run build
npm run typecheck
npm run lint:tests
npm run test:unit
npm run test:list
npm run test:smoke
```

The bundled smoke example uses `tests/functional/community/demo.html`, `demo.csv`, and `objectRepositories/GUI/communityDemoGUI.json`. It fills a form and asserts the submitted message using framework fixtures and browser helpers. It runs locally without application accounts or a remote service. CSV unit checks cover row ranges, deduplication, and locator-token replacement.

`@core/lib/BaseTest`, `WebActions`, and `CommonFuncs` resolve to their Community implementations through the root TypeScript configuration. Master compatibility wrappers are not shipped. `GenerateData` remains an approved shared helper. Add Web tests under `tests/functional/` and selectors under `objectRepositories/GUI/`; import `test` and `expect` from `@core/lib/BaseTest`.

For your application, inject environment values in your shell or create your own untracked `config/.env.dev` after installation. Existing customer profiles load after fixture setup; no profile is required for the bundled example. Never commit credentials or authentication state. Profile files are excluded from distribution.

Reports go to `logs/html-report`, `logs/json-report.json`, and `logs/test-results`. Run `npm run showreport` to inspect the HTML report. Configuration uses the Chromium `dev` project; there is no external reporting or notification integration. Community CI runs the same commands with an independently installed browser.

## License

TestTalon Community is proprietary, source-available software under the TestTalon Free / Community Source Code License V4. The authoritative terms are in the distribution root `LICENSE.txt`; read them before using or redistributing the product. TestTalon's product license is not MIT. Dependency licenses and third-party notices remain separate and retain their original terms.
