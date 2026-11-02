# XPath Locator Strategies for Web Automation

[Documentation home](../README.md)

*Reference guide: contains, sibling, ancestor, parent, and XPath axes*

*Source reference: Guru99 — "XPath Contains: Text, Following Sibling & Ancestor in Selenium" (guru99.com). Summarized and reorganized by session for quick lookup, with notes on applying each pattern in a Playwright + TypeScript project.*

## 1. Contains() — Partial Text and Attribute Matching

The contains() function finds elements whose text or attribute value partially matches a given string, rather than requiring an exact match. This is the most commonly used function when an element's full text or class name is dynamic, long, or partly unpredictable.

**Syntax**

``` xpath
//tag[contains(@attribute, 'value')]
//tag[contains(text(), 'value')]
```

**Example — match a link whose text contains "SAP M"**

``` xpath
//h4/a[contains(text(),'SAP M')]
```

**Example — match a div whose class includes "menu"**

``` xpath
//div[contains(@class,'menu')]
```

*In Playwright/TypeScript, prefer built-in partial-match locators over raw XPath where possible: page.getByText('SAP M', { exact: false }) or page.locator("\[class\*='menu'\]"). Reach for XPath contains() when the built-in locators can't express the relationship you need.*

## 2. Following-Sibling — Elements at the Same Tree Level

following-sibling finds an element that sits after another element under the same parent. It's useful when you can reliably locate a nearby label or icon, and the actual target element (e.g., a value or input) sits next to it in the DOM but has no unique identifier of its own.

**Syntax**

``` xpath
//tag[condition]/following-sibling::tag
```

**Example — get the heading that follows a specific link**

``` xpath
//a[@href='/accounting.html']/following-sibling::h4
```

**Example — get all sibling tiles after the one whose link text is 'SELENIUM'**

``` xpath
//h2[contains(.,'A few of our most popular courses')]/parent::div
//a[normalize-space(.)='SELENIUM']/parent::div
/following-sibling::div[contains(@class,'rt-grid-2')]
```

*In Playwright, the equivalent relative-locator approach uses page.locator('h4').locator('xpath=following-sibling::\*') or, more idiomatically, Playwright's rightOf()/locator chaining. XPath sibling axes are still the most precise option for complex multi-level relationships like the example above.*

## 3. Ancestor — Finding an Element via Its Parent Structure

ancestor walks up the DOM tree from a known child element to locate a containing parent, grandparent, or higher-level wrapper. This is useful when the element you actually want to interact with has no distinguishing attributes, but a nested child element (e.g., specific text) does.

**Syntax**

``` xpath
//tag[condition]/ancestor::tag[@attribute='value']
```

**Example — find the ancestor div of a link with text 'SELENIUM', then get its following sibling tiles**

``` xpath
//div[.//a[text()='SELENIUM']]/ancestor::div[@class='rt-grid-2 rt-omega']/following-sibling::div
```

*This pattern (find by content, then climb to a stable ancestor) is one of the most durable ways to locate elements in a Playwright suite when component wrapper classes are stable but leaf-level text/attributes change often.*

## 4. AND / OR — Combining Multiple Conditions

AND requires every condition in the expression to be true before an element matches. OR requires only one of the conditions to be true. Combining conditions narrows down or broadens a match without needing multiple separate locators.

**Syntax**

``` xpath
//tag[@attr1='value1' and @attr2='value2']
//tag[@attr1='value1' or @attr2='value2']
```

**Example — match either a reset button OR a specific name attribute**

``` xpath
//*[@type='submit' or @name='btnReset']
```

**Example — match a submit button AND a specific name attribute**

``` xpath
//input[@type='submit' and @name='btnLogin']
```

*Use AND to tighten a locator that's currently matching more than one element; use OR when the same logical element can render with slightly different attributes across pages or states.*

## 5. Parent — Getting the Containing Element

The parent axis retrieves the direct parent node of the current element. It's the single-level version of ancestor, useful when you only need to step up one level in the DOM (e.g., to click a wrapping container or check a sibling within the same parent).

**Syntax**

``` xpath
//tag[condition]/parent::tag
```

**Example**

``` xpath
//*[@id='rt-feature']/parent::div
```

## 6. Starts-with() — Matching Dynamic Attribute Prefixes

