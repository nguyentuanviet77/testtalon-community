import productItem from '@data/web/product-store.legacy-purchase.json';
import { test, expect } from '@packages/web/lib/base-test';
import { readCsvDataFile } from '@packages/core/lib/common-funcs';
import { productLogin } from '@packages/web/lib/login';
import { openCart, getCreatedRow, addProductToCart, cleanupCreatedRows } from '@packages/web/lib/product-store';
import { pageIndex } from '@objectRepositories/gui/product-store-gui.json';
import { pageProduct } from '@objectRepositories/gui/prod-gui.json';
import { pageCart } from '@objectRepositories/gui/cart-gui.json';
import { GenerateData } from '@packages/core/lib/generate-data';

const QUANTITY = 2;

test('Add product to cart and purchase', { tag: ['@GUI', '@Smoke', '@FT', '@SCRUM-TC-1'] }, async ({ page, webActions }) => {
    const [user] = readCsvDataFile('@data/web/product-store.login.csv', [1]);
    if (!user?.username || !user?.password || !user?.displayName) {
        throw new Error('The first login CSV row must contain username, password and displayName.');
    }
    const baseUrl = process.env.GUI_BASE_URL;
    if (!baseUrl) throw new Error('GUI_BASE_URL is required for product-store checkout');
    const cartUrl = new URL('cart.html', baseUrl).href;
    const unitPrice = Number(productItem.price.replace('$', ''));
    expect(unitPrice, 'The product price must be positive').toBeGreaterThan(0);
    const totalPrice = String(unitPrice * QUANTITY);
    const order = {
        name: user.username,
        country: GenerateData.randomPick(['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'China']),
        city: GenerateData.randomPick(['New York', 'Los Angeles', 'Toronto', 'London', 'Berlin', 'Paris', 'Sydney', 'Tokyo']),
        card: String(GenerateData.randomNumber(11)),
        month: GenerateData.randomPick(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']),
        year: String(new Date().getFullYear() + 1),
    };
    const rows = page.locator(pageCart.productTable.locator).locator(pageCart.productTable.rows);
    const form = page.locator(pageCart.checkout.modal);
    const confirmation = page.locator(pageCart.confirmation.locator);
    const cartIds: string[] = [];

    try {
        await test.step('Login with valid credentials and verify an empty cart', async () => {
            await page.goto(baseUrl);
            await productLogin(page, user.username, user.password);
            await expect(page.locator(pageIndex.navigation.welcomeUser)).toHaveText(user.displayName);
            await openCart(page);
            await expect(rows, 'Never purchase or delete pre-existing account cart records').toHaveCount(0);
            await page.locator(pageIndex.navigation.homeLink).click();
            await expect(page.locator(pageIndex.categories.locator)).toBeVisible();
        });

        await test.step('Select Phones and open the product details', async () => {
            await page.locator(pageIndex.categories.locator).locator(pageIndex.categories.phonesLink).click();
            const card = page.locator(pageIndex.productTable.productCard.locator).filter({ hasText: productItem.name });
            const title = card.locator(pageIndex.productTable.productCard.titleLink);
            await expect(card).toHaveCount(1);
            await expect(title).toHaveText(productItem.name);
            await expect(title).toHaveAttribute('href', productItem.link);
            await expect(card.locator(pageIndex.productTable.productCard.imageElement)).toHaveAttribute('src', productItem.imageUrl);
            await expect(card.locator(pageIndex.productTable.productCard.priceText)).toHaveText(productItem.price);
            await expect(card.locator(pageIndex.productTable.productCard.description)).toHaveText(productItem.description);
            await title.click();
        });

        await test.step('Verify the product details on the product details page', async () => {
            await expect(page.locator(pageProduct.name)).toHaveText(productItem.name);
            await expect(page.locator(pageProduct.price)).toHaveText(`${productItem.price} *includes tax`);
            await expect(page.locator(pageProduct.descriptionText)).toHaveText(productItem.description);
            await expect(page.locator(pageProduct.detailsImage)).toHaveAttribute('src', productItem.imageUrl);
        });

        await test.step('Add the product twice and verify each alert', async () => {
            for (let itemNumber = 1; itemNumber <= QUANTITY; itemNumber++) {
                await test.step(`Add item ${itemNumber} and accept its alert`, async () => {
                    await addProductToCart(page, webActions, cartIds);
                });
            }
        });

        await test.step('Verify both products and the total price in the cart', async () => {
            await openCart(page);
            await expect(page).toHaveURL(cartUrl);
            await expect(rows).toHaveCount(QUANTITY);
            expect(cartIds).toHaveLength(QUANTITY);
            for (const cartId of cartIds) {
                const row = getCreatedRow(page, cartId);
                await expect(row).toHaveCount(1);
                await expect(row).toBeVisible();
                await expect(row.locator(pageCart.productTable.imageElement)).toBeVisible();
                await expect(row.locator(pageCart.productTable.imageElement)).toHaveAttribute('src', productItem.imageUrl);
                await expect(row.locator(pageCart.productTable.nameCell)).toHaveText(productItem.name);
                await expect(row.locator(pageCart.productTable.priceCell)).toHaveText(String(unitPrice));
                const deleteLink = row.locator(pageCart.productTable.deleteLink);
                await expect(deleteLink).toHaveText('Delete');
                await expect(deleteLink).toBeVisible();
                await expect(deleteLink).toBeEnabled();
            }
            await expect(page.locator(pageCart.cartSummary.totalPrice)).toBeVisible();
            await expect(page.locator(pageCart.cartSummary.totalPrice)).toHaveText(totalPrice);
        });

        await test.step('Place the order and fill in the purchase details', async () => {
            await page.locator(pageCart.cartSummary.placeOrderButton).click();
            await expect(form).toBeVisible();
            await expect(form.locator(pageCart.checkout.total)).toHaveText(`Total: ${totalPrice}`);
            const fields = pageCart.placeOrderForms;
            const inputs = [
                [fields.nameInput, order.name], [fields.countryInput, order.country],
                [fields.cityInput, order.city], [fields.cardInput, order.card],
                [fields.monthInput, order.month], [fields.yearInput, order.year]
            ];
            for (const [selector, value] of inputs) {
                await form.locator(selector).fill(value);
                await expect(form.locator(selector)).toHaveValue(value);
            }
            // Checkout consumes the entire account cart; verify it contains only our two recorded rows.
            await expect(rows).toHaveCount(QUANTITY);
            for (const cartId of cartIds) await expect(getCreatedRow(page, cartId)).toHaveCount(1);
            const [clearResponse] = await Promise.all([
                page.waitForResponse(response =>
                    new URL(response.url()).pathname === pageCart.network.checkoutClearPath
                    && response.request().method() === 'POST'),
                form.locator(pageCart.checkout.purchaseButton).click()
            ]);
            expect(clearResponse.ok(), 'Checkout must clear the cart before OK navigation').toBeTruthy();
            await clearResponse.finished();
        });

        await test.step('Verify the successful purchase confirmation', async () => {
            await expect(confirmation).toBeVisible();
            await expect(confirmation.locator(pageCart.confirmation.heading)).toHaveText('Thank you for your purchase!');
            const details = confirmation.locator(pageCart.confirmation.details);
            await expect(details).toContainText(`Name: ${order.name}`);
            await expect(details).toContainText(`Card Number: ${order.card}`);
            await expect(details).toContainText(/Id: \d+/);
            await expect(details).toContainText(`Amount: ${totalPrice} USD`);
        });

        await test.step('Click OK and verify return to the empty cart', async () => {
            await confirmation.locator(pageCart.confirmation.okButton).click();
            await expect(confirmation).not.toBeVisible();
            await expect(page).toHaveURL(/\/index\.html(?:[?#].*)?$/);
            await openCart(page);
            await expect(page).toHaveURL(cartUrl);
            await expect(rows).toHaveCount(0);
            cartIds.length = 0;
        });
    } finally {
        await cleanupCreatedRows(page, cartIds, cartUrl);
    }
});
