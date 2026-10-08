import os from 'node:os';
import { randomInt } from 'node:crypto';
import { execSync } from 'node:child_process';
import { test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseCSV } from 'csv-parse/sync';
import { globalVariables } from '../../../config/community/globalVariables';


/** A scalar value that can be written to a CSV field. */
export type CSVFieldValue = string | number | boolean;

/** A CSV row keyed by its column headers. */
export type CSVRow = Record<string, CSVFieldValue>;

/** Format a timestamp in the runner machine timezone, including its UTC offset. */
export function formatLocalTime(date: Date): string {
  const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
  const offset = -date.getTimezoneOffset();
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  const localDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const localTime = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  return `${localDate} ${localTime} UTC${offsetSign}${offsetHours}:${offsetMinutes}`;
}


/**
 * Returns an object containing information about the system's CPU.
 * @returns {{cores: number, model: string | undefined, speedMHz: number | undefined}}
 * @example
 * const cpuInfo = getCpuInfo();
 * console.log(`${cpuInfo.cores} cores, ${cpuInfo.model} model, ${cpuInfo.speedMHz} speedMHz`);
 */
export function getCpuInfo(): { cores: number; model: string | undefined; speedMHz: number | undefined; } {
  const cpus = os.cpus();
  return {
    cores: cpus.length,
    model: cpus[0]?.model,
    speedMHz: cpus[0]?.speed
  };
}



/**
 * Returns an object containing the current horizontal and vertical resolution of the system's primary display on Windows systems.
 * If the system is not running Windows, or if the command fails for any reason, returns an object with width and height set to defaults (1270x720).
 * @returns {{width: number, height: number}}
 * @example
 * const screenSize = getScreenSizeWindows();
 * console.log(`${screenSize.width}x${screenSize.height}`);
 */
export function getScreenSizeWindows(): { width: number; height: number; } {
  try {
    const output = execSync(
      'powershell -command "& {(Get-CimInstance -ClassName Win32_VideoController).CurrentHorizontalResolution, (Get-CimInstance -ClassName Win32_VideoController).CurrentVerticalResolution}"',
      { encoding: 'utf-8' }
    );

    const [width, height] = output.trim().split(/\s+/).map(Number);
    return { width, height };
  } catch {
    //return null;
    return { width: 1270, height: 720 };
  }
}


/**
 * Returns an object containing the current horizontal and vertical resolution of the system's primary display on macOS systems.
 * If the system is not running macOS, or if the command fails for any reason, returns an object with width and height set to defaults (1270x720).
 * @returns {{width: number, height: number}}
 * @example
 * const screenSize = getScreenSizeMac();
 * console.log(`${screenSize.width}x${screenSize.height}`);
 */
export function getScreenSizeMac(): { width: number; height: number; } {
  try {
    const result = execSync(
      "system_profiler SPDisplaysDataType | awk '/Resolution/ {print $2, $4}'",
      { encoding: 'utf-8' }
    ).trim();
    const [width, height] = result.split(' ').map(Number);
    return { width, height };
  } catch {
    //return null;
    return { width: 1270, height: 720 };
  }
}

/**
 * Returns an object containing the current horizontal and vertical resolution of the system's primary display on Linux systems.
 * If the system is not running Linux, or if the command fails for any reason, returns an object with width and height set to defaults (1270x720).
 * @returns {{width: number, height: number}}
 * @example
 * const screenSize = getScreenSizeLinux();
 * console.log(`${screenSize.width}x${screenSize.height}`);
 */
export function getScreenSizeLinux(): { width: number; height: number; } {
  try {
    const output = execSync("xrandr | grep '*' | head -1", { encoding: 'utf-8' });
    const match = new RegExp(/(\d+)x(\d+)/).exec(output);
    if (match) {
      return { width: Number.parseInt(match[1]), height: Number.parseInt(match[2]) };
    }
    else {
      //return null;
      return { width: 1270, height: 720 };
    }
  } catch {
    //return null;
    return { width: 1270, height: 720 };
  }
}

/**
 * Returns an object containing the current horizontal and vertical resolution of the system's primary display.
 * The implementation varies depending on the operating system:
 * - On Windows, it returns the resolution from the Win32_VideoController class.
 * - On macOS, it returns the resolution from the SPDisplaysDataType.
 * - On Linux, it returns the resolution from xrandr.
 * If the system is not running Windows, macOS, or Linux, or if the command fails for any reason, returns an object with width and height set to defaults (1270x720).
 * @returns {{width: number, height: number}}
 * @example
 * const screenSize = getScreenSize();
 * console.log(`${screenSize.width}x${screenSize.height}`);
 */