starts-with() matches elements whose attribute begins with a fixed prefix, even when the rest of the value changes on every page load or user action (common with auto-generated IDs like message-1234 or toast-98213).

**Syntax**

``` xpath
//tag[starts-with(@attribute, 'prefix')]
```

**Example — match a label whose id starts with "message"**

``` xpath
//label[starts-with(@id,'message')]
```

*This is one of the most useful patterns for frameworks (React, Angular, Vue) that auto-generate unique suffixes on IDs/classes at build or render time — exact-match locators break on these, starts-with() does not.*

## 7. XPath Axes — following, preceding, descendant

XPath axes let you navigate the DOM tree relative to a node in any direction, beyond simple parent/sibling/ancestor. The three most commonly used are:

- **following:** Returns every matching element that appears anywhere after the current node in document order (not limited to siblings).

``` xpath
//input[@type='text']/following::input
```

- **preceding:** Returns every matching element that appears anywhere before the current node in document order.

``` xpath
//input[@type='submit']/preceding::input
```

- **descendant:** Returns every matching element nested inside the current node, at any depth (children, grandchildren, etc.).

``` xpath
//div[@id='rt-feature']/descendant::a
```

*following/preceding search the whole rest of the document, not just siblings — they can be slow and over-broad on large pages. Prefer descendant or following-sibling when you can, and reserve following/preceding for cases where no closer relationship exists.*

## 8. Quick Reference Cheat Sheet

All patterns above, side by side, for fast lookup:

| **Function / Axis** | **Purpose** | **Example XPath** |
|----|----|----|
| **contains()** | Match elements whose text or attribute partially contains a value | `//button[contains(text(),'Submit')]` |
| **following-sibling** | Find an element that comes after another element at the same tree level | `//label[text()='Email']/following-sibling::input` |
| **ancestor** | Find an element up the tree from a known child element | `//span[text()='Error']/ancestor::div[@class='form-group']` |
| **parent** | Get the direct parent of the current node | `//input[@id='email']/parent::div` |
| **and / or** | Combine two conditions in one expression | `//input[@type='submit' and @name='btnLogin']` |
| **starts-with()** | Match elements whose attribute begins with a value (useful for dynamic IDs) | `//label[starts-with(@id,'message')]` |
| **following** | Get elements that appear anywhere after the current node in the document | `//input[@type='text']/following::input` |
| **preceding** | Get elements that appear anywhere before the current node in the document | `//input[@type='submit']/preceding::input` |
| **descendant** | Get all nested elements inside the current node, at any depth | `//div[@id='rt-feature']/descendant::a` |

## 9. Locator Strategies Beyond XPath

XPath is powerful but it's only one of several ways to identify a web element. In practice, most teams reach for XPath last, not first, because faster and more resilient options usually cover the same need.

### 9.1 Basic Attribute Locators (classic Selenium-style)

These are the original WebDriver locator strategies, available in any Selenium or Playwright project. They match on a single HTML attribute or tag:

- **ID:** Matches the element's unique id attribute — fastest and most reliable when the app assigns stable IDs.

``` text
#login-button (CSS)
By.id("login-button") (Selenium Java)
```

- **Name:** Matches the name attribute, common on form fields.

``` text
[name='email'] (CSS)
By.name("email") (Selenium Java)
```

- **Class Name:** Matches one CSS class. Fragile alone since many elements often share the same class.

``` text
.btn-primary (CSS)
```

- **Tag Name:** Matches every element of a given HTML tag — rarely specific enough on its own.

``` text
button (CSS)
```

- **Link Text / Partial Link Text:** Match a link by its exact or partial visible text — a Selenium-specific strategy with no direct Playwright equivalent (use getByText or getByRole('link') instead).

``` text
By.linkText("Sign in")
By.partialLinkText("Sign")
```

### 9.2 CSS Selectors

CSS selectors identify elements the same way stylesheets do — by tag, id, class, attribute, or position among siblings. They're generally faster to execute and easier to read than XPath, but unlike XPath they can only move down or sideways in the DOM, never upward to a parent or ancestor.

**Common patterns**

``` text
#checkout-btn (by id)
.btn.btn-primary (by multiple classes)
[data-testid='submit'] (by attribute)
div.card > h3 (direct child)
ul li:nth-child(2) (nth position)
input:not([disabled]) (exclude by state)
```

