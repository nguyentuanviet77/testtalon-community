import type { Page, BrowserContext } from '@packages/core/lib/base-test';
import { WebActions } from './web-actions';

export interface WebFixtures {
    webActions: WebActions;
}

export const webFixtures = {
    webActions: async ({ page, context, profileSetup }: { page: Page; context: BrowserContext; profileSetup: void },
        use: (actions: WebActions) => Promise<void>) => {
        await use(new WebActions(page, context));
        await page.close();
    },
};
