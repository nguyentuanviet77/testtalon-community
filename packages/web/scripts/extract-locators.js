#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const readline = require('node:readline/promises');

/** Shared classification rules and output sections, in keyword matching order. */
const SECTION_RULES = [
  { name: 'header', keywords: ['header'], tags: ['header'], roles: ['banner'] },
  { name: 'footer', keywords: ['footer'], tags: ['footer'], roles: ['contentinfo'] },
  { name: 'dashboard', keywords: ['dashboard'] },
  { name: 'navigation', keywords: ['nav'], tags: ['nav'], roles: ['navigation'] },
  { name: 'filters', keywords: ['filter', 'sidebar'] },
  { name: 'search', keywords: ['search'], tags: ['search'], roles: ['search'] },
  { name: 'jobResults', keywords: ['result', 'job'] },
  { name: 'pagination', keywords: ['pagination', 'paging', 'pager'] },
  { name: 'modal', keywords: ['modal', 'dialog'], tags: ['dialog'], roles: ['dialog', 'alertdialog'] },
  { name: 'general', keywords: [] },
  { name: 'alerts', keywords: ['alert', 'toast', 'notification'], roles: ['alert', 'status'] },
  { name: 'forms', keywords: ['form'], tags: ['form'], roles: ['form'] },
  { name: 'tables', keywords: ['table', 'grid'], tags: ['table'], roles: ['table', 'grid', 'treegrid'] },
  { name: 'tabs', keywords: ['tab'], roles: ['tablist'] },
  { name: 'menus', keywords: ['menu'], tags: ['menu'], roles: ['menu', 'menubar'] }
];

const HELP = `Usage: node packages/web/scripts/extract-locators.js --url <http(s) URL> [options]
       node packages/web/scripts/extract-locators.js --interactive [options]

  --interactive           Browse freely; Enter captures, exit closes the session
  --storage-state <file>   Load a saved Playwright authentication session
  --interactive-login     Open Chromium and wait for you to log in and press Enter
  --save-storage <file>    Save session state after successful page validation
  --wait-for <selector>    Require a visible, unique readiness element
  --timeout <ms>           Navigation/readiness timeout (default: 60000)
  --help                  Show this help

Output: object-repositories/gui/<actual-pagename>-gui.json, the kebab-case form of the page name (overwrites existing file)
Session paths are relative to the current working directory.
Automated form login is not supported yet.`;

/** Parses and validates CLI options before launching a browser. */
/** Repository file names are kebab-case (docs/internal naming conventions): "accCareer" becomes "acc-career". */
function toKebabCase(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/(\d)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-').toLowerCase();
}

function parseOptions(args) {
  const { values } = parseArgs({
    args,
    options: {
      url: { type: 'string' },
      interactive: { type: 'boolean', default: false },
      'storage-state': { type: 'string' },
      'interactive-login': { type: 'boolean', default: false },
      'save-storage': { type: 'string' },
      'wait-for': { type: 'string' },
      timeout: { type: 'string', default: '60000' },
      help: { type: 'boolean', default: false }
    }
  });
  if (values.help) return { help: true };
  if (values.interactive && values['interactive-login']) {
    throw new Error('Use --interactive or --interactive-login, not both.');
  }
  let url;
  try {
    if (values.url !== undefined || !values.interactive) url = new URL(values.url);
  } catch {
    throw new Error('--url is required and must be an absolute HTTP(S) URL. Use --help for usage.');
  }
  if (url && (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)) {
    throw new Error('--url must use HTTP(S) and must not contain embedded credentials.');
  }
  const timeout = Number(values.timeout);
  if (!Number.isSafeInteger(timeout) || timeout <= 0) {
    throw new Error('--timeout must be a positive integer in milliseconds.');
  }
  for (const name of ['storage-state', 'save-storage', 'wait-for']) {
    if (values[name] !== undefined && !values[name].trim()) {
      throw new Error(`--${name} must not be blank.`);
    }
  }
  if (values['storage-state']) {
    try {
      const state = JSON.parse(fs.readFileSync(values['storage-state'], 'utf8'));
      if (!state || !Array.isArray(state.cookies) || !Array.isArray(state.origins)) {
        throw new Error('Invalid Playwright storage-state structure.');
      }
    } catch {
      throw new Error('--storage-state must point to a readable Playwright storage-state JSON file.');
    }
  }
  return {
    url: url?.href,
    interactive: values.interactive,
    storageState: values['storage-state'],
    interactiveLogin: values['interactive-login'],
    saveStorage: values['save-storage'],
    waitFor: values['wait-for'],
    timeout
  };
}

