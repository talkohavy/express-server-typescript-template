# AppFactory

The `AppFactory` is the central class that composes the Express application. It attaches plugins, modules, and error handlers to the app in the correct order.

**Location:** `src/lib/lucky-server/app-factory/`

---

## 1. Purpose

- Bootstrap the app by registering plugins and modules in sequence
- Ensure proper initialization order (plugins run first, modules have access to plugin-attached services)
- Provide a consistent composition pattern across monolithic and micro-service apps

---

## 2. API

### Constructor

```typescript
constructor(app: any, optimizedApp = {})
```

- **app** – The raw Express application (cast as `Application`)
- **optimizedApp** – Optional object merged into the app via `Object.assign(this.app, optimizedApp)`

### registerPlugins

```typescript
async registerPlugins(plugins: (PluginFn | PluginAsyncFn)[]): Promise<void>
```

Registers plugins and executes them sequentially. Each plugin receives the app and can attach services or behavior (e.g., `app.configService`, `app.logger`).

- Plugins run **before** modules
- Order matters: plugins that provide dependencies for other plugins must be registered earlier
- Supports both sync `(app) => void` and async `(app) => Promise<void>`

### registerModules

```typescript
registerModules(modules: ModuleConstructor[]): void
```

Instantiates each module with the app and stores it on `app.modules[ModuleName]`.

- Each module is a class: `new Module(this.app)`
- Module instances are accessible via `app.modules.BooksModule`, `app.modules.UsersModule`, etc.
- Modules run **after** all plugins, so they can use plugin-attached services

### registerErrorHandler

```typescript
registerErrorHandler(errorHandler: PluginFn | PluginAsyncFn): void
```

Registers the global error-handling middleware. Must be registered **after** all routes so it can catch unhandled errors.

### registerPathNotFoundHandler

```typescript
registerPathNotFoundHandler(pathNotFoundHandler: PluginFn): void
```

Registers the 404 handler for requests that don’t match any route. Must be registered **after** all routes.

---

## 3. OptimizedApp and V8 Shape Optimization

The `optimizedApp` object in `src/common/constants.ts` pre-defines the shape of properties the app will have (e.g., `modules`, `configService`, `logger`). This helps V8 create optimized object shapes and can improve performance.

**When adding new plugins or modules that extend the app:**

1. Add the property to `optimizedApp` in `src/common/constants.ts`
2. Add the corresponding type to `OptimizedApp` in `src/common/types.ts`

---

## 4. Typical Usage Pattern

```typescript
export async function buildApp() {
  const app = express() as unknown as Application;
  app.disable('x-powered-by');

  const appModule = new AppFactory(app, optimizedApp);

  await appModule.registerPlugins([
    configServicePlugin,
    loggerPlugin,
    corsPlugin,
    // ... more plugins
  ]);

  appModule.registerModules([
    HealthCheckModule,
    UsersModule,
    BooksModule,
    BackendModule,
    // ...
  ]);

  appModule.registerErrorHandler(errorHandlerPlugin);
  appModule.registerPathNotFoundHandler(pathNotFoundPlugin);

  return app;
}
```

---

## 5. Registration Order Summary

1. **Plugins** – Infrastructure (config, logger, DB, CORS, etc.)
2. **Modules** – Domain logic and route providers
3. **Error handler** – Global error handling
4. **Path-not-found handler** – 404 responses
