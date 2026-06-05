export const runtimeDependencies = {
  '@nestjs/common': '^11.0.0',
  '@nestjs/config': '^4.0.0',
  '@nestjs/core': '^11.0.0',
  '@nestjs/platform-express': '^11.0.0',
  '@nestjs/swagger': '^11.0.0',
  '@nestjs/terminus': '^11.0.0',
  '@nestjs/throttler': '^6.0.0',
  '@scalar/nestjs-api-reference': '^0.4.0',
  '@thallesp/nestjs-better-auth': '^2.6.0',
  'better-auth': '^1.5.0',
  'class-transformer': '^0.5.1',
  'class-validator': '^0.14.1',
  compression: '^1.8.0',
  helmet: '^8.0.0',
  'nestjs-pino': '^4.4.0',
  pg: '^8.13.0',
  pino: '^9.6.0',
  'pino-http': '^10.4.0',
  'reflect-metadata': '^0.2.2',
  rxjs: '^7.8.1',
} as const;

export const devDependencies = {
  '@nestjs/cli': '^11.0.0',
  '@nestjs/schematics': '^11.0.0',
  '@nestjs/testing': '^11.0.0',
  '@types/compression': '^1.7.5',
  '@types/express': '^5.0.0',
  '@types/node': '^22.10.0',
  '@types/pg': '^8.11.0',
  '@types/supertest': '^6.0.0',
  dotenv: '^16.4.0',
  oxfmt: '^0.9.0',
  oxlint: '^0.16.0',
  supertest: '^7.0.0',
  'tsconfig-paths': '^4.2.0',
  'ts-node': '^10.9.0',
  tsx: '^4.19.0',
  typescript: '^5.7.0',
  vitest: '^3.0.0',
} as const;

export const ormRuntimeDependencies = {
  typeorm: {
    '@nestjs/typeorm': '^11.0.0',
    typeorm: '^0.3.20',
  },
  prisma: {
    '@prisma/adapter-pg': '^7.0.0',
    '@prisma/client': '^7.0.0',
  },
  drizzle: {
    'drizzle-orm': '^0.39.0',
  },
} as const;

export const ormDevDependencies = {
  typeorm: {},
  prisma: {
    prisma: '^7.0.0',
  },
  drizzle: {
    'drizzle-kit': '^0.30.0',
  },
} as const;
