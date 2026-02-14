# Plugins

Plugins attach infrastructure and cross-cutting concerns to the Express app. They run **before** modules and provide services that modules depend on.

**Location:** `src/plugins/`

---

## Definition

A plugin is a function that receives the app and augments it:

```typescript
type PluginFn = (app: Application) => void;
type PluginAsyncFn = (app: Application) => Promise<void>;
```

Plugins typically attach services or add middleware to the app, e.g. `app.configService`, `app.logger`, `app.pg`.

---

## When to Create a Plugin

Create a plugin when you need to:

- Attach an **infrastructure service** used across multiple modules (config, logger, DB clients, Redis)
- Add **global middleware** (CORS, body parsing, security headers)
- Set up **shared resources** that modules depend on before they initialize

**Do not** create plugins for domain logic—use modules instead. Plugins are for cross-cutting concerns.

---

## Plugin Dependencies and Order

Plugins execute **sequentially** in registration order. Order matters when one plugin depends on another.

**Common dependency chain:**

1. `configServicePlugin` – Always first; many plugins need config
2. `callContextPlugin` – Request-scoped context
3. `addRequestIdHeaderPlugin` – Request ID header
4. `loggerPlugin` – Depends on: configService, callContextService
5. `postgresPlugin`, `redisPlugin` – Depend on: configService
6. `corsPlugin`, `helmetPlugin`, `bodyLimitPlugin`, etc. – No app dependencies

Document dependencies in a JSDoc block when a plugin uses other plugins:

```typescript
/**
 * @dependencies
 * - config-service plugin
 * - call-context plugin
 */
export function loggerPlugin(app: Application) {
  const { configService, callContextService } = app;
  // ...
}
```

---

## Special Plugins/Middleware: Error Handler and Path Not Found Handler

These are registered via dedicated AppFactory methods (not `registerPlugins`):

- **Error handler** – `registerErrorHandler()` – Global error middleware, must run after all routes
- **Path not found** – `registerPathNotFoundHandler()` – 404 handler for unmatched routes

They are still plugin-style functions `(app) => void`, but they are registered separately to preserve the correct middleware order.

---

## Configurable Plugins (Factories)

For micro-services or environments with different config, use a **factory** that returns a plugin:

```typescript
// Returns a plugin with baked-in config
export function configServicePluggable(configSettings: Record<string, any>) {
  return function configServicePlugin(app: Application) {
    const configService = new ConfigService(configSettings);
    app.configService = configService;
  };
}

// Usage in micro-service app:
await appModule.registerPlugins([
  configServicePluggable(configSettings),  // Custom config per service
  // ...
]);
```

This pattern lets each app (monolith vs. micro-service) use different settings without changing the plugin implementation.

---

## Example: Minimal Plugin

```typescript
import type { Application } from 'express';

export function configServicePlugin(app: Application) {
  const configService = new ConfigService(configuration());
  app.configService = configService;
}
```

---

## Example: Plugin with Dependencies

```typescript
/**
 * @dependencies
 * - config-service plugin
 */
export async function postgresPlugin(app: Application) {
  const { connectionString } = app.configService.get(ConfigKeys.Postgres);
  const dbClient = PostgresConnection.getInstance(connectionString);
  await dbClient.connect();
  app.pg = dbClient.getClient();
}
```

---

## Existing Plugins (Reference)

| Plugin                   | Purpose                          | Dependencies        |
| ------------------------ | -------------------------------- | ------------------- |
| configServicePlugin      | App-wide configuration           | None                |
| callContextPlugin        | Request-scoped async context     | None                |
| addRequestIdHeaderPlugin | x-request-id header on responses | None                |
| loggerPlugin             | Structured logging               | config, callContext |
| postgresPlugin           | PostgreSQL client                | config              |
| redisPlugin              | Redis pub/sub clients            | config              |
| socketIOPlugin           | Socket.IO server                 | config              |
| wsPlugin                 | WebSocket client                 | config              |
| corsPlugin               | CORS configuration               | None                |
| helmetPlugin             | Security headers                 | None                |
| bodyLimitPlugin          | Request body size limit          | None                |
| urlEncodedPlugin         | URL-encoded body parsing         | None                |
| cookieParserPlugin       | Cookie parsing                   | None                |
| errorHandlerPlugin       | Global error middleware          | N/A (special)       |
| pathNotFoundPlugin       | 404 handler                      | N/A (special)       |
