import { type FileEntry, type ProjectOptions } from '../types.js';
import { agentsMd } from './agents-md.js';
import { appTitle, json, packageJson } from './helpers.js';

export function commonFiles(options: ProjectOptions): readonly FileEntry[] {
  return [
    { path: 'package.json', content: packageJson(options) },
    { path: 'README.md', content: readme(options) },
    { path: 'CHANGELOG.md', content: changelog() },
    ...(options.withAgentsMd ? [{ path: 'AGENTS.md', content: agentsMd(options) }] : []),
    { path: 'docs/architecture.md', content: architectureNotes(options) },
    { path: 'docs/getting-started.md', content: gettingStarted(options) },
    { path: 'docs/orm-notes.md', content: ormNotes(options) },
    { path: '.env.example', content: envExample() },
    { path: '.gitignore', content: gitignore() },
    { path: '.oxlintrc.json', content: oxlintConfig() },
    { path: '.oxfmtrc.json', content: oxfmtConfig() },
    { path: 'nest-cli.json', content: json({ $schema: 'https://json.schemastore.org/nest-cli', collection: '@nestjs/schematics', sourceRoot: 'src', compilerOptions: { deleteOutDir: true } }) },
    { path: 'tsconfig.json', content: tsconfig() },
    { path: 'tsconfig.build.json', content: tsconfigBuild() },
    { path: 'vitest.config.ts', content: vitestConfig() },
    { path: 'docker-compose.yml', content: dockerCompose() },
    { path: 'liquibase.sample.properties', content: liquibaseSampleProperties() },
    { path: 'migrations/db.changelog-master.yaml', content: changelogMaster() },
    { path: 'migrations/changes/001-auth-tables.yaml', content: authTablesChangelog() },
    { path: 'src/main.ts', content: mainTs(options) },
    { path: 'src/app.module.ts', content: appModuleTs() },
    { path: 'src/app.controller.ts', content: appControllerTs() },
    { path: 'src/app.service.ts', content: appServiceTs() },
    { path: 'src/auth/auth.factory.ts', content: authFactoryTs() },
    { path: 'src/database/pg-pool.module.ts', content: pgPoolModuleTs() },
    { path: 'src/common/config/env.validation.ts', content: envValidationTs() },
    { path: 'src/common/filters/http-exception.filter.ts', content: httpExceptionFilterTs() },
    { path: 'src/common/interceptors/request-id.interceptor.ts', content: requestIdInterceptorTs() },
    { path: 'src/health/health.module.ts', content: healthModuleTs() },
    { path: 'src/health/health.controller.ts', content: healthControllerTs() },
    { path: 'test/app.service.spec.ts', content: appServiceSpecTs() },
    { path: 'test/app.e2e-spec.ts', content: e2eSpecTs() },
    { path: 'test/app.integration-spec.ts', content: integrationSpecTs() },
  ];
}

function readme(options: ProjectOptions): string {
  return `# ${appTitle(options)}\n\nOpinionated production-grade NestJS backend generated with:\n\n- NestJS with strict TypeScript\n- ${options.orm} ORM adapter\n- PostgreSQL\n- Better Auth\n- Liquibase-owned database migrations\n- Scalar API reference at \`/docs\`\n- OpenAPI spec at \`/openapi.json\`\n- Class-validator DTO and env validation\n- Oxlint and Oxfmt instead of ESLint and Prettier\n- Helmet, compression, throttling, structured logging, health checks\n\n## Start\n\n\`\`\`bash\ncp .env.example .env\ncp liquibase.sample.properties liquibase.properties\n${options.packageManager} install\n${options.packageManager} typecheck\n${options.packageManager} build\n\`\`\`\n\nDatabase setup and local runtime:\n\n\`\`\`bash\ndocker compose up -d postgres\n${options.packageManager} db:migrate\n${options.packageManager} start:dev\n\`\`\`\n\n## Notes\n\nLiquibase is the source of truth for schema migrations. Keep ORM auto-sync disabled in production. See \`docs/getting-started.md\` and \`docs/orm-notes.md\` for the project workflow.\n`;
}

function changelog(): string {
  return `# Changelog\n\nAll notable changes to this project should be documented in this file.\n\n## Unreleased\n\n- Initial generated NestJS backend scaffold.\n`;
}

