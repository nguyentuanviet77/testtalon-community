import { test, expect, Dialog } from '@packages/web/lib/base-test';
import { readCsvDataFile } from '@packages/core/lib/common-funcs';
import { productLogin } from '@packages/web/lib/login';
import { openCart, getCreatedRow, cleanupCreatedRows } from '@packages/web/lib/product-store';
import { pageIndex } from '@objectRepositories/gui/product-store-gui.json';
import { pageProduct } from '@objectRepositories/gui/prod-gui.json';
import { pageCart } from '@objectRepositories/gui/cart-gui.json';

// Plan: specs/product-store.add-product-and-purchase2.md
// Browser capture seed: tests/sample/seeds/seed.spec.ts; Playwright project: dev.
// The purchase data selects the current valid account from the login CSV.
const CASE_ID = 'PS-CHECKOUT-002';
const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

test.describe('Product store checkout', () => {
    test('Add product to cart and purchase successfully', { tag: ['@GUI', '@Smoke', '@FT'] }, async ({ page, webActions }) => {
        const matches = readCsvDataFile('./data/web/product-store.purchase.csv')
            .filter(row => row.caseId === CASE_ID);
        expect(matches, `Exactly one purchase data row is required for ${CASE_ID}`).toHaveLength(1);
        const purchase = matches[0];
        for (const [column, value] of Object.entries(purchase)) {
            expect(value.trim(), `Purchase CSV column ${column} must not be blank`).not.toBe('');
        }
        expect(Number(purchase.productPrice), 'Expected product price must be a positive number').toBeGreaterThan(0);
        const accounts = readCsvDataFile('./data/web/product-store.login.csv')
            .filter(row => row.username === purchase.loginUsername);
        expect(accounts, 'The selected purchase account must have exactly one existing login CSV row').toHaveLength(1);
        const user = accounts[0];
        if (!user.password || !user.displayName) throw new Error('The selected login row requires password and displayName');
        const baseUrl = process.env.GUI_BASE_URL;
        if (!baseUrl) throw new Error('GUI_BASE_URL is required for product-store checkout');
        const cartUrl = new URL(purchase.cartPath, baseUrl).href;
        const table = page.locator(pageCart.productTable.locator);
        const rows = table.locator(pageCart.productTable.rows);
        const confirmation = page.locator(pageCart.confirmation.locator);
        const orderForm = page.locator(pageCart.checkout.modal);
        let addedCartId: string | undefined;
        let addedDialog: Dialog | undefined;

        try {
            await test.step('Step 1: Login with valid credentials', async () => {
                await page.goto(baseUrl);
                const welcome = page.locator(pageIndex.navigation.welcomeUser);
                if (!await welcome.isVisible()) await productLogin(page, user.username, user.password);
                await expect(welcome).toHaveText(user.displayName);
                await openCart(page);
                await expect(rows, 'Account cart must be empty; never purchase or delete existing records').toHaveCount(0);
                await page.locator(pageIndex.navigation.homeLink).click();
                await expect(page.locator(pageIndex.categories.locator)).toBeVisible();
            });

            await test.step('Step 2: In the Category section, select Phones', async () => {
                await page.locator(pageIndex.categories.locator).locator(pageIndex.categories.phonesLink).click();
                const productCard = page.locator(pageIndex.productTable.productCard.locator)
                    .filter({ hasText: purchase.productName });
                await expect(productCard).toHaveCount(1);
                await expect(productCard.locator(pageIndex.productTable.productCard.titleLink)).toHaveText(purchase.productName);
                await expect(productCard.locator(pageIndex.productTable.productCard.priceText)).toHaveText(`$${purchase.productPrice}`);
            });

            await test.step('Step 3: Select a product to view product details', async () => {
                const productLink = page.locator(pageIndex.productTable.productCard.locator)
                    .filter({ hasText: purchase.productName }).locator(pageIndex.productTable.productCard.titleLink);
                await expect(productLink).toHaveAttribute('href', purchase.productLink);
                await productLink.click();
                await expect(page.locator(pageProduct.name)).toHaveText(purchase.productName);
                await expect(page.locator(pageProduct.price)).toContainText(`$${purchase.productPrice}`);
                await expect(page.locator(pageProduct.descriptionText)).toHaveText(purchase.productDescription);
                await expect(page.locator(pageProduct.detailsImage)).toHaveAttribute('src', purchase.productImage);
            });

            await test.step('Step 4: Click Add to cart to add the product', async () => {
                const requestPromise = page.waitForRequest(request =>
                    new URL(request.url()).pathname === pageCart.network.addToCartPath
                    && request.method() === 'POST');
                const dialogPromise = page.waitForEvent('dialog');
                await webActions.highlightAndClick(page.locator(pageProduct.addToCartButton));
                const request = await requestPromise;
                const id = request.postDataJSON()?.id;
                if (typeof id === 'string' && uuidPattern.test(id)) addedCartId = id;
                addedDialog = await dialogPromise;
                if (!addedCartId) {
                    await addedDialog.accept();
                    addedDialog = undefined;
                    throw new Error('Add-to-cart request must expose a valid unique item ID for safe cleanup');
                }
            });

            await test.step('Step 5: Verify the product-added alert message', async () => {
                if (!addedDialog) throw new Error('Add-to-cart alert was not received');
                const message = addedDialog.message();
                const type = addedDialog.type();
                await addedDialog.accept();
                addedDialog = undefined;
                expect(type).toBe('alert');
                expect(message).toBe(purchase.addedAlert);
            });

            await test.step('Step 6: Navigate to cart and verify the product is present', async () => {
                await openCart(page);
                await expect(page).toHaveURL(cartUrl);
                await expect(rows).toHaveCount(1);
                const addedRow = getCreatedRow(page, addedCartId!);
                await expect(addedRow).toHaveCount(1);
                await expect(addedRow.locator(pageCart.productTable.nameCell)).toHaveText(purchase.productName);
                await expect(addedRow.locator(pageCart.productTable.priceCell)).toHaveText(purchase.productPrice);
                await expect(addedRow.locator(pageCart.productTable.imageElement)).toHaveAttribute('src', purchase.productImage);
                const deleteAction = await addedRow.locator(pageCart.productTable.deleteLink).getAttribute('onclick');
                expect(deleteAction).toBe(`deleteItem('${addedCartId}')`);
                await expect(page.locator(pageCart.cartSummary.totalPrice)).toHaveText(purchase.productPrice);
            });

            await test.step('Step 7: Click Place Order to open the order form', async () => {
                await page.locator(pageCart.cartSummary.placeOrderButton).click();
                await expect(orderForm).toBeVisible();
                await expect(orderForm.locator(pageCart.checkout.total)).toHaveText(`Total: ${purchase.productPrice}`);
            });

            await test.step('Step 8: Fill required order information and click Purchase', async () => {
                const fields = pageCart.placeOrderForms;
                const inputs = [
                    [fields.nameInput, purchase.orderName], [fields.countryInput, purchase.country],
                    [fields.cityInput, purchase.city], [fields.cardInput, purchase.card],
                    [fields.monthInput, purchase.month], [fields.yearInput, purchase.year]
                ];
                for (const [selector, value] of inputs) {
                    await orderForm.locator(selector).fill(value);
                    await expect(orderForm.locator(selector)).toHaveValue(value);
                }
                // Checkout consumes the whole cart: recheck that it contains only our recorded row.
                await expect(rows).toHaveCount(1);
                await expect(getCreatedRow(page, addedCartId!)).toHaveCount(1);
                // The success modal appears before the asynchronous cart clear completes.
                // Wait for completion so OK navigation cannot cancel that request.
                const [clearResponse] = await Promise.all([
                    page.waitForResponse(response =>
                        new URL(response.url()).pathname === pageCart.network.checkoutClearPath
                        && response.request().method() === 'POST'),
                    orderForm.locator(pageCart.checkout.purchaseButton).click()
                ]);
                expect(clearResponse.ok(), 'Purchase must complete its cart-clear request before OK navigation').toBeTruthy();
                await clearResponse.finished();
            });

            await test.step('Step 9: Verify successful purchase confirmation', async () => {
                await expect(confirmation).toBeVisible();
                await expect(confirmation.locator(pageCart.confirmation.heading)).toHaveText(purchase.confirmationMessage);
                const details = confirmation.locator(pageCart.confirmation.details);
                await expect(details).toContainText(`Amount: ${purchase.productPrice} ${purchase.currency}`);
                await expect(details).toContainText(`Name: ${purchase.orderName}`);
                await expect(details).toContainText(`Card Number: ${purchase.card}`);
                await expect(details).toContainText(/Id: \d+/);
            });

            await test.step('Step 10: Click OK, close confirmation and return to cart', async () => {
                await confirmation.locator(pageCart.confirmation.okButton).click();
                await expect(confirmation).not.toBeVisible();
                // The verified application redirects home after OK; explicitly return to cart.
                await openCart(page);
                await expect(page).toHaveURL(cartUrl);
                await expect(rows).toHaveCount(0);
                addedCartId = undefined;
            });
        } finally {
            if (addedDialog) await addedDialog.accept();
            await cleanupCreatedRows(page, addedCartId ? [addedCartId] : [], cartUrl);
        }
    });
});
