import { type FileEntry, type ProjectOptions } from '../types.js';

export function prismaFiles(_options: ProjectOptions): readonly FileEntry[] {
  return [
    { path: 'src/database/database.module.ts', content: databaseModuleTs() },
    { path: 'src/database/prisma.service.ts', content: prismaServiceTs() },
    { path: 'prisma.config.ts', content: prismaConfigTs() },
    { path: 'prisma/schema.prisma', content: schemaPrisma() },
    { path: 'src/health/database.health.ts', content: databaseHealthTs() },
  ];
}

function databaseModuleTs(): string {
  return `import { Global, Module } from '@nestjs/common';\nimport { PrismaService } from './prisma.service';\n\n@Global()\n@Module({ providers: [PrismaService], exports: [PrismaService] })\nexport class DatabaseModule {}\n`;
}

function prismaServiceTs(): string {
  return `import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\nimport { PrismaPg } from '@prisma/adapter-pg';\nimport { PrismaClient } from '../generated/prisma/client';\n\n@Injectable()\nexport class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {\n  constructor(config: ConfigService) {\n    super({\n      adapter: new PrismaPg({\n        connectionString: config.getOrThrow<string>('DATABASE_URL'),\n      }),\n    });\n  }\n\n  async onModuleInit(): Promise<void> {\n    await this.$connect();\n  }\n\n  async onModuleDestroy(): Promise<void> {\n    await this.$disconnect();\n  }\n}\n`;
}

function prismaConfigTs(): string {
  return `import 'dotenv/config';\nimport { defineConfig, env } from 'prisma/config';\n\nexport default defineConfig({\n  schema: 'prisma/schema.prisma',\n  datasource: {\n    url: env('DATABASE_URL'),\n  },\n});\n`;
}

function schemaPrisma(): string {
  return `generator client {\n  provider     = "prisma-client"\n  output       = "../src/generated/prisma"\n  moduleFormat = "cjs"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id            String    @id\n  name          String\n  email         String    @unique\n  emailVerified Boolean   @default(false) @map("email_verified")\n  image         String?\n  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz\n  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz\n  sessions      Session[]\n  accounts      Account[]\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  token     String   @unique\n  expiresAt DateTime @map("expires_at") @db.Timestamptz\n  ipAddress String?  @map("ip_address")\n  userAgent String?  @map("user_agent")\n  userId    String   @map("user_id")\n  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz\n  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String    @map("account_id")\n  providerId            String    @map("provider_id")\n  userId                String    @map("user_id")\n  accessToken           String?   @map("access_token")\n  refreshToken          String?   @map("refresh_token")\n  idToken               String?   @map("id_token")\n  accessTokenExpiresAt  DateTime? @map("access_token_expires_at") @db.Timestamptz\n  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at") @db.Timestamptz\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz\n  updatedAt             DateTime  @updatedAt @map("updated_at") @db.Timestamptz\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime @map("expires_at") @db.Timestamptz\n  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz\n  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz\n\n  @@map("verification")\n}\n`;
}

function databaseHealthTs(): string {
  return `import { Injectable } from '@nestjs/common';\nimport { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';\nimport { PrismaService } from '../database/prisma.service';\n\n@Injectable()\nexport class DatabaseHealthIndicator {\n  constructor(\n    private readonly healthIndicatorService: HealthIndicatorService,\n    private readonly prisma: PrismaService,\n  ) {}\n\n  async isHealthy(key: string): Promise<HealthIndicatorResult> {\n    const indicator = this.healthIndicatorService.check(key);\n    try {\n      await this.prisma.$queryRaw\`SELECT 1\`;\n      return indicator.up();\n    } catch (error) {\n      const message = error instanceof Error ? error.message : 'Database unavailable';\n      return indicator.down({ message });\n    }\n  }\n}\n`;
}