export function getScreenSize(): { width: number; height: number; } {
  const platform = os.platform();

  if (platform === 'win32') return getScreenSizeWindows();
  if (platform === 'darwin') return getScreenSizeMac();
  if (platform === 'linux') return getScreenSizeLinux();

  //return null;
  return getScreenSizeWindows();
}

/**
 * Skips a test if the current environment matches one of the specified profiles.
 * @param {string | string[]} profile - A single profile or an array of profiles to check against the current environment.
 * @example
 * ffForNotRunTest("dev");
 * ffForNotRunTest(["dev", "stg"]);
 */
export function ffForNotRunTest(profile: string | string[]) {
  test.skip(profile.includes(process.env.RUN_ENV as string), `Skipped running current test for environemnt in specified profile[${profile}].`);
}

/**
 * Writes a test annotation with the given category and value.
 * @param {string} category - The category of the annotation.
 * @param {string} annotationValue - The value of the annotation.
 * @example
 * writeTestAnnotation('Browser', '[Firefox]');
 */

export function writeTestAnnotation(category: string, annotationValue: string) {
  test.info().annotations.push({ type: category, description: annotationValue });
}

/**
   * Recursively traverses a test result object and extracts all failed test steps.
   * @param {Object} result - The test result object to traverse.
   * @param {string} [parentTitle=''] - The parent title of the current object being traversed.
   */
export function getTestResultObject(result: any, testTitle: string = ''): any {
    if (result.suites) {
      for (const parentSuite of result.suites) {
        for (const suite of parentSuite.suites) {
          for (const spec of suite.specs) {
            if (spec.title === testTitle) {
              return spec;
            }
          }
        }
      }
    }
    return null;
  }

/**
 * Extracts all failed test steps from a given test result file.
 * @param {string} filePath - The path to the test result file.
 * @returns {Array<{title: string, text: string}>} - An array of objects containing the title and text of each failed test step.
 */
export async function extractFailedTestSteps(filePath: string, testTitle: string = ''): Promise<Array<{ title: string; text: string; }>> {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const failedTestSteps: any = [];
  const testResult = getTestResultObject(data, testTitle);

  if (testResult?.tests?.[0]?.status === 'unexpected') {
    testResult.tests[0].results[0].steps.forEach((step: any) => {
      failedTestSteps.push({ title: step.title, error: step.error?.message });
    });
  }
  return removeColorCodesFromString(failedTestSteps);
}

/**
 * Removes ANSI color codes from a string or recursively from an object or array.
 * @param {any} obj - The string, object, or array to remove color codes from.
 * @returns {any} - The resulting string, object, or array with color codes removed.
 */
