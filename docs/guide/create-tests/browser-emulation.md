# Browser emulation projects (`Pixel 4a (5G)`, `iPhone 14 (mobile safari)`)

[Documentation home](../README.md) | Related: [Projects and environments](../configure/projects-and-environments.md)

These projects emulate a phone inside a desktop browser. They are **not** real devices: they need no device, emulator or Appium server, and they run the same tests as the other browser projects.

| Project                     | Browser/Device                                                                  | Profile file                       | Notes                           |
| --------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------- |
| `Pixel 4a (5G)`             | Pixel 4a (5G) emulation, `isMobile`, scale factor 2, in installed Google Chrome | `config/project-profiles/.env.dev` | Google Chrome installed         |
| `iPhone 14 (mobile safari)` | Playwright `iPhone 14` preset in WebKit                                         | `config/project-profiles/.env.dev` | `npx playwright install webkit` |

Both projects are declared in `packages/web/config/projects.ts` and listed in the root `playwright.config.ts`.

## Configuration

Each project loads the profile shown above. `config/project-profiles/.env.dev` ships exactly as it is in the platform repository: replace its values with your own. An example setting (invented value):

```dotenv
GUI_BASE_URL=https://example.test
```

## Run

Quote project names that contain spaces.

```bash
npx playwright test <test-file> --project="Pixel 4a (5G)"
npx playwright test <test-file> --project="iPhone 14 (mobile safari)"
```

## CI notes

Install what the project needs: `chrome` for `Pixel 4a (5G)`, `webkit` for `iPhone 14 (mobile safari)`, for example `npx playwright install --with-deps webkit`.

## Troubleshooting and gotchas

- Both emulation projects load `config/project-profiles/.env.dev`.
- Emulation applies Playwright's device settings (viewport, user agent, touch) to a desktop browser. Testing a native app or a browser on a real device needs Appium, which is part of the Commercial edition.
