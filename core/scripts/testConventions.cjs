const ts = require('typescript');

const fixtureModule = '@core/lib/BaseTest';
const locatorArguments = new Map([
  ['locator', [0]], ['frameLocator', [0]], ['getByText', [0]], ['getByLabel', [0]],
  ['getByPlaceholder', [0]], ['getByTestId', [0]], ['getByAltText', [0]], ['getByTitle', [0]],
  ['$', [0]], ['$$', [0]], ['waitForSelector', [0]], ['clickByText', [0]],
  ['clickElementJS', [0]], ['highlightElement', [0]], ['highlightAndClick', [0]],
  ['highlightAndFill', [0]], ['highlightAndType', [0]], ['downloadFileAndSave', [0]],
  ['getLocatorOfStringObject', [0, 1]], ['refineTestObjectLocator', [0, 1]],
  ['visibleObject', [1]],
]);
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);
const requestFields = new Set(['method', 'headers', 'data', 'body', 'form', 'multipart', 'params']);

function createContext(text, filename) {
  const file = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const options = { noLib: true, noResolve: true, target: ts.ScriptTarget.Latest };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = name => name === filename ? file : undefined;
  host.fileExists = name => name === filename;
  const program = ts.createProgram([filename], options, host);
  return { file, checker: program.getTypeChecker(), diagnostics: [] };
}

function unwrap(node) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node) || ts.isTypeAssertionExpression(node))) {
    node = node.expression;
  }
  return node;
}

function declarationOf(node, context) {
  const symbol = context.checker.getSymbolAtLocation(node);
  return symbol?.valueDeclaration;
}

function propertyName(node) {
  if (!node) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function localValue(node, context, seen = new Set()) {
  node = unwrap(node);
  if (!node || seen.has(node)) return node;
  seen.add(node);
  if (ts.isIdentifier(node)) {
    const declaration = declarationOf(node, context);
    if (declaration?.initializer) return localValue(declaration.initializer, context, seen);
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const key = propertyName(node.name || node.argumentExpression);
    const object = localValue(node.expression, context, seen);
    if (object && ts.isObjectLiteralExpression(object)) {
      const property = object.properties.find(item => propertyName(item.name) === key);
      if (property?.initializer) return localValue(property.initializer, context, seen);
    }
  }
  return node;
}

function inlineChildren(node) {
  if (ts.isObjectLiteralExpression(node)) return node.properties.map(item => item.initializer || item.expression || item.name);
  if (ts.isArrayLiteralExpression(node)) return [...node.elements];
  if (ts.isBinaryExpression(node)) return [node.left, node.right];
  if (ts.isConditionalExpression(node)) return [node.whenTrue, node.whenFalse];
  if (ts.isPrefixUnaryExpression(node)) return [node.operand];
  return [];
}

function hasInlineValue(node, context, seen = new Set()) {
  node = localValue(node, context);
  if (!node || seen.has(node)) return false;
  seen.add(node);
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node) || ts.isTemplateExpression(node)) return true;
  if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) return true;
  return inlineChildren(node).some(child => hasInlineValue(child, context, seen));
}

function report(context, node, rule, message) {
  const { line, character } = context.file.getLineAndCharacterOfPosition(node.getStart(context.file));
  context.diagnostics.push({ file: context.file.fileName, line: line + 1, column: character + 1, rule, message });
}

function checkArgument(context, node, rule, message) {
  if (node && hasInlineValue(node, context)) report(context, node, rule, message);
}

function objectFields(node, context, names) {
  node = localValue(node, context);
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties.filter(item => names.has(propertyName(item.name)))
    .map(item => item.initializer || item.name);
}

function checkFixtureImports(context) {
  // Framework internals define/implement BaseTest and must be allowed to use Playwright directly.
  if (!context.file.fileName.replaceAll('\\', '/').startsWith('tests/')) return;
  let hasFixture = false;
  for (const node of context.file.statements.filter(ts.isImportDeclaration)) {
    const clause = node.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const moduleName = node.moduleSpecifier.text;
    const bindings = clause.namedBindings;
    const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
    const runtime = named.filter(item => !item.isTypeOnly);
    if (moduleName === fixtureModule && runtime.some(item => (item.propertyName || item.name).text === 'test')) hasFixture = true;
    if (!['@playwright/test', 'playwright/test'].includes(moduleName)) continue;
    const forbidden = runtime.some(item => ['test', 'expect'].includes((item.propertyName || item.name).text));
    if (forbidden || (bindings && ts.isNamespaceImport(bindings)) || clause.name) {
      report(context, node, 'framework-import', `Import test/expect from ${fixtureModule}.`);
    }
  }
  if (/\.test\.ts$/.test(context.file.fileName) && !hasFixture) {
    report(context, context.file, 'framework-fixture', `Tests must import the test fixture from ${fixtureModule}.`);
  }
}

