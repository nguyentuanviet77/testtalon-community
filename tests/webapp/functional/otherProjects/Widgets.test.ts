import { test, expect, type Page } from '@core/lib/BaseTest';
import { widgets } from '@objectRepositories/GUI/widgetsGUI.json';
import { playwrightDev } from '@objectRepositories/GUI/playwrightDevGUI.json';

// Accordion, tabs, slider, progress bar, date input and autocomplete are exercised on a local fixture page that is answered
// from inside the test with Playwright's `route` (no server, network or account). It is a fixture, not a playwright.dev feature.
// The last two scenarios use real interactive elements of the public site. Its address is PLAYWRIGHT_DEV_URL when set,
// otherwise https://playwright.dev; the project's baseURL belongs to your own application and is ignored here.
const fixtureOrigin = 'https://fixtures.example.test';
const publicSiteUrl = process.env.PLAYWRIGHT_DEV_URL ?? 'https://playwright.dev';

const widgetsPage = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Widgets (local fixture)</title></head>
<body>
  <h1>Widgets</h1>

  <section aria-label="Accordion">
    <h2><button id="accordion-trigger-1" type="button" aria-expanded="false" aria-controls="accordion-panel-1">Shipping</button></h2>
    <div id="accordion-panel-1" role="region" aria-labelledby="accordion-trigger-1" hidden>Orders ship within two working days.</div>
    <h2><button id="accordion-trigger-2" type="button" aria-expanded="false" aria-controls="accordion-panel-2">Returns</button></h2>
    <div id="accordion-panel-2" role="region" aria-labelledby="accordion-trigger-2" hidden>Items can be returned within thirty days.</div>
  </section>

  <section aria-label="Tabs">
    <div role="tablist" aria-label="Product information">
      <button id="tab-overview" role="tab" type="button" aria-selected="true" aria-controls="panel-overview">Overview</button>
      <button id="tab-details" role="tab" type="button" aria-selected="false" aria-controls="panel-details">Details</button>
    </div>
    <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">A compact notebook.</div>
    <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" hidden>One hundred pages, dotted.</div>
  </section>

  <section aria-label="Slider">
    <label for="volume">Volume</label>
    <input id="volume" type="range" min="0" max="10" step="1" value="3">
    <output id="volume-value" for="volume">3</output>
  </section>

  <section aria-label="Progress">
    <button id="start-upload" type="button">Start upload</button>
    <progress id="upload-progress" max="100" value="0" aria-label="Upload progress"></progress>
    <p id="upload-status" role="status">Idle</p>
  </section>

  <section aria-label="Date">
    <label for="start-date">Start date</label>
    <input id="start-date" type="date" min="2026-01-01">
    <p id="date-result" role="status">No date selected</p>
  </section>

  <section aria-label="Autocomplete">
    <label for="country">Country</label>
    <input id="country" role="combobox" aria-expanded="false" aria-controls="country-list" aria-autocomplete="list" autocomplete="off">
    <ul id="country-list" role="listbox" hidden></ul>
    <p id="country-result" role="status">Nothing selected</p>
  </section>

  <script>
    // accordion
    for (const trigger of document.querySelectorAll('[id^="accordion-trigger-"]')) {
      trigger.addEventListener('click', () => {
        const open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        document.getElementById(trigger.getAttribute('aria-controls')).hidden = open;
      });
    }
    // tabs
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      tab.addEventListener('click', () => {
        for (const other of document.querySelectorAll('[role="tab"]')) {
          const selected = other === tab;
          other.setAttribute('aria-selected', String(selected));
          document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
        }
      });
    }
    // slider
    const volume = document.querySelector('#volume');
    volume.addEventListener('input', () => { document.querySelector('#volume-value').textContent = volume.value; });
    // progress
    const progress = document.querySelector('#upload-progress');
    const status = document.querySelector('#upload-status');
    document.querySelector('#start-upload').addEventListener('click', event => {
      event.target.disabled = true;
      progress.value = 0;
      const timer = setInterval(() => {
        progress.value += 20;
        status.textContent = progress.value < 100 ? 'Uploading ' + progress.value + '%' : 'Upload complete';
        if (progress.value >= 100) { clearInterval(timer); event.target.disabled = false; }
      }, 40);
    });
    // date
    const date = document.querySelector('#start-date');
    date.addEventListener('change', () => {
      document.querySelector('#date-result').textContent = date.value ? 'Selected: ' + date.value : 'No date selected';
    });
    // autocomplete
    const countries = ['Jamaica', 'Japan', 'Jordan', 'Kenya', 'Kuwait'];
    const input = document.querySelector('#country');
    const list = document.querySelector('#country-list');
    let active = -1;
    function choose(name) {
      input.value = name;
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      document.querySelector('#country-result').textContent = 'Selected: ' + name;
    }
    function render() {
      list.replaceChildren();
      const query = input.value.trim().toLowerCase();
      const matches = query ? countries.filter(name => name.toLowerCase().startsWith(query)) : [];
      matches.forEach((name, index) => {
        const item = document.createElement('li');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(index === active));
        item.textContent = name;
        item.addEventListener('mousedown', event => { event.preventDefault(); choose(name); });
        list.append(item);
      });
      list.hidden = matches.length === 0;
      input.setAttribute('aria-expanded', String(matches.length > 0));
    }
    input.addEventListener('input', () => { active = -1; render(); });
    input.addEventListener('keydown', event => {
      const items = [...list.children];
      if (event.key === 'ArrowDown' && items.length) { active = (active + 1) % items.length; render(); }
      else if (event.key === 'Enter' && active >= 0 && items[active]) { event.preventDefault(); choose(items[active].textContent); }
      else if (event.key === 'Escape') { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    });
  </script>
</body>
</html>`;

/** Serves the widgets fixture for this test's browser context and opens it. */
async function openWidgets(page: Page): Promise<void> {
    await page.context().route(`${fixtureOrigin}/**`, route => route.fulfill({ contentType: 'text/html', body: widgetsPage }));
    await page.goto(`${fixtureOrigin}/widgets`);
}

test.describe('local fixture: widgets', () => {
    test.beforeEach(async ({ page, webActions }) => {
        await openWidgets(page);
        await webActions.waitForPageLoad();
    });

    test('an accordion section expands and collapses', { tag: ['@GUI', '@Smoke', '@Offline'] }, async ({ page, webActions }) => {
        const trigger = page.locator(widgets.accordionTrigger1);
        const panel = page.locator(widgets.accordionPanel1);
        await expect(panel).toBeHidden();
        await webActions.highlightAndClick(trigger);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
        await expect(panel).toHaveText('Orders ship within two working days.');
        await expect(page.locator(widgets.accordionPanel2)).toBeHidden();
        await webActions.highlightAndClick(trigger);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toBeHidden();
        await webActions.highlightAndClick(page.locator(widgets.accordionTrigger2));
        await expect(page.locator(widgets.accordionPanel2)).toHaveText('Items can be returned within thirty days.');
        await expect(panel).toBeHidden();
    });

    test('tabs switch the active panel', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        await expect(page.locator(widgets.tabOverview)).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator(widgets.panelOverview)).toBeVisible();
        await expect(page.locator(widgets.panelDetails)).toBeHidden();
        await webActions.highlightAndClick(page.locator(widgets.tabDetails));
        await expect(page.locator(widgets.tabDetails)).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator(widgets.tabOverview)).toHaveAttribute('aria-selected', 'false');
        await expect(page.locator(widgets.panelDetails)).toHaveText('One hundred pages, dotted.');
        await expect(page.locator(widgets.panelOverview)).toBeHidden();
    });

    test('a slider changes value by typing and by keyboard', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const slider = page.locator(widgets.slider);
        await expect(page.locator(widgets.sliderValue)).toHaveText('3');
        await webActions.highlightAndFill(slider, '7');
        await expect(slider).toHaveValue('7');
        await expect(page.locator(widgets.sliderValue)).toHaveText('7');
        await slider.press('ArrowRight');
        await expect(page.locator(widgets.sliderValue)).toHaveText('8');
        await slider.press('End');
        await expect(page.locator(widgets.sliderValue)).toHaveText('10');
        await slider.press('Home');
        await expect(slider).toHaveValue('0');
    });

    test('a progress bar advances to complete after the upload starts', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const progress = page.locator(widgets.uploadProgress);
        await expect(progress).toHaveJSProperty('value', 0);
        await expect(page.locator(widgets.uploadStatus)).toHaveText('Idle');
        await webActions.highlightAndClick(page.locator(widgets.startUploadButton));
        await expect(page.locator(widgets.uploadStatus)).toHaveText('Upload complete');
        await expect(progress).toHaveJSProperty('value', 100);
        await expect(page.locator(widgets.startUploadButton)).toBeEnabled();
    });

    test('a date input accepts a date and reports it', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const date = page.locator(widgets.dateInput);
        await webActions.highlightAndFill(date, '2026-12-31');
        await expect(date).toHaveValue('2026-12-31');
        await expect(page.locator(widgets.dateResult)).toHaveText('Selected: 2026-12-31');
    });

    test('a date before the minimum is flagged as invalid', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const date = page.locator(widgets.dateInput);
        await webActions.highlightAndFill(date, '2025-12-31');
        expect(await date.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
        await webActions.highlightAndFill(date, '2026-01-01');
        expect(await date.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(true);
    });

    test('autocomplete suggests matches and a suggestion can be selected', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const input = page.locator(widgets.countryInput);
        await webActions.highlightAndType(input, 'ja');
        const options = page.locator(widgets.countryOption);
        await expect(options).toHaveText(['Jamaica', 'Japan']);
        await webActions.highlightAndClick(options.filter({ hasText: widgets.japanOptionText }));
        await expect(input).toHaveValue('Japan');
        await expect(page.locator(widgets.countryResult)).toHaveText('Selected: Japan');
        await expect(page.locator(widgets.countryList)).toBeHidden();
    });

    test('autocomplete can be completed with the keyboard', { tag: ['@GUI', '@Offline'] }, async ({ page, webActions }) => {
        const input = page.locator(widgets.countryInput);
        await webActions.highlightAndType(input, 'k');
        await expect(page.locator(widgets.countryOption)).toHaveText(['Kenya', 'Kuwait']);
        await input.press('ArrowDown');
        await input.press('ArrowDown');
        await input.press('Enter');
        await expect(input).toHaveValue('Kuwait');
        await expect(page.locator(widgets.countryResult)).toHaveText('Selected: Kuwait');
    });
});

test.describe('real website: playwright.dev', () => {
    test('the package-manager tabs on the installation page switch the install command', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
        await page.goto(`${publicSiteUrl}/docs/intro`);
        await webActions.waitForPageLoad();
        const tabs = page.getByRole('tablist').first();
        const commandPanel = page.getByRole('tabpanel').first();
        // exact: true matters: the accessible name "npm" is also a substring of "pnpm".
        const npm = tabs.getByRole('tab', { name: playwrightDev.npmTab.accessibleName, exact: true });
        const yarn = tabs.getByRole('tab', { name: playwrightDev.yarnTab.accessibleName, exact: true });
        const pnpm = tabs.getByRole('tab', { name: playwrightDev.pnpmTab.accessibleName, exact: true });

        await expect(npm).toHaveAttribute('aria-selected', 'true');
        await expect(commandPanel).toContainText('npm init playwright@latest');
        await webActions.highlightAndClick(yarn);
        await expect(yarn).toHaveAttribute('aria-selected', 'true');
        await expect(npm).toHaveAttribute('aria-selected', 'false');
        await expect(commandPanel).toContainText('yarn create playwright');
        await webActions.highlightAndClick(pnpm);
        await expect(pnpm).toHaveAttribute('aria-selected', 'true');
        await expect(commandPanel).toContainText('pnpm create playwright');
    });

    test('a category in the documentation sidebar expands and collapses', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
        await page.goto(`${publicSiteUrl}/docs/intro`);
        await webActions.waitForPageLoad();
        const sidebar = page.getByRole('navigation', { name: playwrightDev.docsSidebar.accessibleName });
        const category = sidebar.getByRole('button', { name: playwrightDev.migrationCategory.accessibleName });
        const nestedLink = sidebar.getByRole('link', { name: playwrightDev.migrationPuppeteerLink.accessibleName });

        await expect(category).toHaveAttribute('aria-expanded', 'false');
        await expect(nestedLink).toBeHidden();
        await webActions.highlightAndClick(category);
        await expect(category).toHaveAttribute('aria-expanded', 'true');
        await expect(nestedLink).toBeVisible();
        await webActions.highlightAndClick(category);
        await expect(category).toHaveAttribute('aria-expanded', 'false');
        await expect(nestedLink).toBeHidden();
    });
});