function architectureNotes(options: ProjectOptions): string {
  return `# Architecture Notes\n\n## Opinionated choices\n\n- NestJS owns HTTP, dependency injection, validation, and module boundaries.\n- ${options.orm} is used for application data access.\n- Liquibase owns database schema migrations; ORM sync/migrate commands should not mutate production schema.\n- Better Auth owns authentication endpoints and session lifecycle.\n- Scalar renders API docs at \`/docs\` from \`/openapi.json\`. Swagger UI is intentionally disabled. Helmet CSP is configured to allow Scalar CDN assets.\n- Oxlint and Oxfmt replace ESLint and Prettier.\n- Better Auth and Drizzle share a single PostgreSQL pool via \`PgPoolModule\`.\n\n## Liquibase configuration\n\nCopy \`liquibase.sample.properties\` to \`liquibase.properties\` before running migrations. Keep the sample committed; the local properties file is gitignored. For \`db:migrate\`, Docker Compose supplies JDBC settings from \`.env\` \`POSTGRES_*\` variables using the internal URL \`postgres:5432\`. \`POSTGRES_PORT\` only controls the host port mapping (e.g. \`localhost:5433\`) and does not apply inside the Compose network.\n\n## Database migration rule\n\nCreate every schema change in \`migrations/changes/*.yaml\` and include it from \`migrations/db.changelog-master.yaml\`. Keep the ORM schema/entity files aligned with Liquibase changes.\n\n## Testing\n\n- \`pnpm test\` runs fast unit and slim e2e tests without a database.\n- \`pnpm test:integration\` boots the full app and requires Postgres plus \`RUN_INTEGRATION_TESTS=1\`.\n\n## Production checklist\n\n- Replace \`BETTER_AUTH_SECRET\` with a long random secret (32+ characters).\n- Restrict CORS origins.\n- Run behind TLS.\n- Use managed Postgres backups.\n- Run \`typecheck\`, \`lint\`, \`format:check\`, and tests in CI.\n`;
}

function gettingStarted(options: ProjectOptions): string {
  return `# Getting Started\n\n## First run\n\n\`\`\`bash\ncp .env.example .env\ncp liquibase.sample.properties liquibase.properties\n${options.packageManager} install\n${options.packageManager} typecheck\n${options.packageManager} build\n\`\`\`\n\n## Environment files\n\n- \`.env.example\` is committed documentation for required runtime configuration.\n- \`.env\` is local and gitignored.\n- \`liquibase.sample.properties\` is committed as the safe Liquibase template.\n- \`liquibase.properties\` is local and gitignored.\n\n## Database workflow\n\nLiquibase owns schema migrations. Add schema changes in \`migrations/changes/*.yaml\`, then include them from \`migrations/db.changelog-master.yaml\`. Keep ${options.orm} mappings aligned with those changelogs.\n\n## Common commands\n\n\`\`\`bash\n${options.packageManager} typecheck\n${options.packageManager} build\n${options.packageManager} test\n${options.packageManager} format:check\n\`\`\`\n\nDatabase and local runtime commands:\n\n\`\`\`bash\ndocker compose up -d postgres\n${options.packageManager} db:migrate\n${options.packageManager} start:dev\n\`\`\`\n\nScalar API docs are available at \`/docs\` after the app is running. The OpenAPI document is available at \`/openapi.json\`.\n`;
}

function ormNotes(options: ProjectOptions): string {
  const notes = {
    prisma:
      'Prisma Client is the application data-access layer. Keep `prisma/schema.prisma` aligned with Liquibase changelogs and use Prisma generation for client types, not schema ownership.',
    drizzle:
      'Drizzle is the application query layer. Keep `src/database/schema.ts` aligned with Liquibase changelogs and use Drizzle Kit studio for inspection, not schema ownership.',
    typeorm:
      'TypeORM entities are the application mapping layer. Keep `src/database/entities/*.ts` aligned with Liquibase changelogs and keep schema synchronization disabled for production use.',
  } as const;

  return `# ORM Notes\n\nThis project uses ${options.orm} with Liquibase as the migration source of truth.\n\n## Ownership rule\n\nLiquibase owns database schema changes. The ORM describes how application code reads and writes that schema.\n\n## ${options.orm} mapping\n\n${notes[options.orm]}\n\n## Change workflow\n\n1. Add a Liquibase changeset under \`migrations/changes/\`.\n2. Include it from \`migrations/db.changelog-master.yaml\`.\n3. Update ${options.orm} schema/entity files to match the migrated database shape.\n4. Run typecheck and tests before shipping.\n`;
}

