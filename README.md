# NestJS Boilerplate CLI

An opinionated NestJS backend generator: think “T3 Stack energy”, but for production-grade NestJS APIs.

## Generated stack

- NestJS with strict TypeScript
- ORM selection: TypeORM, Prisma, or Drizzle
- PostgreSQL connection by default
- Better Auth for auth/session management
- Liquibase as the migration source of truth
- Class-validator for DTOs and environment validation
- Scalar API reference instead of Swagger UI
- Oxlint and Oxfmt instead of ESLint and Prettier
- Production defaults: Helmet, compression, throttling, structured logging, health checks

## Usage

```bash
npm create nestjs-backend my-api -- --orm prisma
```

Or run the package directly:

```bash
npx create-nestjs-backend my-api --orm prisma
```

Local development:

```bash
npm install
npm run build
node dist/index.js my-api --orm drizzle --package-manager pnpm
```

## CLI options

- `--orm typeorm|prisma|drizzle`
- `--package-manager pnpm|npm|yarn`
- `--force` to write into a non-empty directory

## Publish safety

Before publishing, the package runs `prepublishOnly`, which builds the CLI, runs the integration tests, and checks the npm tarball contents.

Recommended release flow:

```bash
npm run build
npm test
npm pack --dry-run
npm publish
```

For stronger supply-chain verification, publish from CI with npm 2FA enabled and use npm provenance/trusted publishing where possible.

## Philosophy

Liquibase owns schema migrations. ORM entities/schemas are application mapping layers and must stay aligned with Liquibase changelogs.