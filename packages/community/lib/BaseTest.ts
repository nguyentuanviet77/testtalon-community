import { test as base, expect, type Page, type Dialog } from '@playwright/test';
import { WebActions } from './WebActions';
import { activateEnvProfile, selectEnvProfile } from '../../../config/loadProfileData';

const test = base.extend<{ webActions: WebActions; profileSetup: void }>({
    profileSetup: [async ({}, use, testInfo) => {
        const profile = activateEnvProfile(selectEnvProfile(testInfo.project.metadata.envProfile, testInfo.project.name),
            { folder: 'config', optional: true });
        try {
            // Fresh Community projects can use injected values without a private profile.
            testInfo.annotations.push({ type: 'Project', description: testInfo.project.name });
            await use();
        } finally { profile.restore(); }
    }, { auto: true }],
    webActions: async ({ page, context, profileSetup }, use) => {
        await use(new WebActions(page, context));
    },
});

export { test, expect, type Page, type Dialog };
