import {pageIndex} from '@objectRepositories/gui/product-store-gui.json';
import { Page, test } from './base-test';
import { WebActions } from './web-actions';


export async function productLogin(page: Page, username: string, password: string): Promise<void> {
    const webActions = new WebActions(page, page.context());

    await test.step('Navigate to the login page', async () => {
        await page.locator(pageIndex.navigation.loginLink).click();
    });
    await test.step('Fill in the login form', async () => {
        await page.locator(pageIndex.loginForm.usernameInput).fill(username);
        await page.locator(pageIndex.loginForm.passwordInput).fill(password);
    });
    await test.step('Click the login button', async () => {
        await webActions.highlightAndClick(page.locator(pageIndex.loginForm.browserLoginButton));
    });
}