function member(node) {
  node = unwrap(node);
  if (!node) return {};
  if (ts.isPropertyAccessExpression(node)) return { name: node.name.text, owner: node.expression };
  if (ts.isElementAccessExpression(node)) return { name: propertyName(node.argumentExpression), owner: node.expression };
  if (ts.isIdentifier(node)) return { name: node.text };
  return {};
}

function isRequestOwner(node, context, seen = new Set()) {
  node = unwrap(node);
  if (!node || seen.has(node)) return false;
  seen.add(node);
  if (ts.isPropertyAccessExpression(node)) return /request|apiRequest|requestContext/i.test(node.name.text);
  if (!ts.isIdentifier(node)) return false;
  const declaration = declarationOf(node, context);
  if (declaration && ts.isBindingElement(declaration)) return (declaration.propertyName || declaration.name).getText() === 'request';
  if (declaration?.initializer) return isRequestOwner(declaration.initializer, context, seen);
  return /^(request|apiRequest|requestContext|axios)$/i.test(node.text);
}

function checkLocatorCall(context, call, name) {
  for (const index of locatorArguments.get(name) || []) {
    checkArgument(context, call.arguments[index], 'inline-locator', 'Use a GUI/Mobile object repository locator, including helper arguments.');
  }
  const fields = name === 'getByRole' ? new Set(['name']) : new Set(['hasText', 'hasNotText']);
  const options = name === 'getByRole' ? call.arguments[1] : call.arguments[0];
  if (!['getByRole', 'filter'].includes(name)) return;
  for (const value of objectFields(options, context, fields)) {
    checkArgument(context, value, 'inline-locator', 'Store locating text/accessible names in the object repository.');
  }
}

function checkRequestCall(context, call, name, owner) {
  const direct = name === 'fetch' && !owner;
  if (!direct && !(httpMethods.has(name) && isRequestOwner(owner, context))) return;
  checkArgument(context, call.arguments[0], 'inline-request', 'Use a request endpoint from objectRepositories/API.');
  for (const value of objectFields(call.arguments[1], context, requestFields)) {
    checkArgument(context, value, 'inline-request', 'Keep request definitions in objectRepositories/API and inputs in test data.');
  }
}

function checkApiContract(context, call, name) {
  if (['sendRequest', 'sendRequestAndVerify'].includes(name)) {
    for (const index of [1, 3, 4, 5]) {
      checkArgument(context, call.arguments[index], 'inline-api-contract', 'Use repository request definitions and external test data/expected status.');
    }
  }
  if (name === 'registerTemplates') {
    checkArgument(context, call.arguments[0], 'inline-api-contract', 'Load API template definitions from objectRepositories/API.');
  }
}

function checkNode(context, node) {
  if (ts.isNewExpression(node) && member(node.expression).name === 'ApiTemplateEngine') {
    for (const value of objectFields(node.arguments?.[0], context, new Set(['templates']))) {
      checkArgument(context, value, 'inline-api-contract', 'Load API template definitions from objectRepositories/API.');
    }
  }
  if (!ts.isCallExpression(node)) return;
  const { name, owner } = member(node.expression);
  checkLocatorCall(context, node, name);
  checkRequestCall(context, node, name, owner);
  checkApiContract(context, node, name);
}

function lintSource(text, filename = 'tests/example.test.ts') {
  const context = createContext(text, filename);
  for (const error of context.file.parseDiagnostics) {
    const { line, character } = context.file.getLineAndCharacterOfPosition(error.start || 0);
    context.diagnostics.push({ file: filename, line: line + 1, column: character + 1, rule: 'syntax',
      message: ts.flattenDiagnosticMessageText(error.messageText, ' ') });
  }
  checkFixtureImports(context);
  const visit = node => { checkNode(context, node); ts.forEachChild(node, visit); };
  visit(context.file);
  return context.diagnostics;
}

module.exports = { lintSource };
