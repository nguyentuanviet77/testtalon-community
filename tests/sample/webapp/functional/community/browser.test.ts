import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@packages/web/lib/base-test';
import { readCsvDataFile } from '@packages/core/lib/common-funcs';
import { demo } from '@objectRepositories/gui/community-demo-gui.json';

test('Community browser helpers display the CSV message', { tag: ['@GUI', '@Smoke', '@Offline'] }, async ({ page, webActions }) => {
    const rows = readCsvDataFile('@data/web/demo.csv', [1]);
    expect(rows).toHaveLength(1);
    await test.step('Load the bundled browser example', async () => {
        await page.setContent(fs.readFileSync(path.resolve('sample-app/community-demo/demo.html'), 'utf8'));
        await webActions.waitForPageLoad();
    });
    await test.step('Fill and submit the repository-backed form', async () => {
        await webActions.highlightAndFill(page.locator(demo.input), rows[0].message);
        await webActions.highlightAndClick(page.locator(demo.submit));
    });
    await test.step('Verify the independently supplied CSV expectation', async () => {
        await expect(page.locator(demo.output)).toHaveText(rows[0].message);
    });
});
