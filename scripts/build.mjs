#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const workspaces = ['@warung-nafisah/backend', '@warung-nafisah/frontend'];

for (const workspace of workspaces) {
  console.log(`\n> Building ${workspace}...`);
  const result = spawnSync('npm', ['run', 'build', '--workspace', workspace], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nAll workspace builds completed.');