function envExample(): string {
  return `# App\nNODE_ENV=development\nPORT=3000\nAPP_NAME=Nest Backend\nAPP_ORIGIN=http://localhost:3000\n\n# Database\nDATABASE_URL=postgresql://postgres:postgres@localhost:5432/app\nPOSTGRES_HOST=localhost\nPOSTGRES_PORT=5432\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=postgres\nPOSTGRES_DB=app\n\n# Auth\nBETTER_AUTH_SECRET=change-me-to-a-long-random-secret\nBETTER_AUTH_URL=http://localhost:3000\n\n# Logging and throttling\nLOG_LEVEL=info\nTHROTTLE_TTL_MS=60000\nTHROTTLE_LIMIT=100\n`;
}

function gitignore(): string {
  return `node_modules/\ndist/\ncoverage/\nsrc/generated/\n.env\n.env.*\n!.env.example\nliquibase.properties\n!liquibase.sample.properties\n*.log\n.DS_Store\n`;
}

function oxlintConfig(): string {
  return json({ $schema: 'https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json', categories: { correctness: 'error', suspicious: 'error', perf: 'warn', pedantic: 'warn' }, plugins: ['typescript', 'unicorn'], rules: { 'no-console': 'off', 'typescript/no-explicit-any': 'warn' }, ignorePatterns: ['dist/**', 'node_modules/**', 'coverage/**'] });
}

function oxfmtConfig(): string {
  return json({ $schema: 'https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxfmt/configuration_schema.json', printWidth: 100, tabWidth: 2, useTabs: false, semi: true, singleQuote: true, trailingComma: 'all', ignorePatterns: ['dist/**', 'node_modules/**', 'coverage/**'] });
}

function tsconfig(): string {
  return json({ compilerOptions: { module: 'commonjs', declaration: true, removeComments: true, emitDecoratorMetadata: true, experimentalDecorators: true, allowSyntheticDefaultImports: true, esModuleInterop: true, target: 'ES2022', sourceMap: true, outDir: './dist', incremental: true, strict: true, strictNullChecks: true, noImplicitAny: true, noImplicitOverride: true, noImplicitReturns: true, noFallthroughCasesInSwitch: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true, forceConsistentCasingInFileNames: true, types: ['node', 'vitest/globals'], skipLibCheck: true }, exclude: ['node_modules', 'dist'] });
}

function tsconfigBuild(): string {
  return json({ extends: './tsconfig.json', compilerOptions: { declaration: true }, exclude: ['node_modules', 'test', 'dist', '**/*.spec.ts'] });
}

function vitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    globals: true,\n    environment: 'node',\n    include: ['test/**/*.spec.ts'],\n    exclude: ['test/**/*.integration-spec.ts'],\n  },\n});\n`;
}

function dockerCompose(): string {
  return `services:\n  postgres:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: postgres\n      POSTGRES_PASSWORD: postgres\n      POSTGRES_DB: app\n    ports:\n      - '\${POSTGRES_PORT:-5432}:5432'\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n    healthcheck:\n      test: ['CMD-SHELL', 'pg_isready -U postgres -d app']\n      interval: 10s\n      timeout: 5s\n      retries: 5\n\n  liquibase:\n    image: liquibase/liquibase:5.0.3\n    entrypoint: ['/bin/sh', '-c', 'lpm add postgresql --global >/dev/null 2>&1 || true; exec /liquibase/docker-entrypoint.sh "$@"', '--']\n    depends_on:\n      postgres:\n        condition: service_healthy\n    environment:\n      LIQUIBASE_COMMAND_URL: jdbc:postgresql://postgres:5432/\${POSTGRES_DB:-app}\n      LIQUIBASE_COMMAND_USERNAME: \${POSTGRES_USER:-postgres}\n      LIQUIBASE_COMMAND_PASSWORD: \${POSTGRES_PASSWORD:-postgres}\n    volumes:\n      - ./migrations:/liquibase/changelog\n      - ./liquibase.properties:/liquibase/liquibase.docker.properties\n    working_dir: /liquibase\n\nvolumes:\n  postgres_data:\n`;
}

function liquibaseSampleProperties(): string {
  return `# Copy to liquibase.properties before running migrations:\n#   cp liquibase.sample.properties liquibase.properties\n#\n# JDBC settings for pnpm db:migrate are provided by docker-compose using .env\n# POSTGRES_* values with the internal service URL (postgres:5432). POSTGRES_PORT\n# only maps the host port (e.g. localhost:5433) and must not be used here.\n\nchangeLogFile: db.changelog-master.yaml\n`;
}