export function removeColorCodesFromString(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replaceAll(/\x1B\[[0-9;]*m/g, '');
  } else if (Array.isArray(obj)) {
    return obj.map((item: any) => removeColorCodesFromString(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    Object.keys(obj).forEach((key) => {
      result[key] = removeColorCodesFromString(obj[key]);
    });
    return result;
  }
  return obj;
}

interface SelectionResult {
  isAll: boolean;
  rowSet: Set<number>;
  maxRow: number;
}

/**
 * Helper to expand ranges like [1, 3, "8-10"]
 */
function parseRowSelection(input: (number | string)[]): SelectionResult {
  const isAll = input.some(s => typeof s === 'string' && s.toLowerCase() === 'all');
  
  if (isAll) {
    return { isAll: true, rowSet: new Set(), maxRow: Infinity };
  }

  const rowSet = new Set<number>();
  input.forEach((item) => {
    if (typeof item === 'number') {
      rowSet.add(item);
    } else if (typeof item === 'string' && item.includes('-')) {
      const [start, end] = item.split('-').map(Number);
      for (let i = start; i <= end; i++) rowSet.add(i);
    }
  });

  const maxRow = rowSet.size > 0 ? Math.max(...Array.from(rowSet)) : 0;
  return { isAll: false, rowSet, maxRow };
}

/**
 * Reads CSV rows. First row is header row. 
 * Reads CSV rows based on a range [1, 3, "5-10"] or ['All']. row index starts from 1 (excluding header row).
 * @param {string} filepath - The path to the CSV file.
 * @param {(number | string)[]} selection - An array specifying which rows to read. Can include individual row numbers, ranges (e.g., "5-10"), or 'All'.
 * @returns {Promise<any[]>} - A promise that resolves to an array of objects representing the selected rows. 
 * Each object maps column headers to their corresponding values.
 * @example
 * const data = await readDataFromFile('./data/dataDriven/webpage.csv', [1, 3, "5-10"]);
  console.log(data);
  const allData = await readDataFromFile('./data/dataDriven/webpage.csv', ['All']);
  console.log(allData);
 */
export function readDataFromFile(
  filepath: string,
  selection: (number | string)[] = ['All'] // Set default value here
): Record<string, any> {
  const { isAll, rowSet } = parseRowSelection(selection);
  const records: any[] = [];
  let currentRow = 1;

  const parser = fs.readFileSync(filepath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const fields = line.split(',');
      const record: any = {};
      fields.forEach((field, index) => {
        record[`column${index}`] = field;
      });
      return record;
    });
  

  for (const record of parser) {
    if (isAll || rowSet.has(currentRow)) {
      // The Proxy ensures that if data.nonExistentColumn is called, it throws an error.
      const protectedRecord = new Proxy(record, {
        get(target, prop) {
          if (typeof prop === 'string' && !(prop in target)) {
            throw new Error(`Column "${prop}" does not exist in the CSV file.`);
          }
          return target[prop];
        }
      });
      records.push(protectedRecord);
    }

    // Performance optimization: kill the stream once we hit the max requested row
    // if (!isAll && currentRow >= maxRow) {
    //   parser.destroy();
    //   break;
    // }
    
    currentRow++;
  }

  return records;
}

/**
 * Compares two strings for equality, ignoring case.
 * @param {string} str1 - The first string to compare.
 * @param {string} str2 - The second string to compare.
 * @returns {boolean} - Returns true if the strings are equal (case-insensitive), false otherwise.
 * @throws {Error} - Throws an error if either argument is undefined or not a string.
 * @example
 * const result = equalsIgnoreCase('Hello', 'hello'); // true
 */

export function equalsIgnoreCase(str1: string, str2: string): boolean {
  if (str1 === undefined || str2 === undefined) {
    throw new Error(`Both arguments[${str1}, ${str2}] must be defined and not empty`);
  }
  if (typeof str1 !== 'string' || typeof str2 !== 'string') {
    throw new TypeError('Both arguments must be strings');
  }

  return str1.toLowerCase() === str2.toLowerCase();
}

  /**
   * Replaces locator tokens with their configured values.
   * Each property name in `key` is treated as a literal string and every occurrence
   * is replaced, making this suitable for parameterized CSS or XPath selectors.
   * @param {string} locator - The locator string containing replacement tokens.
   * @param {Record<string, string>} key - A map of literal tokens to replacement values.
   * @returns {string} The locator string after all replacements are applied.
   * @example
   * const locator = redefineTestLocator('#user-{id}', { '{id}': '42' });
   * // '#user-42'
   */
  export function redefineTestLocator(locator: string, key: Record<string, string>): string {
    return Object.entries(key).reduce(
      (updatedLocator, [token, replacement]) => updatedLocator.replaceAll(token, replacement),
      locator
    );
  }

/**
 * Reads selected rows from a CSV file using the first row as headers by default.
 * Row numbers are one-based and may be individual values, ranges, or 'all'.
 * @param {string} file - The CSV file path, resolved relative to the current working directory.
 * @param {(string | number) | (string | number)[]} rows - Row numbers, ranges such as '2-4', or 'all'.
 * @param {boolean} isIncludeHeaders - Whether the first row should be returned as data instead of headers.
 * @returns {Array<Record<string, string>>} The selected CSV rows.
 * @example
 * const users = readCsvDataFile('./data/users.csv', [1, '3-4']);
 */
export function readCsvDataFile(file: string, rows: (string | number) | (string | number)[] = [], isIncludeHeaders: boolean = false): Array<Record<string, string>> {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const records = parseCSV(fs.readFileSync(filePath, { encoding: 'utf-8' }), {
        columns: !isIncludeHeaders, // Use first row as header if isIncludeHeaders is false
        skip_empty_lines: true,
        trim: true
    });

    // Use a Set to avoid duplicate records
    const selectedRecords = new Set();

    // Normalize rows to always be an array
    const indicesArray = Array.isArray(rows) ? rows : [rows];

    // If 'all' is specified or no row indices are provided, return all records
    if (indicesArray.length === 0 || 
        indicesArray.some(rowIndex => typeof rowIndex === 'string' && rowIndex.toLowerCase() === 'all')) {
        // Return all records
        return records.map((record: any) => record as Record<string, string>);
    }

    // Helper function to add rows based on the range or individual indices
    const addRows = (indices: number[]) => {
        for (const index of indices) {
            // Convert from 1-based to 0-based
            const zeroBasedIndex = index - 1;
            if (zeroBasedIndex >= 0 && zeroBasedIndex < records.length) {
                // Add valid record
                selectedRecords.add(records[zeroBasedIndex]);
            }
        }
    };

    // Process each row index
    for (const rowIndex of indicesArray) {
        if (typeof rowIndex === 'string' && rowIndex.includes('-')) {
            // Split and convert to numbers
            const [start, end] = rowIndex.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                // Add each row in the range
                addRows([i]);
            }
        } else if (typeof rowIndex === 'number') {
            // If it's a number, process it directly
            addRows([rowIndex]);
        }
    }

    // Convert Set to array and return
    return Array.from(selectedRecords) as Array<Record<string, string>>;
}

  /**
   * Appends one row to a CSV file, creating the file and its parent directory when needed.
   * Existing rows with the same first-column value are not duplicated.
   * @param {string} filePath - The path to the CSV file.
   * @param {CSVRow} fields - The values to append, keyed by column header.
   */
