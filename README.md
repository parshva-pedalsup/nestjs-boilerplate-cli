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
npm create nest-backend my-api -- --orm prisma
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

## Philosophy

Liquibase owns schema migrations. ORM entities/schemas are application mapping layers and must stay aligned with Liquibase changelogs.