function changelogMaster(): string {
  return `databaseChangeLog:\n  - include:\n      file: changes/001-auth-tables.yaml\n      relativeToChangelogFile: true\n`;
}

function authTablesChangelog(): string {
  return `databaseChangeLog:\n  - changeSet:\n      id: 001-create-better-auth-user\n      author: nest-backend\n      changes:\n        - createTable:\n            tableName: user\n            columns:\n              - column: { name: id, type: text, constraints: { primaryKey: true, nullable: false } }\n              - column: { name: name, type: text, constraints: { nullable: false } }\n              - column: { name: email, type: text, constraints: { nullable: false, unique: true } }\n              - column: { name: email_verified, type: boolean, defaultValueBoolean: false, constraints: { nullable: false } }\n              - column: { name: image, type: text }\n              - column: { name: created_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n              - column: { name: updated_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n  - changeSet:\n      id: 002-create-better-auth-session\n      author: nest-backend\n      changes:\n        - createTable:\n            tableName: session\n            columns:\n              - column: { name: id, type: text, constraints: { primaryKey: true, nullable: false } }\n              - column: { name: expires_at, type: timestamptz, constraints: { nullable: false } }\n              - column: { name: token, type: text, constraints: { nullable: false, unique: true } }\n              - column: { name: created_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n              - column: { name: updated_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n              - column: { name: ip_address, type: text }\n              - column: { name: user_agent, type: text }\n              - column: { name: user_id, type: text, constraints: { nullable: false, foreignKeyName: fk_session_user_id, references: user(id), deleteCascade: true } }\n        - createIndex:\n            tableName: session\n            indexName: idx_session_user_id\n            columns:\n              - column: { name: user_id }\n  - changeSet:\n      id: 003-create-better-auth-account\n      author: nest-backend\n      changes:\n        - createTable:\n            tableName: account\n            columns:\n              - column: { name: id, type: text, constraints: { primaryKey: true, nullable: false } }\n              - column: { name: account_id, type: text, constraints: { nullable: false } }\n              - column: { name: provider_id, type: text, constraints: { nullable: false } }\n              - column: { name: user_id, type: text, constraints: { nullable: false, foreignKeyName: fk_account_user_id, references: user(id), deleteCascade: true } }\n              - column: { name: access_token, type: text }\n              - column: { name: refresh_token, type: text }\n              - column: { name: id_token, type: text }\n              - column: { name: access_token_expires_at, type: timestamptz }\n              - column: { name: refresh_token_expires_at, type: timestamptz }\n              - column: { name: scope, type: text }\n              - column: { name: password, type: text }\n              - column: { name: created_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n              - column: { name: updated_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n        - createIndex:\n            tableName: account\n            indexName: idx_account_user_id\n            columns:\n              - column: { name: user_id }\n  - changeSet:\n      id: 004-create-better-auth-verification\n      author: nest-backend\n      changes:\n        - createTable:\n            tableName: verification\n            columns:\n              - column: { name: id, type: text, constraints: { primaryKey: true, nullable: false } }\n              - column: { name: identifier, type: text, constraints: { nullable: false } }\n              - column: { name: value, type: text, constraints: { nullable: false } }\n              - column: { name: expires_at, type: timestamptz, constraints: { nullable: false } }\n              - column: { name: created_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n              - column: { name: updated_at, type: timestamptz, defaultValueComputed: CURRENT_TIMESTAMP, constraints: { nullable: false } }\n        - createIndex:\n            tableName: verification\n            indexName: idx_verification_identifier\n            columns:\n              - column: { name: identifier }\n`;
}

