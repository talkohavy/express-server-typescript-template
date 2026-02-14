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
│   │   └── PLUGINS.md
│   └── AI_CODING_RULES.md
├── src/                      # Main source folder
│   ├── common/               # Holds common utilities, ang global constants.
│   ├── configurations/       # Configurations for project startup
│   ├── database/             # Contains each individual db used in the project (mongodb, postgres, etc.)
│   ├── initAsMicroServices/  # initServer.ts & app.ts for each micro-service to run as standalone server.
│   ├── lib/                  # library
│   ├── middlewares/          # middleware for request data validation (body & query)
│   ├── modules/              # modules of the project
│   ├── plugins/              # plugins of the project
│   ├── tests/                # tests setup folder
│   ├── app.ts                # the main app builder
│   ├── global.d.ts           # global type overrides & type enhancements
│   ├── initServer.ts         # the server initiator (calls app.ts)
│   └── mockApp.ts            # build an app mock.
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
