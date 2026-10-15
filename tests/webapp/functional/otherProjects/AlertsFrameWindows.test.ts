import { test, expect, type Page } from '@core/lib/BaseTest';
import { alertsFramesWindows } from '@objectRepositories/GUI/alertsFramesWindowsGUI.json';
import { pagePlaywright } from '@objectRepositories/GUI/playwrightGUI.json';
import { playwrightDev } from '@objectRepositories/GUI/playwrightDevGUI.json';

// Alerts, frames and windows are not features of playwright.dev, so scenarios A-E run against a small local
// fixture: three HTML pages answered from inside the test by Playwright's `route`. No server, network or account is needed.
// Scenario F uses the real public site. Its address is PLAYWRIGHT_DEV_URL when set (a project or profile can supply it),
// otherwise the public https://playwright.dev. It deliberately ignores the project's baseURL, which belongs to your own application.
const fixtureOrigin = 'https://fixtures.example.test';
const publicSiteUrl = process.env.PLAYWRIGHT_DEV_URL ?? 'https://playwright.dev';

const fixturePages: Record<string, string> = {
    '/alerts': `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Alerts, frames and windows (local fixture)</title></head>
<body>
  <h1>Alerts, frames and windows</h1>
  <button id="alert-button" type="button">Show alert</button>
  <button id="confirm-button" type="button">Show confirm</button>
  <button id="prompt-button" type="button">Show prompt</button>
  <p id="result" role="status"></p>
  <iframe id="practice-frame" title="Practice frame" src="/frame"></iframe>
  <a id="open-tab" href="/popup" target="_blank">Open in a new tab</a>
  <script>
    const result = document.querySelector('#result');
    document.querySelector('#alert-button').addEventListener('click', () => {
      alert('Hello from the practice page');
      result.textContent = 'Alert accepted';
    });
    document.querySelector('#confirm-button').addEventListener('click', () => {
      result.textContent = confirm('Do you want to continue?') ? 'You pressed OK' : 'You pressed Cancel';
    });
    document.querySelector('#prompt-button').addEventListener('click', () => {
      const name = prompt('What is your name?', '');
      result.textContent = name ? 'Hello, ' + name + '!' : 'No name entered';
    });
  </script>
</body>
</html>`,
    '/frame': `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Frame content</title></head>
<body>
  <h2 id="frame-heading">Inside the frame</h2>
  <label for="frame-name">Name</label><input id="frame-name">
  <button id="frame-button" type="button">Greet from the frame</button>
  <p id="frame-output"></p>
  <script>
    document.querySelector('#frame-button').addEventListener('click', () => {
      document.querySelector('#frame-output').textContent = 'Hello, ' + document.querySelector('#frame-name').value + ' (from the frame)';
    });
  </script>
</body>
</html>`,
    '/popup': `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>New tab (local fixture)</title></head>
<body><h1 id="popup-heading">New tab opened</h1></body>
</html>`,
};

/** Serves the fixture pages for this test's browser context and opens the main page. */
async function openFixture(page: Page): Promise<void> {
    await page.context().route(`${fixtureOrigin}/**`, route => {
        const body = fixturePages[new URL(route.request().url()).pathname];
        return route.fulfill(body === undefined ? { status: 404, contentType: 'text/plain', body: 'not found' } : { contentType: 'text/html', body });
    });
    await page.goto(`${fixtureOrigin}/alerts`);
}

interface DialogSeen { type: string; message: string; defaultValue: string }

/**
 * Answers the next dialog and reports what it was. Call it BEFORE the click that opens the dialog, and await the result after.
 * webActions.waitForDialogAndAcceptWithReturn only accepts without text; a prompt answer or a dismissal needs this small helper.
 */
function answerNextDialog(page: Page, answer: { accept: boolean; text?: string }): Promise<DialogSeen> {
    return new Promise(resolve => page.once('dialog', async dialog => {
        resolve({ type: dialog.type(), message: dialog.message(), defaultValue: dialog.defaultValue() });
        if (answer.accept) await dialog.accept(answer.text);
        else await dialog.dismiss();
    }));
}

