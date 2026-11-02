import { test, expect } from '@packages/web/lib/base-test';
import { pagePlaywright } from '@objectRepositories/gui/playwright-gui.json';

// This test is a simple example of using direct url to navigate to the Playwright website and verify that the "Get Started" link leads to the installation guide. It demonstrates basic navigation, waiting for page load, and asserting the presence of elements on the page.
test('home page links to the installation guide', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
    await page.goto('https://playwright.dev');
    await webActions.waitForPageLoad();
    await webActions.highlightAndClick(page.getByRole('link', { name: pagePlaywright.getStarted.accessibleName }));
    await expect(page).toHaveURL(/\/docs\/intro/);
    await expect(page.getByRole('heading', { name: pagePlaywright.installation.accessibleName, level: 1 })).toBeVisible();
});
