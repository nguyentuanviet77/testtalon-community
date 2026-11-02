import { selectEnvProfile } from '@packages/core/config/load-profile-data';
import { test, type FullProject, type TestInfo } from '@playwright/test';

export interface ReportProperties {
    Browser: string;
    IsHeadless: boolean | null;
    Viewpoint: { width: number; height: number } | null;
    IsMobile: boolean;
    NumWorker: number;
    WorkerIndex: number;
    ParallelIndex: number;
    Device: string;
    EnvProfile: string;
    RunEnv: string;
    Project: string;
    Platform?: string;
    PlatformVersion?: string;
    AutomationName?: string;
}

export interface ReportContext {
    project: FullProject;
    config: Pick<TestInfo['config'], 'workers'> & Partial<Pick<TestInfo['config'], 'metadata'>>;
    workerIndex: number;
    parallelIndex: number;
    annotations?: TestInfo['annotations'];
}

// Hidden from the HTML annotation list; carries the worker's snapshot to reporters.
export const REPORT_PROPERTIES_ANNOTATION = '_reportProperties';

/** Matches Playwright's run banner after test selection and project worker limits. */
export function getRunWorkerCount(config: ReportContext['config']): number {
    const actualWorkers: unknown = config.metadata?.actualWorkers;
    return typeof actualWorkers === 'number' && Number.isInteger(actualWorkers) && actualWorkers >= 0
        ? actualWorkers
        : config.workers;
}

/** Formats the browser engine and Chromium channel consistently across reports. */
export function getBrowserDisplayName(use: FullProject['use']): string {
    const engine = use.browserName ?? use.defaultBrowserType ?? 'chromium';
    const channel = use.channel ?? use.launchOptions?.channel;
    return engine === 'chromium' && channel ? `${channel} (${engine})` : engine;
}

export function getEnvironmentProfile(project: FullProject): string {
    return selectEnvProfile(project.metadata.envProfile, project.name);
}

function readReportProperties(annotations: TestInfo['annotations'] = []): ReportProperties | undefined {
    const snapshot = annotations.find(annotation => annotation.type === REPORT_PROPERTIES_ANNOTATION)?.description;
    if (!snapshot) return undefined;
    try {
        const value = JSON.parse(snapshot) as ReportProperties;
        const strings = ['Browser', 'Device', 'EnvProfile', 'RunEnv', 'Project'] as const;
        const numbers = ['NumWorker', 'WorkerIndex', 'ParallelIndex'] as const;
        const validViewport = value?.Viewpoint === null
            || (Number.isFinite(value?.Viewpoint?.width) && Number.isFinite(value?.Viewpoint?.height));
        if (strings.every(key => typeof value?.[key] === 'string')
            && numbers.every(key => Number.isFinite(value?.[key]))
            && (typeof value?.IsHeadless === 'boolean' || value?.IsHeadless === null)
            && typeof value?.IsMobile === 'boolean' && validViewport) {
            return value;
        }
    } catch {
        // A missing or invalid snapshot falls back to the supplied configuration.
    }
    return undefined;
}

function getNativeProperties(metadata: Record<string, unknown>): Partial<ReportProperties> {
    const mobile = metadata.mobile;
    if (!mobile || typeof mobile !== 'object') return {};
    const config = mobile as Record<string, unknown>;
    if (config.platformName !== 'Android' && config.platformName !== 'iOS') return {};
    const text = (value: unknown): string => typeof value === 'string' && value.trim() ? value.trim() : 'Not configured';
    return {
        Browser: typeof config.browserName === 'string' ? config.browserName : 'Native app',
        IsHeadless: null,
        Viewpoint: null,
        IsMobile: true,
        Device: text(config.deviceName),
        Platform: config.platformName,
        PlatformVersion: text(config.platformVersion),
        AutomationName: config.platformName === 'Android' ? 'UiAutomator2' : 'XCUITest',
    };
}

/** Returns the shared report snapshot; call without arguments inside a BaseTest test. */
export function getReportProperties(
    context: ReportContext = test.info(),
    resolvedUse: FullProject['use'] = context.project.use,
    environment: NodeJS.ProcessEnv = process.env,
): ReportProperties {
    const snapshot = readReportProperties(context.annotations);
    if (snapshot) return snapshot;

    const envProfile = getEnvironmentProfile(context.project);
    const isMobile = resolvedUse.isMobile ?? resolvedUse.contextOptions?.isMobile ?? false;
    const viewport = resolvedUse.viewport === undefined ? resolvedUse.contextOptions?.viewport : resolvedUse.viewport;
    const device: unknown = context.project.metadata.deviceName;
    const deviceName = typeof device === 'string' && device.trim() ? device.trim() : 'Unknown';
    return {
        Browser: getBrowserDisplayName(resolvedUse),
        IsHeadless: resolvedUse.headless ?? resolvedUse.launchOptions?.headless ?? true,
        Viewpoint: viewport === null ? null : { ...(viewport ?? { width: 1280, height: 720 }) },
        IsMobile: isMobile,
        NumWorker: getRunWorkerCount(context.config),
        WorkerIndex: context.workerIndex,
        ParallelIndex: context.parallelIndex,
        Device: isMobile ? deviceName : 'Desktop',
        EnvProfile: envProfile,
        RunEnv: environment.RUN_ENV?.trim() || envProfile,
        Project: context.project.name || 'Default project',
        ...getNativeProperties(context.project.metadata),
    };
}

/** Converts the shared values to the string attributes accepted by HTML and ReportPortal. */
export function getReportAttributes(properties: ReportProperties): { key: string; value: string }[] {
    return Object.entries(properties).map(([key, value]) => {
        let formattedValue = String(value);
        if (key === 'IsHeadless' && value === null) formattedValue = 'Not applicable';
        if (key === 'Viewpoint') {
            formattedValue = properties.Viewpoint
                ? `Width: ${properties.Viewpoint.width}, Height: ${properties.Viewpoint.height}`
                : 'No fixed viewport';
        }
        return { key, value: formattedValue };
    });
}
