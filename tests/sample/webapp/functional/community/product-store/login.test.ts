import { test, expect } from '@packages/web/lib/base-test';
import * as fnLib from '@packages/core/lib/common-funcs';
import { productLogin } from '@packages/web/lib/login';
import{pageIndex} from '@objectRepositories/gui/product-store-gui.json';
import {GenerateData} from '@packages/core/lib/generate-data';

const csvFilePath = '@data/web/product-store.login.csv';

let url: string;

test.beforeEach('Get the Application URL', async () => {
    url = process.env.GUI_BASE_URL || '';
});
/**
 * Scenario: Create a new user and append the user to the CSV data file for data-driven testing.
 *  Step 1: Navigate to the home page of the url
    Step 2: Click on the signup link in the navigation bar
    Step 3: Enter a unique username and password in the signup form
    Step 4: Click on the signup button
    Step 5: Verify that the alert message indicates successful signup
    Step 6: Append the new user to the CSV data file for future login tests
 */
test('Create new user and append to CSV data file', { tag: ['@Smoke', '@FT', '@SCRUM-TC-2'] }, async ({ page, webActions }) => {
    const username = GenerateData.generateAccountName();
    const password = GenerateData.generateAccountPassword();
    const displayName = `Welcome ${username}`;

    await test.step('Navigate to the home page', async () => {
        await page.goto(url);
        await webActions.waitForPageLoad(page);
    });

    
    await test.step('Create the new user', async () => {
        await test.step('Verify the alert message and accept it', async () => {
            page.once('dialog', async (dialog) => {
                const message = dialog.message();
                expect.soft(message).toBe('Sign up successful.');
                await dialog.accept();
            });
        });
        await page.locator(pageIndex.navigation.signupLink).click();
        await page.locator(pageIndex.signupForm.usernameInput).fill(username);
        await page.locator(pageIndex.signupForm.passwordInput).fill(password);
        //await page.locator(pageIndex.signupForm.signupButton).click();
        // Alternative way to click the Sign Up button using refineTestObjectLocator
        const signupButtonLocator = webActions.refineTestObjectLocator(page.locator(pageIndex.signupForm.modelFooter), pageIndex.signupForm.signupButtonText);
        await webActions.highlightAndClick(signupButtonLocator);
        
    });

    await test.step('Append the new user to the CSV data file', async () => {
        fnLib.appendCSVData(csvFilePath, {
            username,
            password,
            displayName,
            expectedMessage: '',
            expectedPassFail: 'pass'
        });
    })
    console.log('New user created and appended to CSV.');
});


/**
 * Scenario: Verify that users can log in successfully using data-driven testing from a CSV file.
 *  Step 1: Navigate to the home page of the url
    Step 2: click on the login link in the navigation bar 
    Step 3: Enter the username and password in the login form
    Step 4: Click on the login button
    Step 5: Verify that the user is logged in successfully by checking the welcome message
    Step 6: Logout the user
    Step 7: repeat the steps 2-6 for each user in the data-driven test
 */

const loginUsers = fnLib.readCsvDataFile(csvFilePath, [1]);
for (const user of loginUsers) {
    test(`Verify user can login successfully - [${user.username}]`, { tag: [ '@Smoke', '@FT', '@SCRUM-TC-3'] }, async ({ page, webActions }) => {
        const username = String(user.username ?? '').trim();
        const password = String(user.password ?? '').trim();
        const expectedWelcome = String(user.displayName ?? `Welcome ${username}`).trim();

        await test.step('Navigate to the home page', async () => {
            await page.goto(url);
            await webActions.waitForPageLoad(page);
        });

        await test.step('Login with the CSV user', async () => {
            await productLogin(page, username, password);
        });

        await test.step('Verify successful login', async () => {
            await expect(page.locator(pageIndex.navigation.welcomeUser)).toContainText(expectedWelcome);
        });

        await test.step('Logout the user', async () => {
            await page.locator(pageIndex.navigation.logoutLink).click();
            await expect(page.locator(pageIndex.navigation.welcomeUser)).not.toBeVisible();
        });
    });
} 

/**
 * Scenario: Verify that users cannot log in with invalid credentials using data-driven testing from a CSV file.
 *  Step 1: Navigate to the home page of the url
    Step 2: click on the login link in the navigation bar 
    Step 3: Enter the username and password in the login form
    Step 4: Click on the login button
    Step 5: Verify that the user is not logged in successfully by checking the alert message
    Step 6: repeat the steps 2-5 for each user in the data-driven test
 */

const invalidLoginUsers = fnLib.readCsvDataFile(csvFilePath, ['2-3'], false);

for (const user of invalidLoginUsers) {
    test(`Verify user cannot login with invalid credentials - [${user.username}]`, { tag: ['@FT'] }, async ({ page, webActions }) => {
        const username = String(user.username ?? '').trim();
        const password = String(user.password ?? '').trim();
        const expectedAlertMessage = String(user.expectedMessage ?? '').trim();

        await test.step('Navigate to the home page', async () => {
            await page.goto(url);
            await webActions.waitForPageLoad(page);
        });

        await test.step(`Attempt login with invalid credentials - ${user.username}`, async () => {
            // Listen for the dialog event and accept it, capturing the message
            const dialogMessage = webActions.waitForDialogAndAcceptWithReturn();
            await productLogin(page, username, password);

            const alertMessage = await dialogMessage;
            expect.soft(alertMessage, `Expected alert message: ${expectedAlertMessage}`).toBe(expectedAlertMessage);
        });
        await test.step('Verify the login form is still visible', async () => {
            await expect(page.locator(pageIndex.loginForm.locator).first()).toBeVisible();
        });
    });
}