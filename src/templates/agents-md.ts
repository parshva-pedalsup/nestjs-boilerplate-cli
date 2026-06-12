import { type ProjectOptions } from '../types.js';
import { appTitle } from './helpers.js';

export function agentsMd(options: ProjectOptions): string {
  const pm = options.packageManager;
  const run = (script: string): string => (pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`);
  const install = pm === 'npm' ? 'npm install' : `${pm} install`;

  const ormNotes = {
    prisma: '- Prisma schema lives in `prisma/schema.prisma`. Run `prisma generate` after schema changes (`postinstall` handles this on install).\n- Keep Prisma models aligned with Liquibase changelogs; do not use `prisma db push` for production schema.',
    typeorm: '- TypeORM entities live in `src/database/entities/`. `synchronize` must stay disabled in production.\n- Keep entities aligned with Liquibase changelogs.',
    drizzle: '- Drizzle schema lives in `src/database/schema.ts`. Use `drizzle-kit` only for local introspection; Liquibase owns migrations.\n- Keep the Drizzle schema aligned with Liquibase changelogs.',
  }[options.orm];

  const dbStudio = options.orm === 'prisma' || options.orm === 'drizzle' ? `\n- \`${run('db:studio')}\` — open the ${options.orm} studio` : '';

  return `# ${appTitle(options)} — Agent Instructions

Production-grade NestJS API using ${options.orm}, PostgreSQL, Better Auth, and Liquibase migrations. Read \`docs/architecture.md\` for design rationale.

## Setup

\`\`\`bash
cp .env.example .env
cp liquibase.sample.properties liquibase.properties
${install}
docker compose up -d postgres
${run('db:migrate')}
\`\`\`

Requires Node.js >= 20.19.0 and Docker for Postgres/Liquibase.

## Commands

\`\`\`bash
${run('start:dev')}       # dev server with watch (http://localhost:3000)
${run('build')}            # compile to dist/
${run('typecheck')}        # tsc --noEmit
${run('lint')}             # oxlint
${run('format:check')}     # oxfmt --check
${run('format')}           # oxfmt --write
${run('test')}             # unit + slim e2e (no database)
${run('test:integration')} # full app boot (needs Postgres + RUN_INTEGRATION_TESTS=1)
${run('db:migrate')}       # apply Liquibase migrations via Docker
${run('db:rollback')}      # rollback last Liquibase changeset${dbStudio}
\`\`\`

API docs: \`http://localhost:3000/docs\` (Scalar). OpenAPI JSON: \`/openapi.json\`.

## Architecture rules

- **Liquibase owns schema.** Add changes in \`migrations/changes/*.yaml\` and include them from \`migrations/db.changelog-master.yaml\`.
${ormNotes}
- **Better Auth** is configured in \`src/auth/auth.factory.ts\` and mounted via \`@thallesp/nestjs-better-auth\`.
- **Shared PostgreSQL pool** is provided by \`PgPoolModule\` (\`PG_POOL\` token). Reuse it for auth and database access.
- **Env validation** runs at bootstrap via \`validateEnv\` in \`src/common/config/env.validation.ts\`.

## Code conventions

- Strict TypeScript: no \`any\` without justification; prefer explicit return types on public APIs.
- NestJS modules, controllers, and services follow standard Nest patterns. Use \`class-validator\` DTOs for request bodies.
- Lint with Oxlint and format with Oxfmt — not ESLint/Prettier.
- Place new features in focused modules under \`src/\`. Keep controllers thin; put logic in services.
- Version HTTP routes with URI versioning (default \`v1\`).

## Testing

- Add unit tests next to or under \`test/\` using Vitest (\`*.spec.ts\`).
- Integration tests (\`test/app.integration-spec.ts\`) require a running Postgres instance and \`RUN_INTEGRATION_TESTS=1\`.
- Run \`${run('lint')}\`, \`${run('format:check')}\`, \`${run('typecheck')}\`, and \`${run('test')}\` before finishing a change.

## Security

- Never commit \`.env\` or \`liquibase.properties\`. Use \`.env.example\` and \`liquibase.sample.properties\` as templates.
- Replace \`BETTER_AUTH_SECRET\` with a random secret (32+ characters) before production.
- Do not log secrets, tokens, or raw credentials.
- Restrict \`APP_ORIGIN\` CORS to known front-end origins in production.

## Pull requests

- Keep diffs focused; fix root causes rather than patching symptoms.
- Update Liquibase changelogs and ORM mappings together when changing schema.
- Mention migration steps in the PR description when schema changes are included.
`;
}
