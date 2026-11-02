# Configure your own environments

[Documentation home](../README.md)

This guide is for anyone who has received TestTalon as editable TypeScript source (Community or Commercial) and wants to run tests against **their own** applications. It explains where settings live, three ways to supply values, and how to keep secrets out of Git. You do not need the private TestTalon repository, any TestTalon-owned key, or an AI assistant.

It complements the [Getting Started guide](../start/getting-started.md) (section 8, [Configure the test environment](../start/getting-started.md#8-configure-the-test-environment)). Your edition also ships its own configuration guide in its documentation folder; use it for details that are specific to your edition.

Every value shown here is invented. Never paste a real password, token or private key into a guide, an issue, a chat or a log.

## 1. How configuration works

TestTalon keeps two independent kinds of settings:

| Kind            | Where                                                                        | Used for                                                                      | Who wins                                                                                   |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Global settings | [`config/global/global-settings.ts`](../../../config/global/global-settings.ts) | Platform-wide behavior such as the GUI timeout, plus your own non-secret keys | A value supplied at invocation or by CI overrides the default declared in the file         |
| Project profile | `config/project-profiles/.env.<profile>`                                     | Values for one Playwright project, such as `GUI_BASE_URL`                     | While a test runs, the selected profile replaces a **same-named** value in the environment |

How a project picks its profile:

1. The project's `metadata.envProfile`, if set.
2. Otherwise the project's name.
3. Otherwise `local`.

`ENV_PROFILE` is not used to choose a profile. Profile names start with a letter or digit and may then contain letters, digits, `_`, `-` and single dots.

Profile values are activated around each test and restored afterwards. Read them **inside tests or fixtures** (for example `process.env.GUI_BASE_URL`), not in top-level constants, because a profile is not loaded when Playwright first reads `playwright.config.ts`. A profile also cannot change settings that are read before tests start, such as reporters. Put those in the environment you start Playwright with or in global settings.

The loader is [`packages/core/config/load-profile-data.ts`](../../../packages/core/config/load-profile-data.ts). It uses the open-source `dotenvx` library, which only needs a key for values that are encrypted.

## 2. Pick how you store your values

| Option                                      | Best for                                       | Needs a key?                    | Safe for secrets?                 |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------- |
| **A. Plaintext profile**                    | URLs, flags, other non-secret settings         | No                              | No                                |
| **B. Encrypted profile with your own keys** | Secrets you want to keep with your source code | Yes, keys that **you** generate | Yes, if you keep the key private  |
| **C. CI/CD variables and secrets**          | Secrets in pipelines and shared machines       | No file keys needed             | Yes, through your CI secret store |

You can mix them: for example a plaintext profile for URLs and CI secrets for passwords. TestTalon never asks for a key that belongs to TestTalon.

## 3. Option A: a plaintext profile

1. Copy the template. It lives in [`config/project-profiles/.env.example`](../../../config/project-profiles/.env.example).

   macOS and Linux:

   ```bash
   cp -n config/project-profiles/.env.example config/project-profiles/.env.my-app
   ```

   Windows PowerShell:

   ```powershell
   if (-not (Test-Path config/project-profiles/.env.my-app)) { Copy-Item config/project-profiles/.env.example config/project-profiles/.env.my-app }
   ```

2. Open the new file. Keep only what you use, and replace the sample values (`https://example.test` and `PLACEHOLDER`) with your own:

   ```dotenv
   GUI_BASE_URL=https://staging.my-company.example
   ```

3. Select it in `playwright.config.ts` by naming it in a project's metadata:

   ```ts
   metadata: { envProfile: 'my-app' }
   ```

4. Read it in a test:

   ```ts
   const baseUrl = process.env.GUI_BASE_URL;
   if (!baseUrl) throw new Error('Set GUI_BASE_URL in your profile or CI.');
   ```

A profile is one `KEY=value` per line; blank lines and lines starting with `#` are ignored. A line must not end with a comma or semicolon outside quotes.

**A plaintext profile must never hold a password, token or key.** Use option B or C for those.

## 4. Option B: an encrypted profile with your own keys

You generate the keys. TestTalon does not ship any key, and no TestTalon key can decrypt your files.

1. Create a plaintext profile (option A). Use a profile name made of letters, digits and `_` (for example `shop`), because the key variable is named after the profile.
2. Encrypt it in place:

   ```bash
   npx dotenvx encrypt -f config/project-profiles/.env.shop
   ```

   Every value becomes ciphertext. The file also gets a public key line, `DOTENV_PUBLIC_KEY_SHOP`, which is safe to commit with the file. The matching **private** key is written to a file named `.env.keys` in the same folder.
3. Store the private key somewhere safe **outside Git** (a password manager or your organization's secret store) and keep a backup. A lost key cannot be recovered; you would have to create a new profile.
4. Share the encrypted profile through Git if you like, and share the private key only through your secret store.
5. To change the key later:

   ```bash
   npx dotenvx rotate -f config/project-profiles/.env.shop
   ```

   Then distribute the new private key and update your CI secret together with the newly encrypted file.

Where the key comes from when tests run:

| Where tests run  | How they get the key                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Your machine     | the `.env.keys` file next to the profile                                                                                                                              |
| CI               | a secret named `DOTENV_PRIVATE_KEY_` followed by the profile name in upper case (for `shop`: `DOTENV_PRIVATE_KEY_SHOP`), passed to the job as an environment variable |
| No key available | the test stops with `Environment profile "shop": decryption/key failure`                                                                                              |

## 5. Option C: CI/CD variables and secrets

Your pipeline can supply values as environment variables, without any profile secrets in the repository:

```yaml
env:
  GUI_BASE_URL: ${{ vars.GUI_BASE_URL }}
  APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
```

The names above are examples. Define them in your CI system's variable and secret store.

Three rules:

1. **Precedence.** If the selected profile defines a key, the profile value replaces the CI value while a test runs. To let CI win, leave that key out of the profile.
2. **Profile files and CI.** Some editions require the selected profile file to exist (section 6). If your private profiles are not committed, create an empty file in your pipeline before the tests start:

   ```bash
   mkdir -p config/project-profiles
   test -e config/project-profiles/.env.my-app || : > config/project-profiles/.env.my-app
   ```

3. **Encrypted profiles in CI** also need `DOTENV_PRIVATE_KEY_<NAME>` as a secret (section 4).

Global settings behave the other way round: a value supplied at invocation or by CI overrides the default declared in `config/global/global-settings.ts`.

Your edition ships an example GitHub Actions workflow in its `.github` folder. Adapt it for your own pipeline; it does not need any TestTalon credential.

## 6. What differs between Community and Commercial

| Topic                            | Community                                                                                                                                                                                  | Commercial                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Selected profile file is missing | Allowed: nothing is loaded and defaults apply                                                                                                                                              | **Required**: the test stops with `Environment profile "<name>": missing profile`                                                                                                                                              |
| Profiles shipped                 | The template and the profiles the samples use (`.env.qa`, `.env.staging`, `.env.local`, `.env.dev`, `.env.uat`, `.env.prodBeta`, `.env.prod`), exactly as in the platform repository; replace their values with your own | The template, an offline profile for the first run, the project profiles the samples use, `.env.jira`, `.env.rally` and `.env.security` exactly as in the platform repository, and commented templates for `.env.aio`, `.env.email` and `.env.reportportal`                                                                                             |
| Git behavior                     | Profiles are committed with your source; only `.env.keys` is ignored                                                                                                                       | Private `.env` files are ignored by default; only the template, the shipped profiles and the six integration profiles (`.env.jira`, `.env.rally`, `.env.aio`, `.env.email`, `.env.reportportal`, `.env.security`) are tracked |
| Integration settings             | Not applicable                                                                                                                                                                             | Optional reporting and integration switches live in global settings; their values come from encrypted profiles or CI                                                                                                           |

In Commercial, to commit an **encrypted** profile of your own, add an exception line to `.gitignore` (for example `!config/project-profiles/.env.shop`) and confirm it with `git check-ignore -v config/project-profiles/.env.shop`. Do this only for files whose values are all encrypted. The six integration profiles are already tracked: before you put real values in one, run `npx dotenvx encrypt -f config/global-profiles/.env.<name>` and commit only the encrypted file, never either folder’s `.env.keys`.

## 7. Keep private files out of Git

- Never commit the `.env.keys` file. Check that it is ignored by running `git check-ignore -v` followed by the path of that file; Git prints the ignore rule that matches it.
- Run `git status` and read the list before every `git add`; do not use `git add -A` blindly.
- Know your edition's rule (section 6): in Community a profile **is** committed, so it must contain only non-secret or encrypted values.
- Search before you commit: `git diff --cached` should show no `PASSWORD=`, `TOKEN=` or `KEY=` lines with real values.
- If a real secret or a private key was committed, treat it as exposed: rotate the underlying credential, generate a new key, and remove the file from history using your Git hosting provider's guidance.

## 8. Common errors

Messages have the form `Environment profile "<name>": <problem>`; the value is never printed.

| Message                                           | Meaning                                                          | Fix                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `invalid profile name`                            | Name contains spaces, `..` or a separator                        | Use letters, digits, `_`, `-`, single dots                                        |
| `missing profile`                                 | The selected `.env.<name>` file does not exist                   | Create it from the template (Commercial requires it; Community tolerates absence) |
| `inaccessible profile`                            | The file cannot be read                                          | Check permissions                                                                 |
| `malformed profile`                               | Invalid text or an unclosed quote                                | Open the file and fix the line                                                    |
| `trailing assignment punctuation … line N, key K` | A line ends with `,` or `;`                                      | Remove it, or put punctuation inside quotes                                       |
| `decryption/key failure`                          | Encrypted values and no matching private key                     | Provide `.env.keys` locally or `DOTENV_PRIVATE_KEY_<NAME>` in CI                  |
| `unsafe profile file`                             | The file resolves outside the profiles folder                    | Use a normal file, not a link out of the folder                                   |
| A setting seems ignored                           | It is read before tests start, or CI value is shadowed           | Read it inside tests; remove the same key from the profile                        |
| `GUI_BASE_URL` has no effect on `page.goto('/')`  | It is not Playwright's `baseURL`                                 | Read it and navigate explicitly, or set `use.baseURL` in the config               |
| Wrong profile loaded                              | The project's `metadata.envProfile` or name selects another file | Check the selection order in section 1                                            |

## 9. Troubleshoot safely

- Check that a value exists without printing it:

  ```bash
  node -e "console.log(Boolean(process.env.GUI_BASE_URL))"
  ```

- Do not print `process.env`, do not run commands that display decrypted values in shared terminals or CI logs, and do not paste profile contents into support requests. Share the exact message text and the profile **name** instead.
- When asking for help, include the Node version (`node --version`), the profile name, the project name and the full error line.

## 10. Where to go next

- [Getting Started guide](../start/getting-started.md): install, IDE setup, first run.
- The configuration and troubleshooting guides in your edition's documentation folder.
