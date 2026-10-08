
import { randomInt } from 'node:crypto';
import * as facker from '@faker-js/faker';

/**
 * Returns a random element from the given array.
 * @template T
 * @param {T[]} arr - The array to pick from.
 * @returns {T} - A random element from the array.
 * @example
 * const arr = [1, 2, 3, 4, 5];
 * const randomElement = randomPick(arr);
 * console.log(randomElement); // 3
 */
export function randomPick<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length)];
}

/**
 * Generates a random numeric string of the specified length.
 * @param {number} numberLen - The length of the numeric string to generate.
 * @returns {string} A random numeric string.
 */
export function randomNumber(numberLen: number): string {
    let result = facker.faker.string.numeric(numberLen);
    return result;
}
/**
 * Generates a random alphabetic string of the specified length.
 * @param {number} strLen - The length of the alphabetic string to generate.
 * @returns {string} A random alphabetic string.
 */
export function randomString(strLen: number): string {
    let result = facker.faker.string.alpha({ length: strLen });
    return result;
}

/**
 * Generates a random alphanumeric string of the specified length.
 * @param {number} alphaNumLen - The length of the alphanumeric string to generate.
 * @returns {string} A random alphanumeric string.
 */
export function randomAlphaNumeric(alphaNumLen: number): string {
    let result = facker.faker.string.alphanumeric({ length: alphaNumLen });
    return result;
}
/**
 * Generates a random string of the specified length, consisting of characters from the provided character set.
 * @param {number} strLen - The length of the random string to generate.
 * @param {string} charSet - A string containing the set of characters to use for generating the random string.
 * @returns {string} A random string generated from the specified character set.
 */
export function randomStringFromCharSet(strLen: number, charSet: string): string {
    let result = '';
    for (let i = 0; i < strLen; i++) {
        result += charSet.charAt(randomInt(0, charSet.length));
    }
    return result;
}
/**
 * Generates a random boolean value.
 * @returns {boolean} A random boolean value (true or false).
 */
export function randomBoolean(): boolean {
    return randomInt(0, 2) === 1;
}
/**
 * Generates a random integer between the specified minimum and maximum values (inclusive).
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} A random integer between min and max.
 */
export function randomIntInRange(min: number, max: number): number {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);

    if (lower > upper) {
        throw new Error('min must be less than or equal to max.');
    }

    return randomInt(lower, upper + 1);
}
/**
 * Generates a random floating-point number between the specified minimum and maximum values (inclusive).
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} A random floating-point number between min and max.
 */
export function randomFloatInRange(min: number, max: number): number {
    if (max < min) {
        throw new Error('min must be less than or equal to max.');
    }

    const range = max - min;
    // Node crypto requires a safe integer bound and a range smaller than 2^48.
    const randomOffset = randomInt(0, 2 ** 32) / (2 ** 32 - 1);
    return min + (range * randomOffset);
}
/**
 * Generates a random date between the specified start and end dates.
 * @param {Date} start - The start date (inclusive).
 * @param {Date} end - The end date (inclusive).
 * @returns {Date} A random date between start and end.
 */
export function randomDateInRange(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    const randomTime = randomInt(minTime, maxTime + 1);
    return new Date(randomTime);
}

/**
 * Generate a randome date less than today
 */
export function randomDateLessThanToday(): Date {
  const randomDate = facker.faker.date.past();
  return randomDate;
}

/**
 * Generate a randome date greater than today
 */
export function randomDateGreaterThanToday(): Date {
  const randomDate = facker.faker.date.future();
  return randomDate;
}

/**
 * Generates a unique account name from random first and last names and the current timestamp.
 * @returns {string} A generated account name.
 */
export function generateAccountName(): string {
    return facker.faker.person.firstName() + '_' + facker.faker.person.lastName() + '_' + Date.now();
}

/**
 * Generates a memorable random account password.
 * @param {number} passwordLen to be generate, default[passwordLen=12]
 * @returns {string} A generated length-character password.
 */
export function generateAccountPassword(passwordLen: number = 12): string {
    return facker.faker.internet.password({ length: passwordLen, memorable: true, pattern: /[A-Za-z0-9!@#$%^&*]/ });
}

/**
 * Generates a random account email address for the specified provider.
 * @param {string} emailProvider - The email domain or provider to use.
 * @returns {string} A generated account email address.
 */
export function generateAccountEmail(emailProvider: string): string {
    return facker.faker.internet.email({ 
      firstName: facker.faker.person.firstName(), 
      lastName: facker.faker.person.lastName(),
      provider: emailProvider
    });
} 
