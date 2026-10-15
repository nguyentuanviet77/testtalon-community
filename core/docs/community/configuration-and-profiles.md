# Step 5: Configuration and profiles

[Documentation index](README.md) | Previous: [Test data](test-data.md) | Next: [Playwright projects and environments](projects-and-environments.md)

This guide explains where settings come from, how to keep your settings in profile files that are committed with your source code, how to pass settings from a shell or CI, and how to change Playwright's defaults. You do not need any of it to run the bundled test: with no profile file and no environment variables, Community uses built-in defaults and `npm test` passes offline.

## The three layers

A setting can come from three places. When the same setting is given in more than one, the **first** in this list wins:

| Priority | Source | Typical use |
| --- | --- | --- |
| 1 | The environment you start Playwright with: a shell variable or a CI variable | One-off overrides, CI settings, secrets |
| 2 | A local profile file, `config/.env.<name>` | Your usual settings on your machine |
| 3 | Built-in defaults | Everything else |

## Settings Community understands

| Setting | Type | Default | Used by |
| --- | --- | --- | --- |
| `HIGHLIGHT_TEST_OBJECT_ENABLED` | `true` or `false` | `false` | The `webActions` highlight helpers. When `true`, they flash the element before acting. See [Browser helpers](web-actions.md#highlighting) |
| `GUI_TIMEOUT` | Number of milliseconds, zero or more | `30000` | Your own code. It is available as `globalVariables.GUI_TIMEOUT` (imported from `@core/lib/CommonFuncs`), for example for a custom wait. Community's helpers and Playwright's own timeouts do not read it; change those in `playwright.config.ts` (see [below](#change-playwrights-defaults)) |
| `CI` | any value | not set | Playwright runs headless when it is set. Most CI systems, including GitHub Actions, set it for you |

You can also add **any other setting** you want to your profile, for example an application user name, and read it in tests with `process.env.NAME`. Booleans must be exactly `true` or `false`; numbers must not be negative. Anything else is reported as an error (see [Error messages](#error-messages)).

## Create a local profile

`config/.env.example` lists the supported settings. Copy it; do not edit it:

```bash
test -e config/.env.dev || cp config/.env.example config/.env.dev
```

On Windows PowerShell:

```powershell
if (-not (Test-Path config/.env.dev)) { Copy-Item config/.env.example config/.env.dev }
```

```text
# TestTalon Community GUI configuration; copy to a profile such as config/.env.dev.
# packages/community/config/guiConfig.ts owns these settings.
GUI_TIMEOUT=30000
HIGHLIGHT_TEST_OBJECT_ENABLED=false
```

Profiles are plain text files with one `KEY=value` per line. Blank lines and lines starting with `#` are ignored.

Profiles are committed with your source code, like your tests and data: Git does **not** ignore `config/.env.*`. The one ignored env file is `config/.env.keys`, where dotenvx keeps private decryption keys (see [Secrets](#secrets)). Confirm it:

```bash
git check-ignore config/.env.keys
```

```text
config/.env.keys
```

`git check-ignore config/.env.dev` prints nothing, because `config/.env.dev` is not ignored. That is why a profile must never hold a plain-text password, token or key.

## Choose which profile a project uses

Each Playwright project loads one profile while its tests run:

1. the project's `metadata.envProfile`, if set,
2. otherwise the project's name.

The default project is named `dev` and sets `metadata.envProfile: 'dev'`, so it loads `config/.env.dev`. A project named `qa` with no metadata loads `config/.env.qa`.

> **Note**: The environment variable `ENV_PROFILE` is **not** used to choose a profile.

Profile names may contain letters, digits, `_`, `-` and single dots, and must start with a letter or digit.

A missing profile file is fine: nothing is loaded and the defaults apply. A profile that exists but cannot be read or is malformed stops the test with an error that names the profile. Because a missing file is not an error, a misspelled name in `metadata.envProfile` is also silent: the project simply loads no profile. If a setting does not arrive, compare the name in `playwright.config.ts` with the file name `config/.env.<name>` letter for letter (file names are case-sensitive on Linux).

[Playwright projects and environments](projects-and-environments.md) shows how to create one project per environment, each with its own profile, and has a copy-paste [project template](templates/project-template.md).

## Try it

Create a profile that sets one built-in and one custom setting:

```text title="config/.env.dev"
GUI_TIMEOUT=45000
APP_GREETING=hello from dev
```

Then add a test that reads them. It passes with or without the profile, so it never breaks a full run:

```ts title="tests/webapp/functional/learn/profile.test.ts"
import { test, expect } from '@core/lib/BaseTest';
import { globalVariables } from '@core/lib/CommonFuncs';

test('reads settings from the local profile', async () => {
    console.log(`GUI_TIMEOUT=${globalVariables.GUI_TIMEOUT} APP_GREETING=${process.env.APP_GREETING}`);
    expect(typeof globalVariables.GUI_TIMEOUT).toBe('number');
});
```

```bash
npx playwright test tests/webapp/functional/learn/profile.test.ts --project=dev
```

```text
Running 1 test using 1 worker

GUI_TIMEOUT=45000 APP_GREETING=hello from dev
  ✓  1 [dev] › tests/webapp/functional/learn/profile.test.ts:4:5 › reads settings from the local profile (7ms)

  1 passed (0.9s)
```

(The line is also written, with a timestamp, to the log file; see [Reports and logs](reporting-and-logging.md#log-files).) Now override one value from the shell. The environment you start with wins over the profile:

```bash
GUI_TIMEOUT=60000 npx playwright test tests/webapp/functional/learn/profile.test.ts --project=dev
```

```text
Running 1 test using 1 worker

GUI_TIMEOUT=60000 APP_GREETING=hello from dev
  ✓  1 [dev] › tests/webapp/functional/learn/profile.test.ts:4:5 › reads settings from the local profile (7ms)

  1 passed (0.9s)
```

On Windows PowerShell, set the variable first: `$env:GUI_TIMEOUT = "60000"`, then run the command, then `Remove-Item Env:GUI_TIMEOUT`.

Delete the practice profile when you are done so it does not affect later guides:

```bash
rm config/.env.dev
```

### Read settings inside tests, not at the top of a file

A profile is applied around each test and removed afterwards. So `process.env.APP_GREETING` has its profile value **inside** a test, a `beforeEach` hook or a fixture, but not in code that runs when the file is first loaded:

```ts snippet
const tooEarly = process.env.APP_GREETING; // undefined: no profile is active yet

test('reads a setting', async () => {
    const inTime = process.env.APP_GREETING; // the profile value
});
```

Values from the shell or CI are visible everywhere. This is why the projects guide reads environment URLs from the shell or from its separate `config/.env.environments` file.

## Where the application address comes from

A profile can hold your application's address, but TestTalon does not turn it into Playwright's `baseURL`. The order of events explains why:

1. Playwright loads `playwright.config.ts`. Each project's `use.baseURL` is fixed here. Only the shell or CI environment is visible at this point.
2. A test starts. TestTalon loads the project's profile (`metadata.envProfile`, then the project name) and applies it around the test.
3. Your test code runs and can read the profile's values with `process.env`.

So there are two ways to provide an address. Use the first unless you need relative navigation:

| You want | Set | Read it with |
| --- | --- | --- |
| One address per project, kept in the project's profile (recommended, used by the [quick start](projects-and-environments.md#quick-start-your-first-web-projects)) | `GUI_BASE_URL` (the full address) in `config/.env.<profile>`, or in the shell or CI | `process.env.GUI_BASE_URL` inside the test, then `page.goto(appUrl)` |
| `page.goto('/path')` to start from the project's address | `use.baseURL` on the project: a literal, or a shell/CI variable read in the config (see the [advanced projects configuration](projects-and-environments.md#environment-url-configuration)) | The `baseURL` fixture, or relative `page.goto` |

`GUI_BASE_URL` is a name TestTalon uses in its examples and tests; it is not one of the [settings Community understands](#settings-community-understands), so Community never reads it for you. A value from the shell or CI wins over the profile, like every other setting. Reading it at the top of a test file does not work, for the reason in the previous section:

```ts snippet
test('opens the application', async ({ page }) => {
    const appUrl = process.env.GUI_BASE_URL ?? ''; // inside the test: the profile value
    test.skip(!appUrl, 'Set GUI_BASE_URL in the project profile.');
    await page.goto(appUrl);
});
```

## Error messages

The profile error messages (`malformed profile`, `invalid nonnegative numeric setting`, `invalid boolean setting`, `invalid profile name`) and their fixes are in [Troubleshooting](troubleshooting.md#configuration-and-profiles).

## Profile helpers for your own code

`config/loadProfileData.ts` is the module that loads profiles. Tests normally need none of it, because `BaseTest` does the loading, but your `playwright.config.ts` and your own helpers can use it (import it with `@config/loadProfileData`, or with a relative path from the root config):

| Helper | Use it to |
| --- | --- |
| `loadEnvProfile(name, options)` | Load `config/.env.<name>` into the environment and leave it there. The [projects guide](projects-and-environments.md#a-complete-playwrightconfigts) uses it with `{ folder: 'config', optional: true }` to read `config/.env.environments` when the configuration loads. Options: `folder`, `optional` (no error when the file is missing), `override` (let the profile win over the environment) |
| `readEnvBoolean(value, fallback)` | Turn `'true'` or `'false'` into a boolean; return `fallback` for `undefined`; throw `invalid boolean setting` for anything else |
| `readEnvNumber(value, fallback)` | Turn text into a number that is zero or more; return `fallback` for `undefined`; throw `invalid nonnegative numeric setting` otherwise |
| `runtimeEnvDefaults(defaults)` | Build a settings object like `globalVariables`: each key reads the environment when it is accessed, using the default's type to parse it |
| `selectEnvProfile`, `resolveEnvProfile`, `activateEnvProfile`, `EnvProfileError` | The building blocks `BaseTest` uses to choose, read and apply a profile, and the error it throws. You rarely need them directly |

## Secrets

Profiles are committed with your source code, so a profile must never contain a plain-text password, token or key.

- Never put passwords, tokens or keys in source code, object repositories, data files, the shared `config/.env.example` or a plain-text profile.
- For a secret your tests need, either [encrypt it in the profile](#encrypt-a-profile-with-dotenvx) or keep it in the CI secret store and pass it as an environment variable. The [GitHub Actions guide](github-actions.md#secrets-and-variables) shows how.
- Test code should fail clearly when a secret is missing instead of continuing with an empty value:

  ```ts snippet
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error('Set APP_PASSWORD in your profile or CI secrets.');
  ```

- Log files and reports can contain what your tests print. Do not print secrets. Errors logged through the project logger are reduced to their name and message with obvious credentials masked, but ordinary text you print is not changed.

### Encrypt a profile with dotenvx

Community installs dotenvx, which can encrypt a profile in place. Use a profile name made of letters, digits and `_` (for example `shop`), because the key variable is named after the profile and CI secret names cannot contain `-`:

```bash
npx dotenvx encrypt -f config/.env.shop
```

This rewrites `config/.env.shop` so that every value is ciphertext. The file also gets a public key (`DOTENV_PUBLIC_KEY_SHOP`), and the matching private key is written to `config/.env.keys`, which Git ignores. Commit the encrypted profile; never commit `.env.keys`. Tests read the values with `process.env` exactly as before, because the loader decrypts them while a test runs.

| Where the test runs | How it gets the private key |
| --- | --- |
| Your machine | `config/.env.keys`, next to the profile |
| CI | Store the value of `DOTENV_PRIVATE_KEY_SHOP` as a CI secret and pass it to the job as an environment variable; no `.env.keys` file is needed |
| No key available | The test stops with `Environment profile "shop": decryption/key failure` |

Anyone with the private key can read the values. Share it through a password manager, never through Git or chat, and keep a backup: a lost key cannot be recovered.

## Change Playwright's defaults

Everything else (timeouts, retries, workers, reporters, browser options) is Playwright configuration. Community's defaults live in `config/community/playwrightConfig.ts`; you change them from **your** root `playwright.config.ts`, never by editing that framework file.

A fresh install's root file spreads those defaults (`...communityConfig`) and adds two sample projects; it is shown in the [quick start](projects-and-environments.md#3-the-default-projects).

The defaults are:

| Option | Default | Meaning |
| --- | --- | --- |
| `testDir` | `./tests` | Where Playwright looks for tests |
| `timeout` | `120000` | Milliseconds one test may run |
| `expect.timeout` | `10000` | Milliseconds an `expect` waits |
| `retries` | `0` | Retries of a failed test |
| `workers` | `2` | Test files run in parallel |
| `fullyParallel` | `true` | Tests inside one file may run in parallel |
| `reporter` | list, HTML, JSON | See [Reports and logs](reporting-and-logging.md) |
| `outputDir` | `./logs/test-results` | Failure artifacts |
| `use.actionTimeout` | `10000` | Milliseconds one click, fill or similar action may take |
| `use.navigationTimeout` | `60000` | Milliseconds a page navigation may take |
| `use.headless` | `true` when `CI` is set | Hide the browser |
| `use.screenshot`, `use.video`, `use.trace` | `only-on-failure`, `retain-on-failure`, `retain-on-failure` | Failure artifacts |
| `use.launchOptions.slowMo` | `200` | Milliseconds Playwright pauses between browser operations |
| `use.ignoreHTTPSErrors` | `true` | Accept certificate errors, which is convenient for test environments |
| `use.acceptDownloads` | `true` | Allow file downloads |
| `use.locale` | `en-US` | Browser language |

To change some of them, spread the defaults and override what you need. This file retries once and runs one worker in CI, allows 60 seconds per test, keeps a trace only for retried tests, and removes the 200 ms pause between browser operations:

```ts title="playwright.config.ts"
import { defineConfig } from '@playwright/test';
import { communityConfig } from './config/community/playwrightConfig';

export default defineConfig({
  ...communityConfig,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  use: { ...communityConfig.use, trace: 'on-first-retry', launchOptions: { slowMo: 0 } },
});
```

Check the file before you run anything:

```bash
npm run typecheck
npx playwright test tests/webapp/functional/community --list
```

```text
Listing tests:
  [dev] › webapp/functional/community/browser.test.ts:7:5 › Community browser helpers display the CSV message
Total: 1 test in 1 file
```

Both commands should finish without errors. Restore the three-line file afterwards if you do not want these changes; the [projects guide](projects-and-environments.md#a-complete-playwrightconfigts) builds on the same `...communityConfig` pattern.

The default `slowMo: 200` makes runs easy to watch. A large suite runs faster with `launchOptions: { slowMo: 0 }`, as in the example.

## The zero-configuration promise

Community works out of the box:

- No profile file is needed. A missing `config/.env.dev` is ignored.
- No environment variable is needed.
- No account, license key or network connection is needed to run `npm test`.

Everything in this guide is optional and does not change that behavior unless you create the files it describes.

Next: [Playwright projects and environments](projects-and-environments.md).
