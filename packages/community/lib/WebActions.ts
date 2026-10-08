import fs from 'node:fs';
//import type { Page } from '@playwright/test';
import { BrowserContext, expect, Locator, Page } from '@playwright/test';
import { Workbook } from 'exceljs';
import * as pdfjslib from 'pdfjs-dist-es5';
import logger from '../../../config/logger';
import { globalVariables } from '../../../config/community/globalVariables';

type SpinnerLocator = Locator | string;


export class WebActions {
    readonly page: Page;
    readonly context: BrowserContext;

    /**
     * Initializes a new instance of the WebActions class.
     * @param {Page} page - The playwright page object.
     * @param {BrowserContext} context - The playwright browser context object.
     */
    constructor(page: Page, context: BrowserContext) {
        this.page = page;
        this.context = context;
    }

    /**
     * Waits until the supplied page has finished loading.
     * Use this static helper only when you pass a Playwright page explicitly.
     * If you want to use the current fixture page, call webActions.waitForPageLoad().
     * @param {Page} page - The Playwright page object to wait on.
     * @param {Locator | string} [spinnerLocator] - Optional spinner locator that should be hidden after load.
     * @param {number} [polling=500] - Polling interval in milliseconds for the final ready state check.
     * @param {number} [timeout=120000] - Maximum wait time in milliseconds.
     * @returns {Promise<void>} - A promise that resolves when the page is ready.
     */
    // static async waitForPageLoad(
    //     page: Page,
    //     spinnerLocator?: SpinnerLocator,
    //     polling: number = 500,
    //     timeout: number = 120000
    // ): Promise<void> {
    //     await WebActions.waitUntilPageIsReady(page, spinnerLocator, polling, timeout);
    // }

    /**
     * Waits until this instance page, or a supplied page, has finished loading.
     * Use this helper from tests that use the webActions fixture.
     * @param {Page} [page] - Optional Playwright page object. Defaults to this.page.
     * @param {Locator | string} [spinnerLocator] - Optional spinner locator that should be hidden after load.
     * @param {number} [polling=500] - Polling interval in milliseconds for the final ready state check.
     * @param {number} [timeout=120000] - Maximum wait time in milliseconds.
     * @returns {Promise<void>} - A promise that resolves when the page is ready.
     */
    async waitForPageLoad(
        page?: Page,
        spinnerLocator?: SpinnerLocator,
        polling: number = 500,
        timeout: number = 120000
    ): Promise<void> {
        await WebActions.waitUntilPageIsReady(page ?? this.page, spinnerLocator, polling, timeout);
    }

    private static async waitUntilPageIsReady(
        page: Page,
        spinnerLocator?: SpinnerLocator,
        polling: number = 500,
        timeout: number = 120000
    ): Promise<void> {
        const timeoutAt = Date.now() + timeout;
        const remainingTimeout = (): number => Math.max(timeoutAt - Date.now(), 1);
        const pollingInterval = Math.max(polling, 1);

        await page.waitForLoadState('domcontentloaded', { timeout: remainingTimeout() });
        await page.waitForLoadState('load', { timeout: remainingTimeout() });

        if (spinnerLocator) {
            const spinner = typeof spinnerLocator === 'string' ? page.locator(spinnerLocator) : spinnerLocator;
            await expect(spinner).toBeHidden({ timeout: remainingTimeout() });
        }

        await expect.poll(
            async () => await page.evaluate(() => document.readyState),
            {
                intervals: [pollingInterval],
                timeout: remainingTimeout()
            }
        ).toBe('complete');
    }