test.describe('local fixture: alerts, frames and windows', () => {
    test.beforeEach(async ({ page, webActions }) => {
        await openFixture(page);
        await webActions.waitForPageLoad();
    });

    test('a JavaScript alert shows its message and is accepted', { tag: ['@GUI', '@Smoke', '@Offline'] }, async ({ page, webActions }) => {
        const message = webActions.waitForDialogAndAcceptWithReturn();
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.alertButton));
        expect(await message).toBe('Hello from the practice page');
        await expect(page.locator(alertsFramesWindows.result)).toHaveText('Alert accepted');
    });

    test('a JavaScript confirm that is accepted reports OK', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const message = webActions.waitForDialogAndAcceptWithReturn();
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.confirmButton));
        expect(await message).toBe('Do you want to continue?');
        await expect(page.locator(alertsFramesWindows.result)).toHaveText('You pressed OK');
    });

    test('a JavaScript confirm that is dismissed reports Cancel', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const dialog = answerNextDialog(page, { accept: false });
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.confirmButton));
        expect(await dialog).toMatchObject({ type: 'confirm', message: 'Do you want to continue?' });
        await expect(page.locator(alertsFramesWindows.result)).toHaveText('You pressed Cancel');
    });

    test('a JavaScript prompt receives the typed value', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const dialog = answerNextDialog(page, { accept: true, text: 'Ada' });
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.promptButton));
        expect(await dialog).toMatchObject({ type: 'prompt', message: 'What is your name?', defaultValue: '' });
        await expect(page.locator(alertsFramesWindows.result)).toHaveText('Hello, Ada!');
    });

    test('a JavaScript prompt that is dismissed returns no value', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const dialog = answerNextDialog(page, { accept: false });
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.promptButton));
        expect((await dialog).type).toBe('prompt');
        await expect(page.locator(alertsFramesWindows.result)).toHaveText('No name entered');
    });

    test('an element inside an iframe can be filled and clicked', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const frame = page.frameLocator(alertsFramesWindows.frame);
        await expect(frame.locator(alertsFramesWindows.frameHeading)).toHaveText('Inside the frame');
        await webActions.highlightAndFill(frame.locator(alertsFramesWindows.frameNameInput), 'Grace');
        await webActions.highlightAndClick(frame.locator(alertsFramesWindows.frameGreetButton));
        await expect(frame.locator(alertsFramesWindows.frameOutput)).toHaveText('Hello, Grace (from the frame)');
        await expect(page.locator(alertsFramesWindows.heading)).toHaveText('Alerts, frames and windows');
    });

    test('a link that opens a new tab gives a page that can be checked and closed', { tag: ['@GUI', '@Offline'] }, async ({ page, context, webActions }) => {
        const newPage = context.waitForEvent('page');
        await webActions.highlightAndClick(page.locator(alertsFramesWindows.newTabLink));
        const popup = await newPage;
        try {
            await popup.waitForLoadState('domcontentloaded');
            await expect(popup).toHaveURL(`${fixtureOrigin}/popup`);
            await expect(popup).toHaveTitle('New tab (local fixture)');
            await expect(popup.locator(alertsFramesWindows.popupHeading)).toHaveText('New tab opened');
            expect(context.pages()).toHaveLength(2);
        } finally {
            if (!popup.isClosed()) await popup.close();
        }
        expect(context.pages()).toEqual([page]);
        await expect(page).toHaveURL(`${fixtureOrigin}/alerts`);
    });
});

test.describe('real website: playwright.dev', () => {
    test('the Docs link on playwright.dev opens the Installation page', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
        await page.goto(publicSiteUrl);
        await webActions.waitForPageLoad();
        const mainNavigation = page.getByRole('navigation', { name: playwrightDev.mainNavigation.accessibleName });
        await webActions.highlightAndClick(mainNavigation.getByRole('link', { name: playwrightDev.docsLink.accessibleName, exact: true }));
        await expect(page).toHaveURL(/\/docs\/intro$/);
        await expect(page.getByRole('heading', { level: 1, name: pagePlaywright.installation.accessibleName })).toBeVisible();
        await expect(page).toHaveTitle(/Installation/);
    });
});
