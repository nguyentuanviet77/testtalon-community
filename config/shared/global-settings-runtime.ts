/** Global configuration never reads profile-mutated process.env or publishes values into it. */
export type GlobalValue = string | number | boolean | null | GlobalValue[] | { [key: string]: GlobalValue };
export type GlobalDefaults = Record<string, GlobalValue>;
export type InvocationEnvironment = Readonly<Record<string, string | undefined>>;
// This module is imported before profile activation. Node's module cache preserves this capture on config reload.
const invocation: InvocationEnvironment = Object.freeze({ ...process.env });

function invalid(key: string): Error {
    return new Error(`[Global settings] Invalid configuration for ${key}. Check its default and invocation override type: booleans must be true or false; objects/arrays require JSON.`);
}

function converted(key: string, fallback: GlobalValue, supplied: string): GlobalValue {
    if (typeof fallback === 'string') return supplied;
    if (typeof fallback === 'boolean') {
        const value = supplied.trim().toLowerCase();
        if (value === 'true' || value === 'false') return value === 'true';
        throw invalid(key);
    }
    if (typeof fallback === 'number') {
        if (supplied.trim() && Number.isFinite(Number(supplied))) return Number(supplied);
        throw invalid(key);
    }
    let value: GlobalValue;
    try { value = JSON.parse(supplied); } catch { throw invalid(key); }
    if (fallback === null ? value !== null : value === null || typeof value !== 'object'
        || Array.isArray(value) !== Array.isArray(fallback)) throw invalid(key);
    return value;
}

function assertDefault(key: string, value: GlobalValue): void {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error('[Global settings] Keys must be valid environment variable names.');
    try {
        // JSON rejects cycles, bigint and unsupported values. Reject non-finite numbers/functions/undefined too.
        JSON.stringify(value, (_key, item: unknown) => {
            if (typeof item === 'function' || typeof item === 'undefined' || typeof item === 'symbol'
                || (typeof item === 'number' && !Number.isFinite(item))) throw invalid(key);
            return item;
        });
    } catch { throw invalid(key); }
}

/** Customer keys are inferred directly from the defaults, without a separate schema/registry. */
export function createGlobalSettings<T extends GlobalDefaults>(defaults: T,
    environment: InvocationEnvironment = invocation): T {
    const settings = {} as T;
    const supplied = { ...environment };
    for (const key of Object.keys(defaults) as Array<keyof T & string>) {
        Object.defineProperty(settings, key, { enumerable: true, configurable: true,
            get: () => {
                assertDefault(key, defaults[key]);
                return supplied[key] === undefined ? defaults[key] : converted(key, defaults[key], supplied[key]);
            },
            set: (value: T[typeof key]) => { defaults[key] = value; },
        });
    }
    return settings;
}
/** Validate only the shape of the defaults; never log their values. */
export function validateGlobalSettings(settings: object): void {
    for (const key of Object.keys(settings)) void (settings as Record<string, unknown>)[key];
}
