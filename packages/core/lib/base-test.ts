import { test as base } from '@playwright/test';
import { globalSettings } from '@config/global/global-settings';
import { validateGlobalSettings } from '@config/shared/global-settings-runtime';
import { activateProfileValues, selectEnvProfile, resolveEnvProfileFolder } from '@packages/core/config/load-profile-data';

/**
 * ProfileTestOptions interface defines the options for creating a profile test.
 * - optional: Indicates whether the selected profile is optional (true) or required (false).
 * - beforeProfile: An optional function that can be executed before activating the profile. It should return an object with a restore method to clean up after the test.
 */
export interface ProfileTestOptions {
    /** Master requires its selected profile; a fresh Community project permits absence. */
    optional: boolean;
    /** Feature composition may prepare integration profiles without coupling Core to them. */
    beforeProfile?: () => { restore(): void };
}

/**
 * Creates a profile test with the specified options.
 * @param options - An object containing the options for the profile test.
 * @returns A test function that can be used to define tests with the specified profile options.
 */
export function createProfileTest(options: ProfileTestOptions) {
    return base.extend<{ profileSetup: void }>({
        profileSetup: [async ({}, use, testInfo) => {
            validateGlobalSettings(globalSettings);
            const folder = resolveEnvProfileFolder(testInfo.project.metadata.envProfileScope);
            const prepared = options.beforeProfile?.();
            let profile: ReturnType<typeof activateProfileValues> | undefined;
            try {
                profile = activateProfileValues(selectEnvProfile(testInfo.project.metadata.envProfile, testInfo.project.name),
                    { folder, optional: options.optional });
                testInfo.annotations.push({ type: 'Project', description: testInfo.project.name });
                await use();
            } finally {
                profile?.restore();
                prepared?.restore();
            }
        }, { auto: true }],
    });
}

export * from '@playwright/test'; //export all Playwright test utilities for convenience in test files
/** Browser-neutral test entry point; browser fixtures are supplied only by the Web package. */
export const test = createProfileTest({ optional: true });