function mainTs(options: ProjectOptions): string {
  return `import { ValidationPipe, VersioningType } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\nimport { NestFactory } from '@nestjs/core';\nimport { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';\nimport compression = require('compression');\nimport helmet from 'helmet';\nimport { AppModule } from './app.module';\nimport { HttpExceptionFilter } from './common/filters/http-exception.filter';\n\nasync function bootstrap(): Promise<void> {\n  const app = await NestFactory.create(AppModule, { bufferLogs: true });\n  const config = app.get(ConfigService);\n  const port = config.getOrThrow<number>('PORT');\n\n  app.enableShutdownHooks();\n  app.enableCors({ origin: config.getOrThrow<string>('APP_ORIGIN'), credentials: true });\n  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });\n  app.use(\n    helmet({\n      crossOriginEmbedderPolicy: false,\n      contentSecurityPolicy: {\n        directives: {\n          defaultSrc: ["'self'", 'unpkg.com'],\n          styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'unpkg.com'],\n          fontSrc: ["'self'", 'fonts.gstatic.com', 'fonts.scalar.com', 'data:'],\n          imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],\n          scriptSrc: ["'self'", "https: 'unsafe-inline'", 'cdn.jsdelivr.net', "'unsafe-eval'"],\n          connectSrc: ["'self'", 'cdn.jsdelivr.net', 'proxy.scalar.com'],\n        },\n      },\n    }),\n  );\n  app.use(compression());\n  app.useGlobalFilters(new HttpExceptionFilter());\n  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));\n\n  const openApiConfig = new DocumentBuilder()\n    .setTitle('${appTitle(options)} API')\n    .setDescription('Production-grade NestJS API')\n    .setVersion('1.0.0')\n    .addBearerAuth()\n    .build();\n  const document = SwaggerModule.createDocument(app, openApiConfig);\n  SwaggerModule.setup('openapi', app, document, { swaggerUiEnabled: false, jsonDocumentUrl: 'openapi.json' });\n\n  const { apiReference } = await import('@scalar/nestjs-api-reference');\n  app.use(\n    '/docs',\n    apiReference({\n      url: '/openapi.json',\n      pageTitle: '${appTitle(options)} API Docs',\n    }),\n  );\n\n  await app.listen(port);\n}\n\nvoid bootstrap();\n`;
}

function appModuleTs(): string {
  return `import { Module } from '@nestjs/common';\nimport { ConfigModule, ConfigService } from '@nestjs/config';\nimport { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';\nimport { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';\nimport { LoggerModule } from 'nestjs-pino';\nimport { Pool } from 'pg';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { createAuth } from './auth/auth.factory';\nimport { validateEnv } from './common/config/env.validation';\nimport { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';\nimport { PG_POOL, PgPoolModule } from './database/pg-pool.module';\nimport { DatabaseModule } from './database/database.module';\nimport { HealthModule } from './health/health.module';\nimport { AuthModule } from '@thallesp/nestjs-better-auth';\n\n@Module({\n  imports: [\n    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),\n    PgPoolModule,\n    LoggerModule.forRoot({ pinoHttp: { level: process.env.LOG_LEVEL ?? 'info' } }),\n    ThrottlerModule.forRoot([{ ttl: Number(process.env.THROTTLE_TTL_MS ?? 60000), limit: Number(process.env.THROTTLE_LIMIT ?? 100) }]),\n    AuthModule.forRootAsync({\n      imports: [ConfigModule, PgPoolModule],\n      inject: [PG_POOL, ConfigService],\n      useFactory: (pool: Pool, config: ConfigService) => ({ auth: createAuth(pool, config) }),\n    }),\n    DatabaseModule,\n    HealthModule,\n  ],\n  controllers: [AppController],\n  providers: [\n    AppService,\n    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },\n    { provide: APP_GUARD, useClass: ThrottlerGuard },\n  ],\n})\nexport class AppModule {}\n`;
}

function appControllerTs(): string {
  return `import { Controller, Get } from '@nestjs/common';\nimport { ApiOkResponse, ApiTags } from '@nestjs/swagger';\nimport { SkipThrottle } from '@nestjs/throttler';\nimport { Public } from '@thallesp/nestjs-better-auth';\nimport { AppService } from './app.service';\n\n@Public()\n@SkipThrottle()\n@ApiTags('app')\n@Controller({ path: '/', version: '1' })\nexport class AppController {\n  constructor(private readonly appService: AppService) {}\n\n  @Get()\n  @ApiOkResponse({ description: 'API metadata' })\n  getRoot(): { name: string; uptime: number } {\n    return this.appService.getRoot();\n  }\n}\n`;
}

function appServiceTs(): string {
  return `import { Injectable } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\n\n@Injectable()\nexport class AppService {\n  constructor(private readonly configService: ConfigService) {}\n\n  getRoot(): { name: string; uptime: number } {\n    return { name: this.configService.getOrThrow<string>('APP_NAME'), uptime: process.uptime() };\n  }\n}\n`;
}

