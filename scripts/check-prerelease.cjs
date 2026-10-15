'use strict';
// Fails when a direct dependency is declared or locked at a prerelease version.
// Usage: node scripts/check-prerelease.cjs [package.json] [pnpm-lock.yaml]
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = process.argv[2] ?? path.join(root, 'package.json');
const lockPath = process.argv[3] ?? path.join(root, 'pnpm-lock.yaml');
const PRERELEASE = /-(alpha|beta|rc|next|canary|nightly|pre|dev)(\b|[.-]|\d)/i;

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const problems = [];

for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
    if (PRERELEASE.test(spec)) problems.push(`${field}: ${name}@${spec}`);
  }
}

if (fs.existsSync(lockPath)) {
  // The lockfile may start with an environment document; the project importers come last.
  const lock = `\n${fs.readFileSync(lockPath, 'utf8')}`;
  const start = lock.lastIndexOf('\nimporters:');
  const end = lock.indexOf('\npackages:', start);
  let current = '';
  for (const line of lock.slice(start, end === -1 ? undefined : end).split('\n')) {
    const dep = /^ {6}'?([^':]+)'?:$/.exec(line);
    if (dep) current = dep[1];
    const version = /^ {8}version: (\S+)/.exec(line);
    if (version && PRERELEASE.test(version[1])) problems.push(`lockfile: ${current}@${version[1]}`);
  }
}

if (problems.length > 0) {
  console.error(`Prerelease dependencies found:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('No prerelease direct dependencies.');
