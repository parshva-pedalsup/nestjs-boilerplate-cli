import { type FileEntry, type ProjectOptions } from '../types.js';

export function drizzleFiles(_options: ProjectOptions): readonly FileEntry[] {
  return [
    { path: 'src/database/database.module.ts', content: databaseModuleTs() },
    { path: 'src/database/database.service.ts', content: databaseServiceTs() },
    { path: 'src/database/schema.ts', content: schemaTs() },
    { path: 'drizzle.config.ts', content: drizzleConfigTs() },
    { path: 'src/health/database.health.ts', content: databaseHealthTs() },
  ];
}

function databaseModuleTs(): string {
  return `import { Global, Module } from '@nestjs/common';\nimport { DatabaseService } from './database.service';\n\n@Global()\n@Module({ providers: [DatabaseService], exports: [DatabaseService] })\nexport class DatabaseModule {}\n`;
}

function databaseServiceTs(): string {
  return `import { Inject, Injectable } from '@nestjs/common';\nimport { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';\nimport { Pool } from 'pg';\nimport { PG_POOL } from './pg-pool.module';\nimport * as schema from './schema';\n\n@Injectable()\nexport class DatabaseService {\n  readonly db: NodePgDatabase<typeof schema>;\n\n  constructor(@Inject(PG_POOL) pool: Pool) {\n    this.db = drizzle(pool, { schema });\n  }\n}\n`;
}

function schemaTs(): string {
  return `import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';\n\nexport const user = pgTable('user', {\n  id: text('id').primaryKey(),\n  name: text('name').notNull(),\n  email: text('email').notNull().unique(),\n  emailVerified: boolean('email_verified').notNull().default(false),\n  image: text('image'),\n  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),\n  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),\n});\n\nexport const session = pgTable('session', {\n  id: text('id').primaryKey(),\n  token: text('token').notNull().unique(),\n  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),\n  ipAddress: text('ip_address'),\n  userAgent: text('user_agent'),\n  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),\n  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),\n  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),\n});\n\nexport const account = pgTable('account', {\n  id: text('id').primaryKey(),\n  accountId: text('account_id').notNull(),\n  providerId: text('provider_id').notNull(),\n  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),\n  accessToken: text('access_token'),\n  refreshToken: text('refresh_token'),\n  idToken: text('id_token'),\n  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),\n  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),\n  scope: text('scope'),\n  password: text('password'),\n  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),\n  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),\n});\n\nexport const verification = pgTable('verification', {\n  id: text('id').primaryKey(),\n  identifier: text('identifier').notNull(),\n  value: text('value').notNull(),\n  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),\n  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),\n  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),\n});\n`;
}

function drizzleConfigTs(): string {
  return `import { defineConfig } from 'drizzle-kit';\n\nexport default defineConfig({\n  schema: './src/database/schema.ts',\n  out: './drizzle',\n  dialect: 'postgresql',\n  dbCredentials: { url: process.env.DATABASE_URL ?? '' },\n  strict: true,\n  verbose: true,\n});\n`;
}

function databaseHealthTs(): string {
  return `import { Inject, Injectable } from '@nestjs/common';\nimport { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';\nimport { Pool } from 'pg';\nimport { PG_POOL } from '../database/pg-pool.module';\n\n@Injectable()\nexport class DatabaseHealthIndicator {\n  constructor(\n    private readonly healthIndicatorService: HealthIndicatorService,\n    @Inject(PG_POOL) private readonly pool: Pool,\n  ) {}\n\n  async isHealthy(key: string): Promise<HealthIndicatorResult> {\n    const indicator = this.healthIndicatorService.check(key);\n    try {\n      await this.pool.query('SELECT 1');\n      return indicator.up();\n    } catch (error) {\n      const message = error instanceof Error ? error.message : 'Database unavailable';\n      return indicator.down({ message });\n    }\n  }\n}\n`;
}
