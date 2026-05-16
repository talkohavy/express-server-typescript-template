# Project Overview

## 1. Project Context

This is the **express-server-typescript-template** repository - a backend server built using `pnpm`, `TypeScript` and `express`, designed to be a template for how to build proper backend services structure-wise.

It was built upon an original idea to combine the best out of Nest.js, Fastify, and TypeScript, leaning heavily on Dependency Injection, class based components, plugins, and TypeSCript.

## 2. Technology Stack

- **TypeScript** - Primary development language with full type safety
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **biome** - Code formatting & linting
- **jest** - testing library
- **Node.js** - Runtime environment
- **express** - Fast, unopinionated, minimalist web framework for Node.js.

## 3. Project Structure

```
express-server-typescript-template/
├── ai-agent-helpers/         # All AI agent oriented guides
│   ├── guides/               # Practical guides
│   │   ├── APP_FACTORY.md
│   │   ├── INIT_SERVER_AND_APP.md
│   │   ├── MODULES.md
│   │   ├── PERMISSIONS_RBAC.md
│   │   └── PLUGINS.md
│   └── AI_CODING_RULES.md
├── src/                      # Main source folder
│   ├── common/               # Holds common utilities, and global constants.
│   ├── core/                 # App platform services (config, logging, messaging, DB connections)
│   ├── configurations/       # Configurations for project startup
│   ├── databases/            # DB schemas, migrations, and seeds (mongodb, postgres, etc.)
│   ├── initAsMicroServices/  # initServer.ts & buildApp.ts for each micro-service to run as standalone server.
│   ├── lib/                  # Extractable building blocks (lucky-server, logger, Errors)
│   ├── middlewares/          # global Express middleware (CORS, body parsing, RBAC, etc.)
│   ├── modules/              # modules of the project
│   ├── plugins/              # core services attached to the app (config, logger, DB, etc.)
│   ├── tests/                # tests setup folder
│   ├── buildApp.ts                # the main app builder
│   ├── global.d.ts           # global type overrides & type enhancements
│   ├── initServer.ts         # the server initiator (calls buildApp.ts)
│   └── mockbuildApp.ts            # build an app mock.
├── toolbox/                  # A toolbox for stuff not included in the source code.
│   └── init-micro-services.sh
├── build.config.mjs          # The script used for building the project
├── eslint.config.mjs         # The eslint config file
├── jest.config.js            # The jest config file
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies and scripts
```

## 4. npm scripts

Use npm scripts defined in package.json:

```bash
# Run project/server in its monolithic form
pnpm dev

# Build the project
pnpm build

# Run all tests
pnpm test

# Code quality
pnpm run lint                 # Run ESLint
pnpm run lint:fix             # Fix ESLint issues automatically
pnpm run format               # Check Format code with Prettier
pnpm run format:biome         # Check Format code with Biome
pnpm run check                # Runs checks necessary before creating a PR (checks lint, format, and unit tests)

# Cleanup
pnpm run clean                # removes the node_modules directory to allow for a clean install

# Benchmarking
pnpm run  benchmark           # Dear AI, please fill this part... replace this text with an explanation of what its doing
pnpm run  benchmark:quick     # Dear AI, please fill this part... replace this text with an explanation of what its doing
pnpm run  k6:smoke            # Dear AI, please fill this part... replace this text with an explanation of what its doing
pnpm run  k6:load             # Dear AI, please fill this part... replace this text with an explanation of what its doing
pnpm run  k6:stress           # Dear AI, please fill this part... replace this text with an explanation of what its doing
pnpm run  k6:health           # Dear AI, please fill this part... replace this text with an explanation of what its doing
```

## 5. What each module demonstrates?

### A. Books Module

Books demonstrates how to create a simpler CRUD module. It has no DB connection, and uses a js array for simplicity. The `getBooks` method uses mock data such that a UI could implement pagination or infinite scrolling. It accepts `page` & `limit` as query params.

### B. Dragons Module

Dragons demonstrates a module that uses `redis`. It uses redis as database, which is not ideal, but again - it was just to show how a module might receive redis as an instance.

### C. Users Module

The Users module demonstrates a complex module, that already starts to look like a production-grade environment.
It includes:

- A repository level (database connection)
- Multiple services (i.e. `users-crud.service.ts`, `user-utilities.service.ts`, etc.)
- **RBAC permissions** – Routes are protected with `requirePermissionMiddleware` using permission constants (`Permissions.users.create`, `Permissions.users.read`, etc.). `registerFetchPermissionsMiddleware` populates `req.userPermissions` per request, and `attachUserFromHeadersMiddleware` populates `req.user` from `X-User-Id` / `X-User-Role` headers. See `ai-agent-helpers/guides/PERMISSIONS_RBAC.md` for details.
- A field-screening service

The database/repository layer used here is either `postgres` or `mongodb`. In such a module we create an extra folder called `repositories` where we declare a repository class (`UsersRepository` for example), and define db operations there.
