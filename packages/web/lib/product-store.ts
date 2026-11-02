import { expect, type Page } from './base-test';
import { redefineTestLocator } from '@packages/core/lib/common-funcs';
import { pageIndex } from '@objectRepositories/gui/product-store-gui.json';
import { pageProduct } from '@objectRepositories/gui/prod-gui.json';
import { pageCart } from '@objectRepositories/gui/cart-gui.json';
import type { WebActions } from './web-actions';

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/**
 * Opens the cart and waits until its rows match the cart data the page loaded.
 *
 * @param page - The page of the test.
 * @param cartUrl - Open this address directly; without it the cart link in the header is clicked.
 */
export async function openCart(page: Page, cartUrl?: string): Promise<void> {
    const [response] = await Promise.all([
        page.waitForResponse(response =>
            new URL(response.url()).pathname === pageCart.network.cartLoadPath
            && response.request().method() === 'POST'),
        cartUrl ? page.goto(cartUrl) : page.locator(pageIndex.navigation.cartLink).click()
    ]);
    expect(response.ok(), 'Cart data must load before checking its rows').toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.Items), 'Cart response must contain its Items collection').toBeTruthy();
    await expect(page.locator(pageCart.productTable.locator).locator(pageCart.productTable.rows))
        .toHaveCount(body.Items.length);
}

/** The cart row that the add-to-cart request created with this ID. */
export function getCreatedRow(page: Page, cartId: string) {
    return page.locator(redefineTestLocator(pageCart.productTable.rowByCartId, { '{cartId}': cartId }));
}

/**
 * Clicks Add to cart on the open product page, accepts the "Product added." alert and records the ID of the cart row it created,
 * so the test can delete exactly its own rows afterwards.
 *
 * @param page - The page of the test, on a product details page.
 * @param webActions - The WebActions of the test.
 * @param cartIds - The list the new cart row ID is appended to.
 */
export async function addProductToCart(page: Page, webActions: WebActions, cartIds: string[]): Promise<void> {
    const requestPromise = page.waitForRequest(request =>
        new URL(request.url()).pathname === pageCart.network.addToCartPath
        && request.method() === 'POST').then(request => {
        const id: unknown = request.postDataJSON()?.id;
        if (typeof id === 'string' && UUID_PATTERN.test(id)) cartIds.push(id);
        return id;
    });
    const dialogPromise = page.waitForEvent('dialog').then(async dialog => {
        const result = { type: dialog.type(), message: dialog.message() };
        await dialog.accept();
        return result;
    });
    const [id, dialog] = await Promise.all([
        requestPromise, dialogPromise,
        webActions.highlightAndClick(page.locator(pageProduct.addToCartButton))
    ]);
    expect(typeof id, 'Add-to-cart must expose an item ID for safe cleanup').toBe('string');
    expect(id).toMatch(UUID_PATTERN);
    expect(new Set(cartIds).size, 'Each added cart row must have a unique ID').toBe(cartIds.length);
    expect(dialog.type).toBe('alert');
    expect(dialog.message).toBe('Product added.');
}

/**
 * Deletes the cart rows a test created, even when the test failed half way. It closes an open confirmation or checkout form first
 * and never touches a row whose ID is not in `cartIds`.
 *
 * @param page - The page of the test.
 * @param cartIds - The IDs of the rows the test created.
 * @param cartUrl - The address of the cart page.
 */
export async function cleanupCreatedRows(page: Page, cartIds: string[], cartUrl: string): Promise<void> {
    if (cartIds.length === 0) return;
    const confirmation = page.locator(pageCart.confirmation.locator);
    const form = page.locator(pageCart.checkout.modal);
    if (await confirmation.isVisible()) await confirmation.locator(pageCart.confirmation.okButton).click();
    if (await form.isVisible()) await form.locator(pageCart.checkout.closeButton).click();
    for (const cartId of cartIds) {
        await openCart(page, cartUrl);
        const row = getCreatedRow(page, cartId);
        if (await row.count() === 1) {
            await row.locator(pageCart.productTable.deleteLink).click();
            await expect(row).toHaveCount(0);
        }
    }
}
