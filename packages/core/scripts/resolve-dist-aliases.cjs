#!/usr/bin/env node
'use strict';
// Rewrites the tsconfig path aliases (@packages/*, @config/*, @objectRepositories/* ...) in the compiled JavaScript to relative paths,
// so the output in dist/ runs in plain Node (npm run email:verify, the Appium launcher and the unit tests load dist/ directly).
// TypeScript compiles aliases but never rewrites them. Run it after tsc, from the project root; it reads ./tsconfig.json.
// It changes only dist/, is safe to run twice, and fails when an alias points at a file that was not emitted.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const read = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (read.error) throw new Error(`Cannot read tsconfig.json: ${ts.flattenDiagnosticMessageText(read.error.messageText, '\n')}`);
const options = read.config.compilerOptions ?? {};
const outDir = path.resolve(root, options.outDir ?? 'dist');
const rootDir = path.resolve(root, options.rootDir ?? '.');

// "@packages/*": ["./packages/*"]  ->  ["@packages/", <outDir>/packages/]. Generated folders (logs) have no compiled output.
const aliases = Object.entries(options.paths ?? {})
  .filter(([key, targets]) => key.endsWith('/*') && targets.length === 1 && targets[0].endsWith('/*'))
  .map(([key, targets]) => [key.slice(0, -1), path.join(outDir, path.relative(rootDir, path.resolve(root, targets[0].slice(0, -1))))])
  .filter(([, directory]) => !path.relative(outDir, directory).startsWith('logs'));

const specifier = /(\brequire\(\s*|\bimport\(\s*)(["'])(@[^"']+)\2/g;
const files = [];
(function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full); } else if (entry.name.endsWith('.js')) files.push(full);
  }
})(outDir);

let rewritten = 0;
const missing = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const next = source.replace(specifier, (match, call, quote, name) => {
    const alias = aliases.find(([prefix]) => name.startsWith(prefix));
    if (!alias) return match; // a scoped npm package such as @playwright/test
    const target = path.join(alias[1], name.slice(alias[0].length));
    if (!fs.existsSync(target) && !fs.existsSync(`${target}.js`) && !fs.existsSync(path.join(target, 'index.js'))) missing.push(`${path.relative(root, file)} -> ${name}`);
    const relative = path.relative(path.dirname(file), target).split(path.sep).join('/');
    rewritten++;
    return `${call}${quote}${relative.startsWith('.') ? relative : `./${relative}`}${quote}`;
  });
  if (next !== source) fs.writeFileSync(file, next);
}
if (missing.length) {
  console.error(`resolve-dist-aliases: ${missing.length} alias import(s) point at a file that was not compiled:\n  ${missing.slice(0, 20).join('\n  ')}`);
  process.exit(1);
}
console.log(`resolve-dist-aliases: ${rewritten} alias import(s) rewritten in ${files.length} file(s)`);
