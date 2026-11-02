import { devices, type PlaywrightTestConfig } from '@packages/core/lib/base-test';
const withEnvProfile = (envProfile: string, metadata: Record<string, unknown> = {}) => ({
    envProfile,
    ...metadata,
});
export const webProjects: NonNullable<PlaywrightTestConfig['projects']> = [
    // Web: Sample project for running tests in local environments with Chrome browsers configurations.
    {
        testDir: '.',
        name: `local`,
        metadata: withEnvProfile('local'),
        use: {
            // Configure the browser to use.
            browserName: `chromium`,
            //Chrome Browser Config
            channel: `chrome`,
        },
    },
    // Web: Sample project for running tests in uat environments with Edge browsers configurations.
    {
        testDir: '.',
        name: `uat`,
        metadata: withEnvProfile('uat'),
        use: {
            browserName: `chromium`,
            channel: `msedge`,
        },
    },
    // Web: Sample project for running tests in prodBeta environments with Firefox browsers configurations.
    {
        testDir: '.',
        name: `prodBeta`,
        metadata: withEnvProfile('prodBeta'),
        use: {
            browserName: `firefox`,
        },
    },
    // Web: Sample project for running tests in prod environments with Safari browsers configurations.
    {
        testDir: '.',
        name: `prod`,
        metadata: withEnvProfile('prod'),
        use: {
            //...devices['Desktop Safari'],
            browserName: `webkit`,
        },
    },
    // Web: Sample project for running tests in local environments with Safari browsers configurations.
    {
        testDir: '.',
        name: `webkit`,
        metadata: withEnvProfile('local'),
        use: {
            browserName: `webkit`,
        },
    },
    // WebMobile: Sample project for running tests in dev environments with mobile Simulation configurations.
    {
        testDir: '.',
        name: `Pixel 4a (5G)`,
        metadata: withEnvProfile('dev', {
            deviceName: 'Pixel 4a (5G)',
        }),
        use: {
            ...devices[`Pixel 4a (5G)`],
            browserName: `chromium`,
            channel: `chrome`,
            deviceScaleFactor: 2,
            isMobile: true,
        },
    },
    // WebMobile: Sample project for running tests in dev environments with mobile Simulation configurations.
    {
        testDir: '.',
        name: 'iPhone 14 (mobile safari)',
        metadata: withEnvProfile('dev', {
            deviceName: 'iPhone 14 (mobile safari)',
        }),
        use: { ...devices['iPhone 14'] }, // Mobile Safari emulation (WebKit)
    }
];