    /**
     * A utility function to delay the execution of the following code block by the given time in milliseconds.
     * @param {number} time - The time in milliseconds to delay the execution.
     * @returns {Promise<void>} - A promise that resolves when the time has passed.
     */
    async delay(time: number): Promise<void> {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    /**
     * Clicks an element containing the given text.
     * @param {string} text - The exact text to search for.
     * @returns {Promise<void>} - A promise that resolves when the element is clicked.
     */
    async clickByText(text: string): Promise<void> {
        await this.page.getByText(text, { exact: true }).click();  //Matches locator with exact text and clicks
    }

    /**
     * Clicks an element located by the given string.
     * The string can be a CSS selector, an XPath expression, or a JavaScript function that returns an element.
     * @param {string} locator - The string to locate the element.
     * @returns {Promise<void>} - A promise that resolves when the element is clicked.
     */
    async clickElementJS(locator: string): Promise<void> {
        await this.page.$eval(locator, (element: HTMLElement) => element.click());
    }

    /**
     * Reads data from an Excel file located in ./data/downloads folder.
     * @param {string} fileName - The name of the Excel file to read (without extension).
     * @param {string} sheetName - The name of the sheet to read from.
     * @param {number} rowNum - The row number to read from.
     * @param {number} cellNum - The cell number to read from.
     * @returns {Promise<string | null>} - A promise that resolves with the data read from the Excel file, or null if the row or cell is not found.
     */
    async readDataFromExcel(fileName: string, sheetName: string, rowNum: number, cellNum: number): Promise<string | null> {
        const workbook = new Workbook();

        try {
            await workbook.xlsx.readFile(`./data/downloads/${fileName}`);

            const sheet = workbook.getWorksheet(sheetName);
            if (!sheet) {
                console.warn(`Sheet "${sheetName}" not found in ${fileName}`);
                return null;
            }

            const row = sheet.getRow(rowNum);
            if (!row) {
                console.warn(`Row ${rowNum} not found in sheet "${sheetName}"`);
                return null;
            }

            const cell = row.getCell(cellNum);
            if (!cell) {
                console.warn(`Cell ${cellNum} not found in row ${rowNum} (${sheetName})`);
                return null;
            }

            const value = cell.value;
            if (value == null) return null;

            return typeof value === 'object' ? JSON.stringify(value) : String(value);

        } catch (err) {
            console.error(`Failed to read Excel file: ${fileName}`, err);
            return null;
        }
    }

    /**
     * Reads the contents of a file located at the given file path.
     * @param {string} filePath - The path to the file to read.
     * @returns {Promise<string>} - A promise that resolves with the contents of the file as a string.
     */
    async readValuesFromTextFile(filePath: string): Promise<string> {
        return fs.readFileSync(`${filePath}`, `utf-8`);
    }

    /**
     * Writes data into a text file located at the given file path.
     * @param {string | number | fs.PathLike} filePath - The path to the file to write to.
     * @param {string | NodeJS.ArrayBufferView} data - The data to write to the file.
     * @returns {Promise<void>} - A promise that resolves when the data has been written to the file.
     */
    async writeDataIntoTextFile(filePath: number | fs.PathLike, data: string | NodeJS.ArrayBufferView): Promise<void> {
        fs.writeFile(filePath, data, (error) => {
            if (error)
                throw error;
        });
    }

    /**
     * Reads the text content of a page in a PDF document.
     * @param {any} pdf - The PDF document object.
     * @param {number} pageNo - The page number to read from.
     * @returns {Promise<string>} - A promise that resolves with the text content of the page as a string.
     */
    async getPdfPageText(pdf: any, pageNo: number) {
        const page = await pdf.getPage(pageNo);
        const tokenizedText = await page.getTextContent();
        const pageText = tokenizedText.items.map((token: any) => token.str).join('');
        return pageText;
    }

    /**
     * Reads the text content of a PDF document located at the given file path.
     * @param {string | number | fs.PathLike} filePath - The path to the PDF file to read from.
     * @returns {Promise<string>} - A promise that resolves with the text content of the PDF document as a string.
     */
    async getPDFText(filePath: any): Promise<string> {
        const dataBuffer = fs.readFileSync(filePath);
        const pdf = await pdfjslib.getDocument(dataBuffer).promise;
        const maxPages = pdf.numPages;
        const pageTextPromises = [];
        for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
            pageTextPromises.push(this.getPdfPageText(pdf, pageNo));
        }
        const pageTexts = await Promise.all(pageTextPromises);
        return pageTexts.join(' ');
    }

    /**
     * Highlights a Playwright locator with yellow background + red border,
     * then restores its original styles.
     */

