import { type OrmChoice, type ProjectOptions } from '../types.js';

export function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function packageJson(options: ProjectOptions): string {
  const dependencies: Record<string, string> = {
    '@nestjs/common': 'latest',
    '@nestjs/config': 'latest',
    '@nestjs/core': 'latest',
    '@nestjs/platform-express': 'latest',
    '@nestjs/swagger': 'latest',
    '@nestjs/terminus': 'latest',
    '@nestjs/throttler': 'latest',
    '@scalar/nestjs-api-reference': 'latest',
    '@thallesp/nestjs-better-auth': 'latest',
    'better-auth': 'latest',
    'class-transformer': 'latest',
    'class-validator': 'latest',
    compression: 'latest',
    helmet: 'latest',
    'nestjs-pino': 'latest',
    pg: 'latest',
    pino: 'latest',
    'pino-http': 'latest',
    'reflect-metadata': 'latest',
    rxjs: 'latest',
  };

  const devDependencies: Record<string, string> = {
    '@nestjs/cli': 'latest',
    '@nestjs/schematics': 'latest',
    '@nestjs/testing': 'latest',
    '@types/compression': 'latest',
    '@types/express': 'latest',
    '@types/node': 'latest',
    '@types/pg': 'latest',
    '@types/supertest': 'latest',
    dotenv: 'latest',
    oxfmt: 'latest',
    oxlint: 'latest',
    supertest: 'latest',
    'tsconfig-paths': 'latest',
    'ts-node': 'latest',
    tsx: 'latest',
    typescript: 'latest',
    vitest: 'latest',
  };

  addOrmDependencies(options.orm, dependencies, devDependencies);

  return json({
    name: options.packageName,
    version: '0.1.0',
    private: true,
    type: 'commonjs',
    scripts: scriptsFor(options.orm),
    dependencies,
    devDependencies,
  });
}

function addOrmDependencies(
  orm: OrmChoice,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
): void {
  if (orm === 'typeorm') {
    dependencies['@nestjs/typeorm'] = 'latest';
    dependencies.typeorm = 'latest';
  }
  if (orm === 'prisma') {
    dependencies['@prisma/adapter-pg'] = 'latest';
    dependencies['@prisma/client'] = 'latest';
    devDependencies.prisma = 'latest';
  }
  if (orm === 'drizzle') {
    dependencies['drizzle-orm'] = 'latest';
    devDependencies['drizzle-kit'] = 'latest';
  }
}

function scriptsFor(orm: OrmChoice): Record<string, string> {
  const scripts: Record<string, string> = {
    build: 'nest build',
    start: 'node dist/main.js',
    'start:dev': 'nest start --watch',
    'start:prod': 'node dist/main.js',
    typecheck: 'tsc -p tsconfig.json --noEmit',
    lint: 'oxlint .',
    format: 'oxfmt --write .',
    'format:check': 'oxfmt --check .',
    test: 'vitest run',
    'test:watch': 'vitest',
    'db:migrate': 'docker compose run --rm liquibase update',
    'db:rollback': 'docker compose run --rm liquibase rollbackCount 1',
  };

  if (orm === 'prisma') {
    scripts['db:generate'] = 'prisma generate';
    scripts['db:studio'] = 'prisma studio';
    scripts.postinstall = 'prisma generate';
  }
  if (orm === 'drizzle') scripts['db:studio'] = 'drizzle-kit studio';

  return scripts;
}

export function appTitle(options: ProjectOptions): string {
  return options.projectName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}