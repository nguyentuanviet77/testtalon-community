import { test, expect, type Page } from '@packages/web/lib/base-test';
import { serveSampleApp } from '@packages/web/lib/sample-app';
import { widgets } from '@objectRepositories/gui/widgets-gui.json';
import { playwrightDev } from '@objectRepositories/gui/playwright-dev-gui.json';

// Accordion, tabs, slider, progress bar, date input and autocomplete are exercised on a small local sample application:
// the page sample-app/widgets/widgets.html, answered from disk by Playwright's `route` through serveSampleApp. No server, network or
// account is needed, and other tests can open the same page. It is a sample page, not a playwright.dev feature.
// The last two scenarios use real interactive elements of the public site. Its address is PLAYWRIGHT_DEV_URL when set,
// otherwise https://playwright.dev; the project's baseURL belongs to your own application and is ignored here.
const FIXTURE_ORIGIN = 'https://fixtures.example.test';
const publicSiteUrl = process.env.PLAYWRIGHT_DEV_URL ?? 'https://playwright.dev';

/** Serves the sample application for this test's browser context and opens its page. */
async function openWidgets(page: Page): Promise<void> {
    await serveSampleApp(page.context(), 'widgets', FIXTURE_ORIGIN);
    await page.goto(`${FIXTURE_ORIGIN}/widgets`);
}

test.describe('sample application: widgets', () => {
    test.beforeEach(async ({ page, webActions }) => {
        await openWidgets(page);
        await webActions.waitForPageLoad();
    });

    test('an accordion section expands and collapses', { tag: ['@GUI', '@Smoke', '@Offline'] }, async ({ page, webActions }) => {
        const trigger = page.locator(widgets.accordionTrigger1);
        const panel = page.locator(widgets.accordionPanel1);
        await expect(panel).toBeHidden();
        await webActions.highlightAndClick(trigger);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
        await expect(panel).toHaveText('Orders ship within two working days.');
        await expect(page.locator(widgets.accordionPanel2)).toBeHidden();
        await webActions.highlightAndClick(trigger);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toBeHidden();
        await webActions.highlightAndClick(page.locator(widgets.accordionTrigger2));
        await expect(page.locator(widgets.accordionPanel2)).toHaveText('Items can be returned within thirty days.');
        await expect(panel).toBeHidden();
    });

    test('tabs switch the active panel', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        await expect(page.locator(widgets.tabOverview)).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator(widgets.panelOverview)).toBeVisible();
        await expect(page.locator(widgets.panelDetails)).toBeHidden();
        await webActions.highlightAndClick(page.locator(widgets.tabDetails));
        await expect(page.locator(widgets.tabDetails)).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator(widgets.tabOverview)).toHaveAttribute('aria-selected', 'false');
        await expect(page.locator(widgets.panelDetails)).toHaveText('One hundred pages, dotted.');
        await expect(page.locator(widgets.panelOverview)).toBeHidden();
    });

    test('a slider changes value by typing and by keyboard', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const slider = page.locator(widgets.slider);
        await expect(page.locator(widgets.sliderValue)).toHaveText('3');
        await webActions.highlightAndFill(slider, '7');
        await expect(slider).toHaveValue('7');
        await expect(page.locator(widgets.sliderValue)).toHaveText('7');
        await slider.press('ArrowRight');
        await expect(page.locator(widgets.sliderValue)).toHaveText('8');
        await slider.press('End');
        await expect(page.locator(widgets.sliderValue)).toHaveText('10');
        await slider.press('Home');
        await expect(slider).toHaveValue('0');
    });

    test('a progress bar advances to complete after the upload starts', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const progress = page.locator(widgets.uploadProgress);
        await expect(progress).toHaveJSProperty('value', 0);
        await expect(page.locator(widgets.uploadStatus)).toHaveText('Idle');
        await webActions.highlightAndClick(page.locator(widgets.startUploadButton));
        await expect(page.locator(widgets.uploadStatus)).toHaveText('Upload complete');
        await expect(progress).toHaveJSProperty('value', 100);
        await expect(page.locator(widgets.startUploadButton)).toBeEnabled();
    });

    test('a date input accepts a date and reports it', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const date = page.locator(widgets.dateInput);
        await webActions.highlightAndFill(date, '2026-12-31');
        await expect(date).toHaveValue('2026-12-31');
        await expect(page.locator(widgets.dateResult)).toHaveText('Selected: 2026-12-31');
    });

    test('a date before the minimum is flagged as invalid', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const date = page.locator(widgets.dateInput);
        await webActions.highlightAndFill(date, '2025-12-31');
        expect(await date.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
        await webActions.highlightAndFill(date, '2026-01-01');
        expect(await date.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(true);
    });

    test('autocomplete suggests matches and a suggestion can be selected', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const input = page.locator(widgets.countryInput);
        await webActions.highlightAndType(input, 'ja');
        const options = page.locator(widgets.countryOption);
        await expect(options).toHaveText(['Jamaica', 'Japan']);
        await webActions.highlightAndClick(options.filter({ hasText: widgets.japanOptionText }));
        await expect(input).toHaveValue('Japan');
        await expect(page.locator(widgets.countryResult)).toHaveText('Selected: Japan');
        await expect(page.locator(widgets.countryList)).toBeHidden();
    });

    test('autocomplete can be completed with the keyboard', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const input = page.locator(widgets.countryInput);
        await webActions.highlightAndType(input, 'k');
        await expect(page.locator(widgets.countryOption)).toHaveText(['Kenya', 'Kuwait']);
        await input.press('ArrowDown');
        await input.press('ArrowDown');
        await input.press('Enter');
        await expect(input).toHaveValue('Kuwait');
        await expect(page.locator(widgets.countryResult)).toHaveText('Selected: Kuwait');
    });
});

