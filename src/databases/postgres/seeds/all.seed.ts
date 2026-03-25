import { seedUsers, type SeedUsersOptions } from './users.seed';
import type { Client } from 'pg';

export type RunAllSeedsOptions = {
  users?: SeedUsersOptions;
};

/**
 * Runs all database seeds.
 * Call this on server startup to ensure seed data exists.
 */
export async function runAllSeeds(pgClient: Client, options: RunAllSeedsOptions = {}): Promise<void> {
  console.log('🌱 Starting database seeding...');

  await seedUsers(pgClient, options.users);

  console.log('✅ Database seeding complete');
}