export function appendCSVData(
  filePath: string,
  fields: CSVRow
): void {
  appendCSVDataRows(filePath, [fields]);
}

/**
 * Appends multiple rows to a CSV file, creating the file and its parent directory when needed.
 * Existing rows with the same first-column value are not duplicated.
 * @param {string} filePath - The path to the CSV file.
 * @param {CSVRow[]} rows - The rows to append, keyed by column header.
 */
export function appendCSVDataRows(
  filePath: string,
  rows: CSVRow[]
): void {
  if (rows.length === 0) {
    return;
  }

  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const fileExists = fs.existsSync(filePath);
  const fileContent = fileExists ? fs.readFileSync(filePath, 'utf8') : '';
  const lineEnding = fileContent.match(/\r\n|\n|\r/)?.[0] ?? '\n';
  const rowSeparator = fileContent.length > 0 && !/[\r\n]$/.test(fileContent) ? lineEnding : '';
  const parsedRows = fileExists ? parseCSV(fileContent, { bom: true, skip_empty_lines: true, trim: true }) : [];

  const existingHeaders = parsedRows.length > 0 ? (parsedRows[0] as string[]).map((header) => String(header).trim()) : [];
  const normalizedRows = rows.map((fields) => Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key.trim(), value])
  ) as CSVRow);

  const headers = existingHeaders.length > 0
    ? existingHeaders
    : Object.keys(normalizedRows[0]).map((key) => key.trim());
  const outputRows = normalizedRows.map((fields) => headers.map((header) => {
    const matchingKey = Object.keys(fields).find((fieldName) => fieldName.trim() === header.trim());
    return matchingKey !== undefined ? String(fields[matchingKey] ?? '') : '';
  }));

  if (existingHeaders.length > 0) {
    const firstHeader = headers[0];
    const existingValues = new Set(parsedRows.slice(1).map((record) => String((record as string[])[0] ?? '').trim()));
    const firstColumnIndex = headers.indexOf(firstHeader);
    const rowsToWrite = outputRows.filter((row) => {
      const firstValue = String(row[firstColumnIndex] ?? '').trim();
      return !existingValues.has(firstValue);
    });

    if (rowsToWrite.length === 0) {
      return;
    }

    fs.appendFileSync(filePath, `${rowSeparator}${rowsToWrite.map((row) => row.join(',')).join(lineEnding)}${lineEnding}`);
    return;
  }

  fs.appendFileSync(filePath, `${rowSeparator}${headers.join(',')}${lineEnding}${outputRows.map((row) => row.join(',')).join(lineEnding)}${lineEnding}`);
}

/**
 * Appends one row to a CSV file.
 * @param {string} csvFilePath - The path to the CSV file.
 * @param {Record<string, string | number | boolean>} fields - The values to append, keyed by column header.
 */
export function appendRowToCsv(
  csvFilePath: string,
  fields: Record<string, string | number | boolean>
): void {
  appendCSVData(csvFilePath, fields);
}



export { globalVariables };