test.describe('real website: playwright.dev', () => {
    test('the package-manager tabs on the installation page switch the install command', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
        await page.goto(`${publicSiteUrl}/docs/intro`);
        await webActions.waitForPageLoad();
        const tabs = page.getByRole('tablist').first();
        const commandPanel = page.getByRole('tabpanel').first();
        // exact: true matters: the accessible name "npm" is also a substring of "pnpm".
        const npm = tabs.getByRole('tab', { name: playwrightDev.npmTab.accessibleName, exact: true });
        const yarn = tabs.getByRole('tab', { name: playwrightDev.yarnTab.accessibleName, exact: true });
        const pnpm = tabs.getByRole('tab', { name: playwrightDev.pnpmTab.accessibleName, exact: true });

        await expect(npm).toHaveAttribute('aria-selected', 'true');
        await expect(commandPanel).toContainText('npm init playwright@latest');
        await webActions.highlightAndClick(yarn);
        await expect(yarn).toHaveAttribute('aria-selected', 'true');
        await expect(npm).toHaveAttribute('aria-selected', 'false');
        await expect(commandPanel).toContainText('yarn create playwright');
        await webActions.highlightAndClick(pnpm);
        await expect(pnpm).toHaveAttribute('aria-selected', 'true');
        await expect(commandPanel).toContainText('pnpm create playwright');
    });

    test('a category in the documentation sidebar expands and collapses', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
        await page.goto(`${publicSiteUrl}/docs/intro`);
        await webActions.waitForPageLoad();
        const sidebar = page.getByRole('navigation', { name: playwrightDev.docsSidebar.accessibleName });
        const category = sidebar.getByRole('button', { name: playwrightDev.migrationCategory.accessibleName });
        const nestedLink = sidebar.getByRole('link', { name: playwrightDev.migrationPuppeteerLink.accessibleName });

        await expect(category).toHaveAttribute('aria-expanded', 'false');
        await expect(nestedLink).toBeHidden();
        await webActions.highlightAndClick(category);
        await expect(category).toHaveAttribute('aria-expanded', 'true');
        await expect(nestedLink).toBeVisible();
        await webActions.highlightAndClick(category);
        await expect(category).toHaveAttribute('aria-expanded', 'false');
        await expect(nestedLink).toBeHidden();
    });
});