function authFactoryTs(): string {
  return `import { ConfigService } from '@nestjs/config';\nimport { betterAuth } from 'better-auth';\nimport { Pool } from 'pg';\n\nexport function createAuth(pool: Pool, config: ConfigService) {\n  return betterAuth({\n    database: pool,\n    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),\n    baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),\n    emailAndPassword: { enabled: true },\n    user: {\n      fields: {\n        emailVerified: 'email_verified',\n        createdAt: 'created_at',\n        updatedAt: 'updated_at',\n      },\n    },\n    session: {\n      fields: {\n        expiresAt: 'expires_at',\n        createdAt: 'created_at',\n        updatedAt: 'updated_at',\n        ipAddress: 'ip_address',\n        userAgent: 'user_agent',\n        userId: 'user_id',\n      },\n    },\n    account: {\n      fields: {\n        accountId: 'account_id',\n        providerId: 'provider_id',\n        userId: 'user_id',\n        accessToken: 'access_token',\n        refreshToken: 'refresh_token',\n        idToken: 'id_token',\n        accessTokenExpiresAt: 'access_token_expires_at',\n        refreshTokenExpiresAt: 'refresh_token_expires_at',\n        createdAt: 'created_at',\n        updatedAt: 'updated_at',\n      },\n    },\n    verification: {\n      fields: {\n        expiresAt: 'expires_at',\n        createdAt: 'created_at',\n        updatedAt: 'updated_at',\n      },\n    },\n    experimental: { joins: true },\n  });\n}\n`;
}

function pgPoolModuleTs(): string {
  return `import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\nimport { Pool } from 'pg';\n\nexport const PG_POOL = Symbol('PG_POOL');\n\n@Global()\n@Module({\n  providers: [\n    {\n      provide: PG_POOL,\n      inject: [ConfigService],\n      useFactory: (config: ConfigService) =>\n        new Pool({\n          connectionString: config.getOrThrow<string>('DATABASE_URL'),\n          max: 20,\n          idleTimeoutMillis: 30_000,\n          connectionTimeoutMillis: 2_000,\n        }),\n    },\n  ],\n  exports: [PG_POOL],\n})\nexport class PgPoolModule implements OnModuleDestroy {\n  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}\n\n  async onModuleDestroy(): Promise<void> {\n    await this.pool.end();\n  }\n}\n`;
}

function envValidationTs(): string {
  return `import { plainToInstance, Transform } from 'class-transformer';\nimport { IsEnum, IsInt, IsString, IsUrl, Min, MinLength, validateSync } from 'class-validator';\n\nenum NodeEnv { Development = 'development', Test = 'test', Production = 'production' }\n\nconst DEFAULT_AUTH_SECRET = 'change-me-to-a-long-random-secret';\n\nclass EnvironmentVariables {\n  @IsEnum(NodeEnv) NODE_ENV: NodeEnv = NodeEnv.Development;\n  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) PORT = 3000;\n  @IsString() APP_NAME!: string;\n  @IsUrl({ require_tld: false }) APP_ORIGIN!: string;\n  @IsString() DATABASE_URL!: string;\n  @IsString() @MinLength(32) BETTER_AUTH_SECRET!: string;\n  @IsUrl({ require_tld: false }) BETTER_AUTH_URL!: string;\n  @IsString() LOG_LEVEL = 'info';\n  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) THROTTLE_TTL_MS = 60000;\n  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) THROTTLE_LIMIT = 100;\n}\n\nexport function validateEnv(config: Record<string, unknown>): EnvironmentVariables {\n  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });\n  const errors = validateSync(validatedConfig, { skipMissingProperties: false });\n  if (errors.length > 0) throw new Error(errors.toString());\n  if (validatedConfig.NODE_ENV === NodeEnv.Production && validatedConfig.BETTER_AUTH_SECRET === DEFAULT_AUTH_SECRET) {\n    throw new Error('BETTER_AUTH_SECRET must be changed before running in production.');\n  }\n  return validatedConfig;\n}\n`;
}

function httpExceptionFilterTs(): string {
  return `import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';\nimport { Request, Response } from 'express';\n\n@Catch()\nexport class HttpExceptionFilter implements ExceptionFilter {\n  private readonly logger = new Logger(HttpExceptionFilter.name);\n\n  catch(exception: unknown, host: ArgumentsHost): void {\n    const ctx = host.switchToHttp();\n    const response = ctx.getResponse<Response>();\n    const request = ctx.getRequest<Request>();\n    const isHttpException = exception instanceof HttpException;\n    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;\n\n    if (!isHttpException) {\n      this.logger.error(exception);\n    }\n\n    const message = isHttpException\n      ? exception.getResponse()\n      : 'Internal server error';\n\n    response.status(status).json({\n      statusCode: status,\n      timestamp: new Date().toISOString(),\n      path: request.url,\n      message,\n    });\n  }\n}\n`;
}

