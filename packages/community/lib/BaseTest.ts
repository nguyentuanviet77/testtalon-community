import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect, type Page, type Dialog } from '@playwright/test';
import { WebActions } from './WebActions';
import { loadEnvProfile } from '../../../config/loadProfileData';

const test = base.extend<{ webActions: WebActions; profileSetup: void }>({
    profileSetup: [async ({}, use, testInfo) => {
        const profile = String(testInfo.project.metadata.envProfile ?? testInfo.project.name);
        if (fs.existsSync(path.resolve('config', `.env.${profile}`))) {
            loadEnvProfile(profile, { folder: 'config', override: true, debug: false });
        }
        // Fresh Community projects can use injected environment values without private profiles.
        testInfo.annotations.push({ type: 'Project', description: testInfo.project.name });
        await use();
    }, { auto: true }],
    webActions: async ({ page, context, profileSetup }, use) => {
        await use(new WebActions(page, context));
    },
});

export { test, expect, type Page, type Dialog };