*Rule of thumb: reach for CSS first for anything you can select top-down (by id, class, attribute, position). Reach for XPath only when you need to move upward (ancestor/parent) or match on visible text.*

### 9.3 Playwright's Built-in Locators (recommended first choice)

Playwright ships locators built on accessibility semantics rather than DOM structure. They're the most resilient option because they track what a real user or screen reader would perceive, and they come with Playwright's built-in auto-waiting and retry behavior.

``` typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email address')
page.getByPlaceholder('Enter your email')
page.getByText('Welcome back')
page.getByAltText('Company logo')
page.getByTitle('Close dialog')
page.getByTestId('login-submit')
```

*These should be the default choice in a Playwright + TypeScript project. Fall back to CSS, then XPath, only when the accessibility tree doesn't expose a clean way to reach the element.*

### 9.4 Locator Chaining and Filtering (Playwright)

Playwright locators can be scoped and filtered without writing a single combined XPath expression — often replacing what would otherwise need ancestor/sibling XPath:

``` typescript
page.locator('.product-card').filter({ hasText: 'In Stock' })
page.locator('table tr').filter({ has: page.getByText('Overdue') })
page.getByRole('listitem').nth(2)
page.locator('button').first()
page.locator('button').last()
locatorA.and(locatorB)
locatorA.or(locatorB)
```

*filter({ hasText }) is frequently a cleaner substitute for an XPath contains()+ancestor combination, and stays readable as the page changes.*

### 9.5 Shadow DOM and Frames

Two DOM structures need special handling that plain XPath does not cover well:

- **Shadow DOM:** Playwright's CSS and text-based locators automatically pierce open shadow roots. XPath does not cross shadow DOM boundaries at all, which is one of the more common reasons an XPath locator silently fails to find an element that's clearly visible on the page.

- **iFrames:** Elements inside an \<iframe\> aren't reachable by a normal page locator. Scope into the frame first, then locate as usual.

``` typescript
page.frameLocator('#billing-frame').getByLabel('Card number')
```

## 10. Locator Strategy Comparison

A side-by-side view of when to reach for each strategy:

| **Strategy** | **Example** | **Best For** |
|----|----|----|
| ID (CSS) | `#submit-btn` | Fastest option when the app assigns stable, unique IDs |
| Class Name (CSS) | `.btn-primary` | Style-based grouping; rarely unique alone, combine with other attributes |
| Attribute (CSS) | `[data-testid='login']` | Elements with custom test attributes added specifically for automation |
| Playwright getByRole | `page.getByRole('button', { name: 'Submit' })` | Default first choice — mirrors the accessibility tree, most resilient to markup changes |
| Playwright getByTestId | `page.getByTestId('login-submit')` | Stable, explicit hooks the app exposes purely for tests |
| Link Text (Selenium-style) | `By.linkText('Home')` | Legacy Selenium projects; in Playwright use getByRole('link') or getByText instead |
| XPath ancestor / sibling | `//label[text()='Email']/following-sibling::input` | Relationships CSS can't express — moving upward or sideways from a known element |
| XPath contains / starts-with | `//button[contains(text(),'Submit')]` | Dynamic or partial text/attribute values that CSS attribute selectors can't match as flexibly |

## 11. Applying This in a Playwright + TypeScript Project

- **Locator priority still applies:** Prefer getByRole, getByLabel, getByText, and getByTestId first — reach for raw XPath only when the relationship (sibling, ancestor, dynamic prefix) can't be expressed with Playwright's built-in locators.

- **XPath in Playwright syntax:** page.locator("xpath=//button\[contains(text(),'Submit')\]") — Playwright accepts raw XPath strings prefixed with xpath=.

- **Keep raw XPath out of test files:** Wrap complex ancestor/sibling XPath in a Page Object method with a descriptive name (e.g., getRowByOrderId()) so the raw XPath is written once and reused, not repeated across test files.

- **Document the reason, not just the syntax:** Comment why a locator needed XPath (e.g., 'no stable test-id; using ancestor to reach the row container') so the next person doesn't replace it with a more brittle CSS selector.

- **Re-validate after DOM refactors:** An XPath that walks several ancestor/sibling levels breaks the moment the DOM structure changes, even if the visible UI didn't. Re-check these locators whenever the underlying component library or markup is refactored.
