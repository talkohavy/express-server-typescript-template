import { createUsersTable } from './users.migration';
import type { Client } from 'pg';

/**
 * Runs all database migrations to ensure tables exist.
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS).
 */
export async function runAllMigrations(pgClient: Client): Promise<void> {
  console.log('📦 Running database migrations...');

  await createUsersTable(pgClient);
  console.log('  ✅ Users table ready');

  console.log('✅ All migrations complete');
}
