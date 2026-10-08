const fs = require('node:fs');
const path = require('node:path');
const { lintSource } = require('../../core/scripts/testConventions.cjs');

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : file.endsWith('.ts') ? [file] : [];
  });
}

const targets = files('tests');
const findings = targets.flatMap(file => lintSource(fs.readFileSync(file, 'utf8'), file));
for (const finding of findings) console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
console.log(`Community conventions: ${targets.length} tests, ${findings.length} findings.`);
process.exitCode = findings.length || !targets.length ? 1 : 0;
