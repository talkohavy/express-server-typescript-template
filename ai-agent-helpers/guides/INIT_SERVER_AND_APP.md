# initServer.ts & app.ts

Every server in this project follows the same pattern: an **init server** file that bootstraps the app and starts listening, and an **app** file that builds the composed Express application.

---

## The Two Files

### initServer.ts – Entry Point & HTTP Listen

**Location:** `src/initServer.ts` (monolith) or `src/initAsMicroServices/<service>/<service>.init-server.ts` (micro-services)

Responsibilities:

1. Call `buildApp()` to get the composed app
2. Read the port from config
3. Start the HTTP server listening
4. Register global handlers for `unhandledRejection` and `uncaughtException`

```typescript
export async function startServer() {
  const app = await buildApp();
  const PORT = app.configService.get<number>(ConfigKeys.Port);

  // Use app.httpServer when Socket.IO/WebSocket plugins create it
  app.httpServer.listen(PORT, () => {
    app.logger.log(`🚀 server is up and running on port ${PORT}`);
  });

  app.httpServer.on('error', (error) => {
    app.logger.error(error.message);
    process.exit();
  });
}

process.on('unhandledRejection', ...);
process.on('uncaughtException', ...);
startServer();
```

### app.ts – App Composition

**Location:** `src/app.ts` (monolith) or `src/initAsMicroServices/<service>/<service>.app.ts` (micro-services)

Responsibilities:

1. Create the raw Express app
2. Instantiate AppFactory with the app and optimizedApp
3. Register plugins, modules, error handler, and path-not-found handler
4. Return the composed app

```typescript
export async function buildApp() {
  const app = express() as unknown as Application;
  app.disable('x-powered-by');

  const appModule = new AppFactory(app, optimizedApp);
  await appModule.registerPlugins([...]);
  appModule.registerModules([...]);
  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
```

---

## Critical: httpServer vs app.listen

**Use `app.httpServer.listen()`** when the app uses plugins that create an HTTP server (e.g., Socket.IO, WebSocket). These plugins call `createServer(app)` and attach the server to `app.httpServer`.

If you use `app.listen()` instead, a new HTTP server is created. Socket.IO and WebSocket attach to `app.httpServer`, so their connections would not work.

**Use `app.listen()`** when the app has no such plugins (e.g., typical micro-services without Socket.IO/WebSocket). In that case, `app.httpServer` may be undefined.

| Scenario         | Use                    |
|-----------------|------------------------|
| Monolith (Socket.IO, WS) | `app.httpServer.listen()` |
| Micro-service (no Socket.IO) | `app.listen()`            |

---

## Monolith vs. Micro-Services

### Monolith

- **Entry:** `pnpm dev` → `src/initServer.ts`
- **App:** `src/app.ts` → `buildApp()`
- **Plugins:** Full set (config, logger, postgres, redis, socket.io, ws, cors, etc.)
- **Modules:** All domain modules + BackendModule + SwaggerModule
- **Listen:** `app.httpServer.listen()` (because of Socket.IO/WS)

### Micro-Services

- **Entry:** `pnpm dev:users` → `src/initAsMicroServices/users/users.init-server.ts`
- **App:** `src/initAsMicroServices/users/users.app.ts` → `buildApp()`
- **Plugins:** Subset per service (e.g., users service: config, postgres, logger; no redis/socket.io)
- **Modules:** One or two domain modules + HealthCheckModule
- **Listen:** `app.listen()` (no Socket.IO/WS)
- **Env:** `IS_STANDALONE_MICRO_SERVICES` is set so domain modules attach their own routes

Each micro-service has its own `init-server.ts` and `app.ts`, with a focused set of plugins and modules.

---

## Adding a New Micro-Service

1. Create `src/initAsMicroServices/<name>/<name>.init-server.ts` – import and call `buildApp`, listen on port from config
2. Create `src/initAsMicroServices/<name>/<name>.app.ts` – define `buildApp()` with AppFactory, plugins, and modules
3. Add an npm script in `package.json`, e.g. `"dev:<name>": "node --import tsx --watch --env-file=.env.micro-services src/initAsMicroServices/<name>/<name>.init-server.ts"`
4. Set `IS_STANDALONE_MICRO_SERVICES` in `.env.micro-services` so domain modules attach routes
5. Use `configServicePluggable(configSettings)` for service-specific config (port, service name, etc.)

---

## File Layout Summary

```
src/
├── initServer.ts          # Monolith entry
├── app.ts                 # Monolith app builder
└── initAsMicroServices/
    ├── users/
    │   ├── users.init-server.ts
    │   └── users.app.ts
    ├── books/
    ├── dragons/
    ├── backend/
    └── shared/
        └── plugins/       # Shared plugins (e.g. configServicePluggable)
```
