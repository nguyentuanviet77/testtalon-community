import { test, expect } from '@core/lib/BaseTest';
import { pagePlaywright } from '@objectRepositories/GUI/playwrightGUI.json';

test('home page links to the installation guide', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
    const appUrl = process.env.GUI_BASE_URL ?? '';
    test.skip(!appUrl, 'Set GUI_BASE_URL in the project profile, for example config/.env.staging.');
    await page.goto(appUrl);
    await webActions.waitForPageLoad();
    await webActions.highlightAndClick(page.getByRole('link', { name: pagePlaywright.getStarted.accessibleName }));
    await expect(page).toHaveURL(/\/docs\/intro/);
    await expect(page.getByRole('heading', { name: pagePlaywright.installation.accessibleName, level: 1 })).toBeVisible();
});
