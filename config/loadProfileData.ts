import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenvx from '@dotenvx/dotenvx';
import logger from './logger';

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



/**
 * Loads environment variables from a .env file located in the specified folder.
 *
 * @param {string} profile - The name of the profile to load.
 * @param {object} [options] - Optional configuration options.
 * @param {string} [options.folder] - The folder containing the .env file. Defaults to "./config".
 * @param {boolean} [options.override] - Whether to override existing environment variables. Defaults to true.
 * @param {boolean} [options.debug] - Whether to print the loaded environment variables. Defaults to false.
 * @throws {Error} - If the .env file is not found.
 */
export function loadEnvProfile(profile: string, options?: {
  folder?: string;        // default: "./config"
  override?: boolean;     // default: true
  debug?: boolean;        // print loaded variables
}): void {
  const { folder = "config", override = false, debug = false } = options || {};

  if (!profile) {
    throw new Error("loadEnvProfile: profile name is required");
  }

  const envPath = path.resolve(process.cwd(), folder, `.env.${profile}`);

  if (!fs.existsSync(envPath)) {
    throw new Error(`loadEnvProfile: env file not found: ${envPath}`);
  }

  //const fileContent = fs.readFileSync(envPath, { encoding: "utf-8" });
  logger.info(`Loading environment profile: [${profile}] from [${envPath}]`);
  dotenvx.config({ path: envPath, override: override, debug: debug});

  // Parse env file
  //const parsedEnv = dotenv.parse(fileContent);

  // Load into process.env
  // for (const [key, value] of Object.entries(parsedEnv)) {
  //   if (!override && process.env[key] !== undefined) {
  //     continue; // keep existing value
  //   }
  //   process.env[key] = value;
  // }

  if (debug) {
    console.info(`Loaded environment: [${profile}] from [${envPath}]`);
    console.table(process.env);
  }
}
