#!/usr/bin/env node
/**
 * Creates frozen folder structure (WN-FS-FINAL-001).
 * Phase 1.1 — Repository Foundation only. No application source code.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'scripts/expected-folders.json'), 'utf8'));

let created = 0;

for (const folder of manifest.folders) {
  const dir = join(root, folder);
  await mkdir(dir, { recursive: true });
  const gitkeep = join(dir, '.gitkeep');
  try {
    await writeFile(gitkeep, '', { flag: 'wx' });
    created += 1;
  } catch {
    // .gitkeep already exists
  }
}

console.log(
  `Scaffold complete: ${manifest.folders.length} folders ensured (${created} new .gitkeep).`,
);