    /**
     * Highlights a Playwright locator with yellow background + red border, then restores its original styles.
     * @param {Locator | string} locator - The locator or string selector to highlight.
     * Skips highlighting when globalVariables.HIGHLIGHT_TEST_OBJECT_ENABLED is false.
     * @param {number} [durationMs=300] - The duration in milliseconds for the highlight to remain visible.
     * @returns {Promise<void>} - A promise that resolves when the highlight is complete.
     */
    async highlightElement(locator: Locator | string, durationMs: number = 300): Promise<void> {
        if (!globalVariables.HIGHLIGHT_TEST_OBJECT_ENABLED) {
            return;
        }

        try {
            // Determine elementHandle from Locator or string selector
            const elementHandle =
                typeof (locator as any)?.elementHandle === "function"
                    ? await (locator as Locator).elementHandle()
                    : await this.page.$(locator as string);
    
            if (!elementHandle) {
                console.warn("highlightElement: element not found");
                return;
            }
    
            for (let i = 0; i < 3; i++) {
                await elementHandle.evaluate((el, duration) => {
                    const originalBackground = el.style.backgroundColor;
                    const originalBorder = el.style.border;
    
                    // Apply highlight styles
                    el.style.backgroundColor = "yellow"
                    el.style.border = "3px solid red";
    
                    // Restore styles after duration
                    setTimeout(() => {
                        el.style.backgroundColor = originalBackground;
                        el.style.border = originalBorder;
                    }, duration * 0.3);
                }, durationMs);
                await this.delay(durationMs);
            }
        } catch (error) {
            logger.error({
                event: 'ELEMENT_HIGHLIGHT',
                message: `highlightElement error: ${error instanceof Error ? error.message : String(error)}`,
                error: error instanceof Error ? error.stack : String(error)
            });
        }
    }

    /**
     * Returns a Playwright locator for an element containing the given text within the specified container.
     * @param {string} textObject - The exact text to search for.
     * @param {Locator | string} [containerLocator='body'] - The container locator or selector in which to find the text.
     * @returns {Promise<Locator>} - A promise that resolves with the matching locator.
     * @throws {Error} - Throws an error if the textObject is not a non-empty string.
     */
    async getLocatorOfStringObject(textObject: string, containerLocator: Locator | string = 'body'): Promise<Locator> {
        if (typeof textObject !== 'string' || !textObject.trim()) {
            throw new Error('getLocatorOfStringObject: textObject must be a non-empty string.');
        }
        const container = typeof containerLocator === 'string' ? this.page.locator(containerLocator) : containerLocator;
        const matches = container.getByText(textObject, { exact: true });

        return matches.first();
    }

    /**
     * Highlights a Playwright locator with yellow background + red border for a short duration,
     * then clicks on the element.
     * @param {Locator | string} locator - The locator to highlight and click on.
     * @returns {Promise<void>} - A promise that resolves when the highlight and click are complete.
     */
    async highlightAndClick(locator: Locator | string): Promise<void> {
        let matchedLocator: Locator;
        if (typeof locator === 'string') {
            matchedLocator = await this.getLocatorOfStringObject(locator);
        } else {
            matchedLocator = locator;
        }
        await this.highlightElement(matchedLocator);
        await matchedLocator.click();
    }
    
    /**
     * Highlights a Playwright locator with yellow background + red border for a short duration,
     * then fills the element with the given value.
     * @param {Locator | string} locator - The locator to highlight and fill.
     * @param {string} value - The value to fill into the element.
     * @returns {Promise<void>} - A promise that resolves when the highlight and fill are complete.
     */
    async highlightAndFill(locator: Locator | string, value: string): Promise<void> {
        let matchedLocator: Locator;
        if (typeof locator === 'string') {
            matchedLocator = await this.getLocatorOfStringObject(locator);
        } else {
            matchedLocator = locator;
        }
        await this.highlightElement(matchedLocator);
        await matchedLocator.fill(value);
    }
    /**
     * Highlights a Playwright locator with yellow background + red border for a short duration,
     * then types the given value into the element.
     * @param {Locator | string} locator - The locator to highlight and type into.
     * @param {string} value - The value to type into the element.
     * @returns {Promise<void>} - A promise that resolves when the highlight and typing are complete.
     */
    async highlightAndType(locator: Locator | string, value: string): Promise<void> {
        let matchedLocator: Locator;
        if (typeof locator === 'string') {
            matchedLocator = await this.getLocatorOfStringObject(locator);
        } else {
            matchedLocator = locator;
        }
        await this.highlightElement(matchedLocator);
        await matchedLocator.pressSequentially(value);
    }