/** Compares the requested route, ignoring trailing path slashes only. */
function isTargetUrl(actual, expected) {
  const current = new URL(actual);
  const target = new URL(expected);
  return current.origin === target.origin
    && current.pathname.replace(/\/+$/, '') === target.pathname.replace(/\/+$/, '')
    && current.search === target.search
    && current.hash === target.hash;
}

/** Waits for manual login without treating closed input as successful login. */
async function waitForLogin() {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  const controller = new AbortController();
  terminal.once('close', () => controller.abort());
  terminal.once('SIGINT', () => controller.abort());
  try {
    await terminal.question('Complete login in the browser, then press Enter here to validate the target page: ', {
      signal: controller.signal
    });
  } catch {
    throw new Error('Interactive login was cancelled. No output was saved.');
  } finally {
    terminal.close();
  }
}

/** Rejects HTTP failures, unexpected routes, and unready authenticated pages. */
async function validatePage(page, response, options) {
  if (response && response.status() >= 400) {
    throw new Error(`Target navigation returned HTTP ${response.status()}. Check access and authentication.`);
  }
  if (options.waitFor) {
    try {
      await page.locator(options.waitFor).waitFor({ state: 'visible', timeout: options.timeout });
    } catch {
      throw new Error('Readiness selector did not resolve to one visible element. Check login, selector, and page state.');
    }
  }
  if (!isTargetUrl(page.url(), options.url)) {
    throw new Error('The browser did not reach the requested URL. Login may have failed or expired; use the final intended URL.');
  }
  if (options.storageState || options.interactiveLogin) {
    const passwords = page.locator('input[type="password"]');
    for (let index = 0; index < await passwords.count(); index++) {
      if (await passwords.nth(index).isVisible()) {
        throw new Error('A password field is still visible. Authentication may be incomplete; no output was saved.');
      }
    }
  }
}

/**
 * Automated Locator Extraction Script for given page
 * Direct Node.js execution without test framework
 */

async function extractLocators(options) {
  if (options.interactive) return runInteractive(options);
  if (options.interactiveLogin && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new Error('--interactive-login requires an interactive terminal. Use --storage-state in CI.');
  }
  const browser = await chromium.launch({
    headless: !options.interactiveLogin
  });

  try {
    const context = await browser.newContext({ storageState: options.storageState });
    const page = await context.newPage();

    console.log('🔍 Navigating to Webapp page...');
    let response = await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
    if (options.interactiveLogin) {
      await waitForLogin();
      // Revisit the requested page to verify the new session actually grants access.
      response = await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
    }

    console.log('⏳ Waiting for page to stabilize...');
    await page.waitForTimeout(3000);
    await validatePage(page, response, options);

    return await capturePage(page, context, response, options);

  } catch (error) {
    console.error('❌ Error during extraction:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/** Keeps one browser session open for repeated captures of manually prepared pages. */
async function runInteractive(options) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('--interactive requires an interactive terminal.');
  }
  const browser = await chromium.launch({ headless: false });
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  const controller = new AbortController();
  terminal.once('close', () => controller.abort());
  terminal.once('SIGINT', () => controller.abort());
  browser.once('disconnected', () => controller.abort());
  const ask = (prompt) => terminal.question(prompt, { signal: controller.signal });
  try {
    const context = await browser.newContext({ storageState: options.storageState });
    const responses = new WeakMap();
    context.on('page', (page) => {
      page.on('response', (response) => {
        if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
          responses.set(page, response);
        }
      });
    });
    const initialPage = await context.newPage();
    if (options.url) {
      try {
        await initialPage.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
      } catch (error) {
        console.error(`Initial navigation failed: ${error.message}. You can navigate manually.`);
      }
    }
    console.log('Paste a URL in the browser, log in, and prepare the page. Return here to capture.');
    while (!controller.signal.aborted) {
      const command = (await ask('Press Enter to capture, or type exit to close: ')).trim().toLowerCase();
      if (command === 'exit') break;
      if (command) {
        console.log('Use Enter to capture or type exit.');
        continue;
      }
      try {
        const pages = context.pages().filter((page) => !page.isClosed());
        if (!pages.length) throw new Error('No open tabs. Open a page in the browser first.');
        let page = pages[0];
        if (pages.length > 1) {
          pages.forEach((tab, index) => console.log(`${index + 1}: ${tab.url()}`));
          const selection = (await ask('Select the tab number to capture (or exit): ')).trim();
          if (selection.toLowerCase() === 'exit') break;
          const index = Number(selection) - 1;
          if (!Number.isInteger(index) || !pages[index]) throw new Error('Invalid tab number.');
          page = pages[index];
        }
        const url = new URL(page.url());
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
          throw new Error('Navigate to an HTTP(S) page without embedded credentials before capturing.');
        }
        // The user chooses the current state, including login forms if desired.
        // Validate against this capture's URL, never the optional startup URL.
        await capturePage(page, context, responses.get(page), {
          ...options, url: url.href, storageState: undefined, interactiveLogin: false
        });
      } catch (error) {
        if (controller.signal.aborted) break;
        console.error(`Capture failed: ${error.message}. Prepare the page and try again.`);
      }
    }
  } catch (error) {
    if (!controller.signal.aborted) throw error;
  } finally {
    terminal.close();
    await browser.close();
  }
}

