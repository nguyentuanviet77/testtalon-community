import { createGlobalSettings } from '../shared/global-settings-runtime';
const defaults = {
    // Platform-wide execution settings. Project profiles cannot override these values.
    TEST_TIMEOUT: 120000, // timeout for each Playwright test in milliseconds
    EXPECT_TIMEOUT: 10000, // timeout for retrying Playwright assertions in milliseconds
    GUI_TIMEOUT: 30000, // timeout for GUI actions in milliseconds, like clicks, waits, and element interactions
    NAVIGATION_TIMEOUT: 60000, // timeout for an API requests in milliseconds
    HIGHLIGHT_TEST_OBJECT_ENABLED: false,
    // CUSTOMER-DEFINED SETTINGS
    // Add, change or remove your own keys in this section as needed.
    // TEST_OPTIONS is an optional example. Keep secrets out of source-controlled settings.
    TEST_OPTIONS: {
        region: 'APAC',
        currency: 'USD',
    }
};
export const globalSettings = createGlobalSettings(defaults);
export function resolveGlobalSettings(environment: Readonly<Record<string, string | undefined>>): typeof globalSettings { return createGlobalSettings(defaults, environment); }