    /**
     * Returns the matching text element inside the given container, ready for an action.
     * Text matching is exact and case-sensitive, with Playwright whitespace normalization.
     * The position is selected in DOM order; the default is the first match.
     * Returns a lazy locator; the subsequent action waits for the element to be ready.
     * Creating this locator does not query or modify the DOM, scroll, focus, or navigate.
     * A missing match is handled by the subsequent action's timeout, not by this helper.
     * @param containerLocator - The container locator or selector in which to find the text.
     * @param textObject - The dynamic text supplied by the caller.
     * @param returnOptions - Which matching element to return; 1, 2, and 3 are aliases for first, second, and third.
     * @throws When the text or container selector is blank, or the position is unsupported.
     * @example
     * const item = webActions.refineTestObjectLocator(page.locator('#cart'), productName);
     * await item.click();
     * const secondItem = webActions.refineTestObjectLocator('#cart', productName, 'second');
     * await secondItem.click();
     */
    refineTestObjectLocator(
        containerLocator: Locator | string,
        textObject: string,
        returnOptions: 'first' | 'last' | 1 | 'second' | 2 | 'third' | 3 = 'first'
    ): Locator {
        if (typeof textObject !== 'string' || !textObject.trim()) {
            throw new Error('refineTestObjectLocator: textObject must be a non-empty string.');
        }
        if (typeof containerLocator === 'string' && !containerLocator.trim()) {
            throw new Error('refineTestObjectLocator: container selector must not be blank.');
        }

        const container = typeof containerLocator === 'string' ? this.page.locator(containerLocator) : containerLocator;
        const matches = container.getByText(textObject, { exact: true });

        switch (returnOptions) {
            case 'first':
            case 1:
                return matches.first();
            case 'last':
                return matches.last();
            case 'second':
            case 2:
                return matches.nth(1);
            case 'third':
            case 3:
                return matches.nth(2);
            default:
                throw new Error(`refineTestObjectLocator: unsupported returnOptions "${returnOptions}".`);
        }
    }
    
    /**
     * Downloads a file by clicking on the given download button locator and saves it to the specified path.
     * @param {Locator} downloadButtonLocator - The locator for the download button to click.
     * @param {string} savePath - The path where the downloaded file should be saved.
     * @returns {Promise<string>} - A promise that resolves to the path where the file has been saved.
     */
    async downloadFileAndSave(downloadButtonLocator: Locator, savePath: string): Promise<string> {
        // Start waiting for download before clicking. Note no await.
        const downloadPromise = this.page.waitForEvent('download');
        await downloadButtonLocator.click();
        const download = await downloadPromise;
        // Wait for the download process to complete and save the downloaded file somewhere.
        await download.saveAs(savePath+`/${download.suggestedFilename()}`);
        return savePath+`/${download.suggestedFilename()}`;
    }

    /**
     * Wait for pop-up dialog to appear and accept it, then verify the alert message.
     * @param {string} expectedMessage - The expected message in the alert dialog.
     * @returns {Promise<void>} - A promise that resolves when the dialog has been accepted and verified.
     */
    async waitForDialogAndAccept(expectedMessage: string): Promise<void> {
        const message = await this.waitForDialogAndAcceptWithReturn();
        expect.soft(message).toBe(expectedMessage);
    }
    /**
     * Wait for pop-up dialog to appear and accept it, then return the alert message.
     * @returns {Promise<string>} - A promise that resolves with the message in the alert dialog.
     */
    async waitForDialogAndAcceptWithReturn(): Promise<string> {
        const dialogMessage = new Promise<string>((resolve) => {
                this.page.once('dialog', async (dialog) => {
                    const message = dialog.message();
                    await dialog.accept();
                    resolve(message);
                });
            });
        return dialogMessage;
    }
}