/** Extracts the prepared DOM without navigating or closing the browser. */
async function capturePage(page, context, response, options) {
    await validatePage(page, response, options);
    console.log('🔎 Extracting elements from page...');

    const elementsData = await page.evaluate((sectionRules) => {
      // Helper function to get best selector
      const getBestSelector = (element) => {
        try {
          // Strategy 1: ID attribute (most stable)
          if (element.id && element.id.trim() !== '') {
            return `#${element.id}`;
          }

          // Strategy 2: data-testid attribute
          if (element.dataset?.testid) {
            return `[data-testid="${element.dataset.testid}"]`;
          }

          // Strategy 3: name attribute
          if (element.name && element.tagName !== 'A' && element.tagName !== 'BUTTON') {
            return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
          }

          // Strategy 4: type + class combination
          if (element.type) {
            const mainClass = element.className?.split(' ')[0];
            if (mainClass && !mainClass.startsWith('ng-')) {
              return `${element.tagName.toLowerCase()}[type="${element.type}"].${mainClass}`;
            }
            return `${element.tagName.toLowerCase()}[type="${element.type}"]`;
          }

          // Strategy 5: aria-label
          if (element.ariaLabel && element.ariaLabel.trim() !== '') {
            return `[aria-label="${element.ariaLabel}"]`;
          }

          // Strategy 6: placeholder attribute
          if (element.placeholder && element.tagName.toLowerCase() === 'input') {
            return `${element.tagName.toLowerCase()}[placeholder="${element.placeholder}"]`;
          }

          // Strategy 7: class name (most specific)
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(c => !c.startsWith('ng-'));
            if (classes.length > 0) {
              return `.${classes[0]}`;
            }
          }

          // Strategy 8: role attribute
          if (element.role) {
            return `[role="${element.role}"]`;
          }

          return null;
        } catch (e) {
          console.warn(`Got exception with element strategy:`, e.message);
          return null;
        }
      };

      // Helper function to generate logical name
      const generateLogicalName = (element, index) => {
        const type = element.tagName.toLowerCase();
        let name = '';

        if (element.id && element.id.trim() !== '') {
          name = element.id;
        } else if (element.name && element.name.trim() !== '') {
          name = element.name;
        } else if (element.placeholder && element.placeholder.trim() !== '') {
          name = element.placeholder;
        } else if (element.ariaLabel && element.ariaLabel.trim() !== '') {
          name = element.ariaLabel;
        } else if (element.textContent && element.textContent.trim() !== '') {
          name = element.textContent.trim().slice(0, 30);
        }

        const cleanName = name
          .toLowerCase()
          .replaceAll(/[^\w\s]/g, '')
          .trim()
          .replaceAll(/\s+/g, '_')
          .split('_')
          .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
        return cleanName ? `${cleanName}_${typeCapitalized}` : `elem_${index}`;
      };

      // Use the nearest matching ancestor, checking at most ten levels.
      const identifySection = (element) => {
        let parent = element.parentElement;
        let depth = 0;

        while (parent && depth < 10) {
          const markers = `${parent.id || ''} ${parent.getAttribute('class') || ''}`.toLowerCase();
          const tag = parent.tagName.toLowerCase();
          const role = (parent.getAttribute('role') || '').toLowerCase();
          // Semantic containers take precedence over ID/class keyword guesses.
          const semanticRule = sectionRules.find((rule) => rule.roles?.includes(role) || rule.tags?.includes(tag));
          const rule = semanticRule || sectionRules.find((candidate) =>
            candidate.keywords.some((keyword) => markers.includes(keyword)));
          if (rule) return rule.name;

          parent = parent.parentElement;
          depth++;
        }

        return 'general';
      };

      const selectors =
        'input, button, a, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]';
      const allElements = Array.from(document.querySelectorAll(selectors));

      console.log(`Found ${allElements.length} total interactive elements`);

      const extracted = [];
      const seenSelectors = new Set();

      allElements.forEach((el, index) => {
        try {
          const selector = getBestSelector(el);
          const logicalName = generateLogicalName(el, index);
          const section = identifySection(el);

          if (
            selector &&
            !seenSelectors.has(selector) &&
            el.offsetParent !== null &&
            !logicalName.startsWith('elem_')
          ) {
            seenSelectors.add(selector);

            extracted.push({
              logicalName,
              locator: selector,
              type: el.tagName.toLowerCase(),
              section: section,
              text: (el.textContent || '').trim().slice(0, 60),
              ariaLabel: el.ariaLabel || ''
            });
          }
        } catch (e) {
          // Skip problematic elements
          console.warn(`⚠ Skipped problematic element:`, e.message);
        }
      });

      return extracted;
    }, SECTION_RULES);

    console.log(`✓ Extracted ${elementsData.length} unique elements`);

    // Use the final URL so redirects are reflected in the page name.
    const pagePath = new URL(page.url()).pathname.split('/').filter(Boolean).pop() || 'home';
    const actualPagename = decodeURIComponent(pagePath)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_') || 'home';

    // Organize by page and section
    const objectRepository = {
      [actualPagename]: Object.fromEntries(SECTION_RULES.map(({ name }) => [name, {}]))
    };

    const sectionMap = new Map();

    elementsData.forEach((el) => {
      const section = el.section || 'general';

      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }

      sectionMap.get(section).push(el);
      
      // Initialize section if it doesn't exist
      if (!objectRepository[actualPagename][section]) {
        objectRepository[actualPagename][section] = {};
      }
      
      objectRepository[actualPagename][section][el.logicalName] = el.locator;
    });

    // Recheck after extraction before writing either the session or repository.
    await validatePage(page, response, options);
    if (options.saveStorage) {
      const statePath = path.resolve(options.saveStorage);
      fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
      const state = await context.storageState({ indexedDB: true });
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2), { mode: 0o600 });
      fs.chmodSync(statePath, 0o600);
      console.log('✓ Saved browser session state.');
    }

    // Create directory if needed
    const dirPath = path.join(__dirname, '../object-repositories/gui');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Save to file
    const orPath = path.join(dirPath, `${toKebabCase(actualPagename)}-gui.json`);
    fs.writeFileSync(orPath, JSON.stringify(objectRepository, null, 2));

    console.log(`\n✅ Object Repository saved to: ${orPath}`);
    console.log('\n=== EXTRACTION SUMMARY ===');

    sectionMap.forEach((elements, section) => {
      console.log(`${section}: ${elements.length} elements`);
    });

    console.log('\n=== SAMPLE EXTRACTED LOCATORS ===');
    elementsData.slice(0, 15).forEach((el) => {
      console.log(`[${el.section}] ${el.logicalName}: ${el.locator}`);
    });

    console.log('\n✓ Extraction completed successfully!');

    return orPath;
}

if (require.main === module) {
  Promise.resolve().then(async () => {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) {
      console.log(HELP);
      return;
    }
    const filePath = await extractLocators(options);
    if (filePath) console.log(`\n📁 Object Repository file: ${filePath}`);
  }).catch((error) => {
    console.error('Extraction failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseOptions, isTargetUrl, validatePage, extractLocators };
