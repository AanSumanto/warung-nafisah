#!/usr/bin/env node
/**
 * Verifies repository matches frozen folder structure (WN-FS-FINAL-001).
 */
import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'scripts/expected-folders.json'), 'utf8'));

const missing = [];

for (const folder of manifest.folders) {
  try {
    await access(join(root, folder));
  } catch {
    missing.push(folder);
  }
}

if (missing.length > 0) {
  console.error('Folder structure verification FAILED.');
  console.error('Missing folders:');
  for (const m of missing) {
    console.error(`  - ${m}`);
  }
  process.exit(1);
}

console.log(`Folder structure verification PASSED (${manifest.folders.length} folders).`);
