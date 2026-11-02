import { faker } from '@faker-js/faker';
import { randomInt } from 'node:crypto';

/**
 * GenerateData class provides methods to generate random data for testing purposes.
 */
export class GenerateData {

    static firstName(): string {
        return faker.person.firstName();
    }
    static lastName(): string {
        return faker.person.lastName();
    }
    static fullName(): string {
        return `${this.firstName()} ${this.lastName()}`;
    }
    static email(): string {
        return faker.internet.email();
    }
    static password(): string {
        return faker.internet.password({length: 12, memorable: false, pattern: /[A-Za-z0-9]/, prefix: '!@#$%^&*'});
    }
    static address(): string {
        return faker.location.streetAddress();
    }
    static city(): string {
        return faker.location.city();
    }
    static zipCode(): string {
        return faker.location.zipCode();
    }
    static phoneNumber(length: number = 10, prefix?: string, style?: 'human' | 'national' | 'international'): string {

        return prefix? prefix + faker.phone.number({style: 'human'}) : faker.phone.number({style: style});
    }
    
    /**
     * Generate a random phone IMEI (International Mobile Equipment Identity) number.
     * @returns {string} - Phone IMEI number.
     */
    static phoneIMEI(): string {
        return faker.phone.imei();
    }

    /**
     * Generate organization data.
     * @param {string} [name] - Name of the organization.
     * @returns {Record<string, any>} - Organization data.
     * @property {string} name - Name of the organization.
     * @property {string} phone - Phone number of the organization.
     * @property {string} address - Address of the organization.
     * @property {string} city - City of the organization.
     * @property {string} zipCode - Zip code of the organization.
     * @property {string} email - Email address of the organization.
     * @property {string} country - Country of the organization.
     * @property {Record<string, any>} presentPerson - Present person data.
     * @property {string} presentPerson.firstName - First name of the present person.
     * @property {string} presentPerson.lastName - Last name of the present person.
     * @property {string} presentPerson.email - Email address of the present person.
     * @property {string} presentPerson.phone - Phone number of the present person.
     */
    static organization(name?: string): Record<string, any> {
        return {
            name: name? name : faker.company.name(),
            phone: GenerateData.phoneNumber(),
            address: GenerateData.address(),
            city: GenerateData.city(),
            zipCode: GenerateData.zipCode(),
            email: GenerateData.email(),
            country: faker.location.country(),
            presentPerson: {
                firstName: GenerateData.firstName(),
                lastName: GenerateData.lastName(),
                email: GenerateData.email(),
                phone: GenerateData.phoneNumber()
            }
        }
    }

    /**
     * Generate person data.
     * @returns {Record<string, any>} - Person data.
     * @property {string} firstName - First name of the person.
     * @property {string} lastName - Last name of the person.
     * @property {string} email - Email address of the person.
     * @property {string} phoneNumber - Phone number of the person.
     * @property {number} age - Age of the person.
     * @property {string} gender - Gender of the person.
     * @property {string} address - Address of the person.
     * @property {string} city - City of the person.
     * @property {string} zipCode - Zip code of the person.
     * @property {string} country - Country of the person.
     * @property {string} fullName - Full name of the person.
     */
    static person(): Record<string, any> {
        return {
            firstName: GenerateData.firstName(),
            lastName: GenerateData.lastName(),
            email: GenerateData.email(),
            phoneNumber: GenerateData.phoneNumber(),
            age: faker.number.int({min: 0, max: 100}),
            gender: faker.person.sex(),
            address: GenerateData.address(),
            city: GenerateData.city(),
            zipCode: GenerateData.zipCode(),
            country: faker.location.country(),
            fullName: `${GenerateData.firstName()} ${GenerateData.lastName()}`
        }
    }

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
    static randomPick<T>(arr: T[]): T {
        return arr[randomInt(0, arr.length)];
    }
    
