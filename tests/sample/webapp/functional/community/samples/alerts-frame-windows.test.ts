import { test, expect, type Page } from '@packages/web/lib/base-test';
import { serveSampleApp } from '@packages/web/lib/sample-app';
import { alertsFramesWindows } from '@objectRepositories/gui/alerts-frames-windows-gui.json';
import { pagePlaywright } from '@objectRepositories/gui/playwright-gui.json';
import { playwrightDev } from '@objectRepositories/gui/playwright-dev-gui.json';

// Alerts, frames and windows are not features of playwright.dev, so scenarios A-E run against a small local sample application:
// the pages in sample-app/alerts-frames-windows/ (alerts.html, frame.html, popup.html), answered from disk by Playwright's `route`
// through serveSampleApp. No server, network or account is needed, and other tests can open the same pages.
// The last scenario uses the real public site. Its address is PLAYWRIGHT_DEV_URL when set (a project or profile can supply it),
// otherwise the public https://playwright.dev. It deliberately ignores the project's baseURL, which belongs to your own application.
const FIXTURE_ORIGIN = 'https://fixtures.example.test';
const publicSiteUrl = process.env.PLAYWRIGHT_DEV_URL ?? 'https://playwright.dev';

/** Serves the sample application for this test's browser context and opens its main page. */
async function openFixture(page: Page): Promise<void> {
    await serveSampleApp(page.context(), 'alerts-frames-windows', FIXTURE_ORIGIN);
    await page.goto(`${FIXTURE_ORIGIN}/alerts`);
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
            await expect(popup).toHaveURL(`${FIXTURE_ORIGIN}/popup`);
            await expect(popup).toHaveTitle('New tab (local fixture)');
            await expect(popup.locator(alertsFramesWindows.popupHeading)).toHaveText('New tab opened');
            expect(context.pages()).toHaveLength(2);
        } finally {
            if (!popup.isClosed()) await popup.close();
        }
        expect(context.pages()).toEqual([page]);
        await expect(page).toHaveURL(`${FIXTURE_ORIGIN}/alerts`);
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
