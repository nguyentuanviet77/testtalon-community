import {test, expect} from '@packages/web/lib/base-test';

test(`Verify the text contents of PDF file.`, { tag: ['@GUI', '@Smoke', '@Offline'] }, async ({ webActions }) => {
    const extractedText = await webActions.getPDFText("@data/web/pdf/sample.pdf");
    const status = extractedText.includes("TestTalon Community sample PDF")
    expect(status).toBeTruthy();
});