    /**
     * Generates a random numeric string of the specified length.
     * @param {number} numberLen - The length of the numeric string to generate.
     * @returns {string} A random numeric string.
     */
    static randomNumber(numberLen: number): string {
        let result = faker.string.numeric(numberLen);
        return result;
    }
    /**
     * Generates a random alphabetic string of the specified length.
     * @param {number} strLen - The length of the alphabetic string to generate.
     * @returns {string} A random alphabetic string.
     */
    static randomString(strLen: number): string {
        let result = faker.string.alpha({ length: strLen });
        return result;
    }
    
    /**
     * Generates a random alphanumeric string of the specified length.
     * @param {number} alphaNumLen - The length of the alphanumeric string to generate.
     * @returns {string} A random alphanumeric string.
     */
    static randomAlphaNumeric(alphaNumLen: number): string {
        let result = faker.string.alphanumeric({ length: alphaNumLen });
        return result;
    }
    /**
     * Generates a random string of the specified length, consisting of characters from the provided character set.
     * @param {number} strLen - The length of the random string to generate.
     * @param {string} charSet - A string containing the set of characters to use for generating the random string.
     * @returns {string} A random string generated from the specified character set.
     */
    static randomStringFromCharSet(strLen: number, charSet: string): string {
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
    static randomBoolean(): boolean {
        return randomInt(0, 2) === 1;
    }
    /**
     * Generates a random integer between the specified minimum and maximum values (inclusive).
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {number} A random integer between min and max.
     */
    static randomIntInRange(min: number, max: number): number {
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
    static randomFloatInRange(min: number, max: number): number {
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
    static randomDateInRange(start: Date, end: Date): Date {
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
    static randomDateLessThanToday(): Date {
      const randomDate = faker.date.past();
      return randomDate;
    }
    
    /**
     * Generate a randome date greater than today
     */
    static randomDateGreaterThanToday(): Date {
      const randomDate = faker.date.future();
      return randomDate;
    }
    
    /**
     * Generates a unique account name from random first and last names and the current timestamp.
     * @returns {string} A generated account name.
     */
    static generateAccountName(): string {
        return faker.person.firstName() + '_' + faker.person.lastName() + '_' + Date.now();
    }
    
    /**
     * Generates a memorable random account password.
     * @param {number} passwordLen to be generate, default[passwordLen=12]
     * @returns {string} A generated length-character password.
     */
    static generateAccountPassword(passwordLen: number = 12): string {
        return faker.internet.password({ length: passwordLen, memorable: true, pattern: /[A-Za-z0-9!@#$%^&*]/ });
    }
    
    /**
     * Generates a random account email address for the specified provider.
     * @param {string} emailProvider - The email domain or provider to use.
     * @returns {string} A generated account email address.
     */
    static generateAccountEmail(emailProvider: string): string {
        return faker.internet.email({ 
          firstName: faker.person.firstName(), 
          lastName: faker.person.lastName(),
          provider: emailProvider
        });
    } 

    /**
     * Formats a given date to the specified format.
     * @param {Date} date - The date to format.
     * @param {string} format - The desired format (e.g., 'YYYY-MM-DD HH:mm:ss').
     * @returns {string} The formatted date string.
     * @summary
     * This method takes a Date object and a format string as input. It extracts the year, month, day, hours, minutes, and seconds from the date and replaces the corresponding placeholders in the format string with these values. The resulting formatted date string is then returned.
     * @example
     * const date = new Date();
     * const formattedDate = GenerateData.formatDateToExpectedFormat(date, 'YYYY-MM-DD HH:mm:ss');
     * console.log(formattedDate); // e.g., '2024-06-15 14:30:45'
     * const formattedDate2 = GenerateData.formatDateToExpectedFormat(date, 'MM/DD/YYYY');
     * console.log(formattedDate2); // e.g., '06/15/2024'
     * @note
     * The format string can include the following placeholders:
     * - 'YYYY' for the full year (e.g., 2024)
     * - 'MM' for the month (01-12)
     * - 'DD' for the day of the month (01-31)
     * - 'HH' for hours in 24-hour format (00-23)
     * - 'mm' for minutes (00-59)
     * - 'ss' for seconds (00-59)
     */
    /*
     */
    static formatDateToExpectedFormat(date: Date, format: string): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format.replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
}
