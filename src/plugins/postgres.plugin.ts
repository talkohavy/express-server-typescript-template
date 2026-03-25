import { ConfigKeys, type PostgresConfig } from '../configurations';
import { runAllMigrations } from '../databases/postgres/migrations';
import { runAllSeeds } from '../databases/postgres/seeds';
import { PostgresConnection } from '../lib/database/postgres.connection';
import type { Application } from 'express';

/**
 * @dependencies
 * - config-service plugin
 */
export async function postgresPlugin(app: Application) {
  const { connectionString } = app.configService.get<PostgresConfig>(ConfigKeys.Postgres);

  const dbClient = PostgresConnection.getInstance(connectionString.substring(0, 10));

  await dbClient.connect();

  const pgClient = dbClient.getClient();

  app.pg = pgClient;

  // Run migrations and seeds
  if (process.env.SHOULD_MIGRATE_POSTGRES) {
    await runAllMigrations(pgClient);
    await runAllSeeds(pgClient, { users: { skipIfExists: false, clearBeforeSeeding: true } });
  }
}
