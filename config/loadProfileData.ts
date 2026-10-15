import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenvx from '@dotenvx/dotenvx';

/**
 * Loads a JSON profile from the `../profiles/` directory.
 *
 * @param {string} profileName - The name of the profile to load.
 * @returns {Promise<Record<string, any>>} - A promise that resolves to the loaded profile as a JSON object.
 * @throws {Error} - If the profile file is not found.
 */
export function loadProfile(profileName: string): Promise<Record<string, any>> {
    const profilePath = path.join(__dirname, `../profiles/`, `${profileName}.json`);
    if (!fs.existsSync(profilePath)) {
        throw new Error(`Profile file not found: ${profilePath}`);
    }
    const profileContent = fs.readFileSync(profilePath, `utf-8`);
    return JSON.parse(profileContent);
}



export type ProfileEnvironment = Readonly<Record<string, string | undefined>>;

export interface EnvProfileOptions {
    folder?: string;
    /** Default false: invocation/CI values win. True explicitly gives the profile precedence. */
    override?: boolean;
    optional?: boolean;
    environment?: ProfileEnvironment;
    defaults?: Readonly<Record<string, string>>;
    /** Compatibility option: emits safe metadata only, never dotenvx debug output. */
    debug?: boolean;
}

export interface ResolvedEnvProfile {
    readonly profile: string;
    readonly status: 'loaded' | 'absent';
    readonly precedence: 'invocation' | 'profile';
    readonly environment: ProfileEnvironment;
}

export class EnvProfileError extends Error {
    constructor(readonly category: string, profile?: string) {
        super(`Environment profile${profile ? ` "${profile}"` : ''}: ${category}. Check the profile file and matching key/invocation settings.`);
        this.name = 'EnvProfileError';
    }
}

/** Metadata wins, then project name, then local. ENV_PROFILE is deliberately not a selector. */
export function selectEnvProfile(metadataProfile: unknown, projectName = ''): string {
    const selected = typeof metadataProfile === 'string' && metadataProfile.trim()
        ? metadataProfile : projectName || 'local';
    return normalizeEnvProfile(selected);
}

function normalizeEnvProfile(profile: string): string {
    if (typeof profile !== 'string') throw new EnvProfileError('invalid profile name');
    const normalized = profile.trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(normalized) || normalized.includes('..')) {
        throw new EnvProfileError('invalid profile name');
    }
    return normalized;
}

function errorCategory(error: unknown): string {
    const code = (error as { code?: unknown } | null)?.code;
    if (code === 'ENOENT' || code === 'MISSING_ENV_FILE') return 'missing profile';
    if (code === 'EACCES' || code === 'EPERM') return 'inaccessible profile';
    const decryption = ['MISSING_PRIVATE_KEY', 'INVALID_PRIVATE_KEY', 'WRONG_PRIVATE_KEY',
        'MALFORMED_ENCRYPTED_DATA', 'DECRYPTION_FAILED'];
    return decryption.includes(String(code)) ? 'decryption/key failure' : 'profile load failure';
}

/** Reject ignored garbage/unclosed quotes rather than accepting a partially parsed profile. */
function validateEnvSource(file: string, profile: string): void {
    const bytes = fs.readFileSync(file);
    const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : 'utf-8';
    let source: string;
    try { source = new TextDecoder(encoding, { fatal: true }).decode(bytes); }
    catch { throw new EnvProfileError('malformed profile', profile); }
    // dotenv assignment grammar, including export, colon assignments and multiline quoted values.
    const assignment = /^\s*(?:export\s+)?[\w.-]+(?:\s*=\s*|:\s+)(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|(?!['"`])[^#\r\n]*)[ \t]*(?:#.*)?$/gm;
    const residue = source.replace(assignment, '').replace(/^\s*#.*$/gm, '').trim();
    if (source.includes('\0') || residue) throw new EnvProfileError('malformed profile', profile);
}

/** Resolve into a private copy: dotenvx can mutate its target before returning/throwing an error. */
export function resolveEnvProfile(profile: string, options: EnvProfileOptions = {}): ResolvedEnvProfile {
    const name = normalizeEnvProfile(profile);
    const folder = path.resolve(options.folder ?? 'config');
    const file = path.join(folder, `.env.${name}`);
    const environment: Record<string, string> = {};
    for (const [key, value] of Object.entries(options.environment ?? process.env)) {
        if (value !== undefined) environment[key] = value;
    }
    let status: ResolvedEnvProfile['status'] = 'loaded';
    let fileFound = false;
    try {
        const realFolder = fs.realpathSync(folder);
        const realFile = fs.realpathSync(file);
        if (path.dirname(realFile) !== realFolder || !fs.statSync(realFile).isFile()) {
            throw new EnvProfileError('unsafe profile file', name);
        }
        fileFound = true;
        validateEnvSource(realFile, name);
        const result = dotenvx.config({ path: realFile, processEnv: environment,
            override: options.override ?? false, strict: true, quiet: true,
            debug: false, verbose: false, opsOff: true });
        if (result.error) throw result.error;
    } catch (error) {
        if (error instanceof EnvProfileError) throw error;
        const category = errorCategory(error);
        if (options.optional && !fileFound && category === 'missing profile') status = 'absent';
        else throw new EnvProfileError(category, name);
    }
    if (options.debug) console.info(`Environment profile "${name}": ${status}`);
    return Object.freeze({ profile: name, status,
        precedence: options.override ? 'profile' : 'invocation',
        environment: Object.freeze({ ...options.defaults, ...environment }) });
}

/** Apply after successful resolution. Restore only keys changed by this activation, once. */
export function activateEnvProfile(profile: string, options: EnvProfileOptions = {},
    target: NodeJS.ProcessEnv = process.env): { resolved: ResolvedEnvProfile; restore: () => void } {
    const resolved = resolveEnvProfile(profile, { ...options, environment: target });
    const previous = new Map<string, string | undefined>();
    for (const [key, value] of Object.entries(resolved.environment)) {
        if (value !== undefined && value !== target[key]) {
            previous.set(key, target[key]);
            target[key] = value;
        }
    }
    return { resolved, restore: () => {
        for (const [key, value] of previous) {
            if (value === undefined) delete target[key];
            else target[key] = value;
        }
        previous.clear();
    } };
}

/** Existing callers retain persistent loading and explicit override behavior. */
export function loadEnvProfile(profile: string, options: EnvProfileOptions = {}): void {
    activateEnvProfile(profile, options);
}

export function readEnvBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized !== 'true' && normalized !== 'false') throw new EnvProfileError('invalid boolean setting');
    return normalized === 'true';
}

export function readEnvNumber(value: string | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0) {
        throw new EnvProfileError('invalid nonnegative numeric setting');
    }
    return Number(value);
}

/** Late worker/runtime defaults, retaining writable compatibility properties for explicit code overrides. */
export function runtimeEnvDefaults<T extends Record<string, string | number | boolean>>(defaults: T): T {
    const settings = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T & string>) {
        let explicit: T[typeof key] | undefined;
        Object.defineProperty(settings, key, { enumerable: true, configurable: true,
            get: () => {
                if (explicit !== undefined) return explicit;
                const fallback = defaults[key];
                const value = process.env[key];
                if (typeof fallback === 'boolean') return readEnvBoolean(value, fallback);
                if (typeof fallback === 'number') return readEnvNumber(value, fallback);
                return value ?? fallback;
            },
            set: (value: T[typeof key]) => { explicit = value; },
        });
    }
    return settings;
}
