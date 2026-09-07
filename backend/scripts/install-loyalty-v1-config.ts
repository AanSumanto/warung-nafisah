/**
 * Explicit one-time installer for Nafisah Rewards V1 program + reward catalog.
 *
 * NEVER connected to application startup.
 * NEVER run against production by Cursor automation.
 *
 * Usage:
 *   npx tsx scripts/install-loyalty-v1-config.ts --dry-run
 *   npx tsx scripts/install-loyalty-v1-config.ts
 *
 * Semantics:
 * - absent → create
 * - compatible existing → no-op
 * - conflicting existing → fail (no silent overwrite)
 * - missing menu reference → fail
 * - program always created with enabled=false
 */

import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getEnv } from '../src/config/env.js';
import { initializeLoyaltyInfrastructure } from '../src/infrastructure/loyalty/LoyaltyModule.js';
import { createLoyaltyModule } from '../src/infrastructure/loyalty/LoyaltyModule.js';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const env = getEnv();

  console.log('[install-loyalty-v1] Starting…');
  console.log(`[install-loyalty-v1] NODE_ENV=${env.NODE_ENV} dryRun=${dryRun}`);
  console.log('[install-loyalty-v1] This script is NOT part of application startup.');

  if (env.NODE_ENV === 'production' && !process.argv.includes('--i-understand-production')) {
    console.error(
      '[install-loyalty-v1] Refusing production run without --i-understand-production flag.',
    );
    console.error(
      '[install-loyalty-v1] Verify production menus.kodeMenu first (see loyalty-02-menu-business-key-verification.md).',
    );
    process.exitCode = 2;
    return;
  }

  await connectDatabase();
  await initializeLoyaltyInfrastructure();

  const module = createLoyaltyModule();
  const result = await module.loyaltyConfigInstaller.install({ dryRun });

  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    console.error('[install-loyalty-v1] FAILED — see errors above. No silent overwrite performed.');
    process.exitCode = 1;
  } else {
    console.log('[install-loyalty-v1] OK');
    if (!dryRun) {
      console.log('[install-loyalty-v1] Program remains enabled=false. No points will be earned.');
    }
  }

  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error('[install-loyalty-v1] Unexpected error:', error);
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
