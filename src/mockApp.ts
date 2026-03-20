import { buildApp } from './buildApp';
import type { Application } from 'express';

export async function buildMockApp(app: Application) {
  await buildApp(app);

  return app;
}