function requestIdInterceptorTs(): string {
  return `import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';\nimport { randomUUID } from 'node:crypto';\nimport { Observable } from 'rxjs';\n\n@Injectable()\nexport class RequestIdInterceptor implements NestInterceptor {\n  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {\n    const response = context.switchToHttp().getResponse<{ setHeader(name: string, value: string): void }>();\n    response.setHeader('x-request-id', randomUUID());\n    return next.handle();\n  }\n}\n`;
}

function healthModuleTs(): string {
  return `import { Module } from '@nestjs/common';\nimport { TerminusModule } from '@nestjs/terminus';\nimport { DatabaseHealthIndicator } from './database.health';\nimport { HealthController } from './health.controller';\n\n@Module({\n  imports: [TerminusModule],\n  controllers: [HealthController],\n  providers: [DatabaseHealthIndicator],\n})\nexport class HealthModule {}\n`;
}

function healthControllerTs(): string {
  return `import { Controller, Get } from '@nestjs/common';\nimport { HealthCheckError, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';\nimport { ApiTags } from '@nestjs/swagger';\nimport { SkipThrottle } from '@nestjs/throttler';\nimport { Public } from '@thallesp/nestjs-better-auth';\nimport { DatabaseHealthIndicator } from './database.health';\n\n@Public()\n@SkipThrottle()\n@ApiTags('health')\n@Controller({ path: 'health', version: '1' })\nexport class HealthController {\n  constructor(\n    private readonly health: HealthCheckService,\n    private readonly memory: MemoryHealthIndicator,\n    private readonly database: DatabaseHealthIndicator,\n  ) {}\n\n  @Get()\n  async check(): Promise<{ status: string; checks: Record<string, unknown> }> {\n    const result = await this.health.check([\n      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),\n      () => this.database.isHealthy('database'),\n    ]);\n\n    const body = { status: result.status, checks: result.details };\n    if (result.status === 'error') {\n      throw new HealthCheckError('Health check failed', body);\n    }\n\n    return body;\n  }\n}\n`;
}

function appServiceSpecTs(): string {
  return `import { AppService } from '../src/app.service';\n\ndescribe('AppService', () => {\n  it('returns API metadata', () => {\n    const service = new AppService({ getOrThrow: () => 'Test API' } as never);\n    const result = service.getRoot();\n    expect(result.name).toBe('Test API');\n    expect(result.uptime).toBeGreaterThan(0);\n  });\n});\n`;
}

function e2eSpecTs(): string {
  return `import { VersioningType } from '@nestjs/common';\nimport { Test } from '@nestjs/testing';\nimport { ConfigService } from '@nestjs/config';\nimport request from 'supertest';\nimport { AppController } from '../src/app.controller';\nimport { AppService } from '../src/app.service';\n\ndescribe('App (e2e)', () => {\n  it('returns API metadata', async () => {\n    const moduleRef = await Test.createTestingModule({\n      controllers: [AppController],\n      providers: [\n        AppService,\n        {\n          provide: ConfigService,\n          useValue: { getOrThrow: (key: string) => (key === 'APP_NAME' ? 'Test API' : '') },\n        },\n      ],\n    }).compile();\n    const app = moduleRef.createNestApplication();\n    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });\n    await app.init();\n\n    await request(app.getHttpServer()).get('/v1').expect(200).expect({ name: 'Test API', uptime: expect.any(Number) });\n    await app.close();\n  });\n});\n`;
}

function integrationSpecTs(): string {
  return `import { Test } from '@nestjs/testing';\nimport { VersioningType } from '@nestjs/common';\nimport request from 'supertest';\nimport { AppModule } from '../src/app.module';\n\nconst runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';\n\ndescribe.runIf(runIntegration)('App (integration)', () => {\n  it('returns API metadata', async () => {\n    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();\n    const app = moduleRef.createNestApplication();\n    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });\n    await app.init();\n\n    await request(app.getHttpServer()).get('/v1').expect(200);\n    await app.close();\n  });\n});\n`;
}
