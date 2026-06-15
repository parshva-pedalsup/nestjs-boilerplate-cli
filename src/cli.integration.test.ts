import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { assertUniqueFilePaths } from './generator.js';

const require = createRequire(import.meta.url);
const { version: cliVersion } = require('../package.json') as { version: string };

const distDir = dirname(fileURLToPath(import.meta.url));
const cliEntry = join(distDir, 'index.js');
const tempDirs: string[] = [];

after(async () => {
  await Promise.all(tempDirs.map(async (dir) => rm(dir, { recursive: true, force: true })));
});

function runCli(args: readonly string[], cwd: string, options?: { stdio?: 'pipe' | 'inherit' }) {
  return spawnSync(process.execPath, [cliEntry, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: options?.stdio ?? 'pipe',
  });
}

async function assertExists(path: string): Promise<void> {
  await access(path);
}

async function assertNotExists(path: string): Promise<void> {
  await assert.rejects(() => access(path));
}

async function assertLiquibaseScaffold(projectDir: string): Promise<void> {
  await assertExists(join(projectDir, 'liquibase.sample.properties'));
  await assertNotExists(join(projectDir, 'liquibase.properties'));

  const gitignore = await readFile(join(projectDir, '.gitignore'), 'utf8');
  assert.match(gitignore, /liquibase\.properties/);
  assert.match(gitignore, /!liquibase\.sample\.properties/);

  const packageJson = await readJson<{ scripts: Record<string, string> }>(join(projectDir, 'package.json'));
  assert.equal(packageJson.scripts['db:migrate'], 'docker compose run --rm liquibase update');
  assert.equal(packageJson.scripts['db:rollback'], 'docker compose run --rm liquibase rollback-count --count=1');
  assert.doesNotMatch(packageJson.scripts['db:migrate'], /--url=/);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

function assertPinnedDependencies(packageJson: {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines?: { node?: string };
}): void {
  assert.ok(packageJson.engines?.node);
  for (const value of Object.values(packageJson.dependencies)) {
    assert.notEqual(value, 'latest');
  }
  for (const value of Object.values(packageJson.devDependencies)) {
    assert.notEqual(value, 'latest');
  }
}

async function assertProductionScaffold(projectDir: string, orm: 'typeorm' | 'prisma' | 'drizzle'): Promise<void> {
  const appModule = await readFile(join(projectDir, 'src/app.module.ts'), 'utf8');
  assert.match(appModule, /ThrottlerGuard/);
  assert.match(appModule, /APP_GUARD/);
  assert.match(appModule, /PgPoolModule/);
  assert.match(appModule, /PG_POOL/);
  assert.match(appModule, /createAuth/);
  assert.match(appModule, /AuthModule\.forRootAsync/);

  const packageJson = await readJson<{ dependencies: Record<string, string> }>(join(projectDir, 'package.json'));
  const betterAuthNest = packageJson.dependencies['@thallesp/nestjs-better-auth'];
  assert.ok(betterAuthNest);
  assert.match(betterAuthNest, /^[\^~]?2\./);

  const mainTs = await readFile(join(projectDir, 'src/main.ts'), 'utf8');
  assert.doesNotMatch(mainTs, /eval\(/);
  assert.match(mainTs, /import compression = require\('compression'\)/);
  assert.match(mainTs, /import\('@scalar\/nestjs-api-reference'\)/);

  const tsconfig = await readJson<{ compilerOptions: Record<string, unknown> }>(join(projectDir, 'tsconfig.json'));
  assert.equal(tsconfig.compilerOptions.esModuleInterop, true);

  const envValidation = await readFile(join(projectDir, 'src/common/config/env.validation.ts'), 'utf8');
  assert.match(envValidation, /MinLength\(32\)/);

  const healthController = await readFile(join(projectDir, 'src/health/health.controller.ts'), 'utf8');
  assert.match(healthController, /DatabaseHealthIndicator/);
  assert.match(healthController, /SkipThrottle/);
  assert.match(healthController, /checks: result\.details/);
  assert.doesNotMatch(healthController, /@HealthCheck\(\)/);

  await assertExists(join(projectDir, 'src/health/database.health.ts'));
  await assertExists(join(projectDir, 'src/auth/auth.factory.ts'));
  await assertExists(join(projectDir, 'src/database/pg-pool.module.ts'));
  await assertExists(join(projectDir, 'test/app.service.spec.ts'));
  await assertExists(join(projectDir, 'test/app.integration-spec.ts'));
  await assertNotExists(join(projectDir, 'src/auth/auth.config.ts'));

  const authFactory = await readFile(join(projectDir, 'src/auth/auth.factory.ts'), 'utf8');
  assert.match(authFactory, /experimental: \{ joins: true \}/);
  assert.match(authFactory, /email_verified/);

  if (orm === 'drizzle') {
    const databaseService = await readFile(join(projectDir, 'src/database/database.service.ts'), 'utf8');
    assert.match(databaseService, /PG_POOL/);
  }
}

async function generateProject(orm: 'typeorm' | 'prisma' | 'drizzle') {
  const workspace = await mkdtemp(join(tmpdir(), `create-nest-backend-${orm}-`));
  tempDirs.push(workspace);

  const projectName = `sample-${orm}`;
  const result = runCli([projectName, '--orm', orm, '--package-manager', 'npm'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  return { projectDir: join(workspace, projectName), output: result.stdout };
}

test('prints help output', () => {
  const result = runCli(['--help'], distDir);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /create-nestjs-backend <project-name>/);
  assert.match(result.stdout, /--orm <typeorm\|prisma\|drizzle>/);
  assert.match(result.stdout, /--agents-md/);
  assert.match(result.stdout, /--dry-run/);
  assert.match(result.stdout, /--yes, -y/);
  assert.match(result.stdout, /Non-interactive usage requires all options/);
  assert.match(result.stdout, /create-nestjs-backend api --orm typeorm --package-manager npm --dry-run/);
  assert.match(result.stdout, /create-nestjs-backend api --orm drizzle --package-manager yarn --agents-md/);
});

test('prints version output', () => {
  const result = runCli(['--version'], distDir);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), cliVersion);
});

test('rejects unsafe project names', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-unsafe-'));
  tempDirs.push(workspace);

  for (const projectName of ['.', '..']) {
    const result = runCli([projectName, '--orm', 'prisma', '--package-manager', 'npm'], workspace);
    assert.notEqual(result.status, 0, `expected failure for project name: ${projectName}`);
    assert.match(result.stderr, /subdirectory name inside the current working directory/);
  }
});

test('rejects non-interactive runs without required flags', () => {
  const result = runCli([], distDir, { stdio: 'pipe' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Non-interactive mode requires/);
});

test('rejects conflicting AGENTS.md flags', () => {
  const result = runCli(
    ['conflict-project', '--orm', 'prisma', '--package-manager', 'npm', '--agents-md', '--no-agents-md'],
    distDir,
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Use only one of --agents-md or --no-agents-md/);
});

test('--dry-run prints generated files without creating the project', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-dry-run-'));
  tempDirs.push(workspace);

  const result = runCli(['dry-run-project', '--orm', 'prisma', '--package-manager', 'npm', '--dry-run'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Dry run for dry-run-project/);
  assert.match(result.stdout, /Files that would be generated \(\d+\):/);
  assert.match(result.stdout, /package\.json/);
  assert.match(result.stdout, /docs\/getting-started\.md/);
  await assertNotExists(join(workspace, 'dry-run-project'));
});

test('--yes fills non-interactive defaults', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-yes-'));
  tempDirs.push(workspace);

  const result = runCli(['yes-project', '--yes'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const projectDir = join(workspace, 'yes-project');
  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }>(join(projectDir, 'package.json'));
  assert.ok(packageJson.dependencies['@prisma/client']);
  assert.ok(packageJson.devDependencies.prisma);
  await assertNotExists(join(projectDir, 'AGENTS.md'));
});

test('rejects writing into a non-empty directory without --force', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-existing-'));
  tempDirs.push(workspace);

  const projectName = 'existing-project';
  const projectDir = join(workspace, projectName);
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, 'keep.txt'), 'do not delete', 'utf8');

  const result = runCli([projectName, '--orm', 'prisma', '--package-manager', 'npm'], workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Target directory is not empty/);
});

test('merges into a non-empty directory with --force and preserves unrelated files', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-force-'));
  tempDirs.push(workspace);

  const projectName = 'force-project';
  const projectDir = join(workspace, projectName);
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, 'keep.txt'), 'do not delete', 'utf8');

  const result = runCli([projectName, '--orm', 'prisma', '--package-manager', 'npm', '--force'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Generated \d+ files/);
  assert.match(result.stdout, /Merged into existing directory without overwriting generated files/);

  const keep = await readFile(join(projectDir, 'keep.txt'), 'utf8');
  assert.equal(keep, 'do not delete');
  await assertExists(join(projectDir, 'package.json'));
});

test('--force reports overwritten generated files', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-force-overwrite-'));
  tempDirs.push(workspace);

  const projectName = 'force-overwrite-project';
  const projectDir = join(workspace, projectName);
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, 'package.json'), '{"name":"old"}\n', 'utf8');

  const result = runCli([projectName, '--orm', 'prisma', '--package-manager', 'npm', '--force'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Overwrote \d+ generated files:/);
  assert.match(result.stdout, /package\.json/);
});

test('assertUniqueFilePaths rejects duplicate template paths', () => {
  assert.throws(
    () =>
      assertUniqueFilePaths([
        { path: 'package.json', content: '{}' },
        { path: 'package.json', content: '{}' },
      ]),
    /Duplicate template file path: package\.json/,
  );
});

test('generates liquibase sample properties and properties-based migration scripts', async () => {
  const { projectDir, output } = await generateProject('prisma');
  assert.match(output, /cp liquibase\.sample\.properties liquibase\.properties/);
  await assertLiquibaseScaffold(projectDir);

  const sample = await readFile(join(projectDir, 'liquibase.sample.properties'), 'utf8');
  assert.match(sample, /changeLogFile: db\.changelog-master\.yaml/);
  assert.doesNotMatch(sample, /liquibase\.command\.url:/);
  assert.match(sample, /POSTGRES_PORT/);

  const compose = await readFile(join(projectDir, 'docker-compose.yml'), 'utf8');
  assert.match(compose, /liquibase\/liquibase:5\.0\.3/);
  assert.match(compose, /liquibase\.docker\.properties/);
  assert.match(compose, /LIQUIBASE_COMMAND_URL: jdbc:postgresql:\/\/postgres:5432\/\$\{POSTGRES_DB:-app\}/);
});

test('generates a working TypeORM scaffold shape', async () => {
  const { projectDir, output } = await generateProject('typeorm');
  assert.match(output, /Created sample-typeorm/);

  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }>(join(projectDir, 'package.json'));
  assert.ok(packageJson.dependencies.typeorm);
  assert.ok(packageJson.dependencies['@nestjs/typeorm']);
  assertPinnedDependencies(packageJson);

  await assertExists(join(projectDir, 'src/database/entities/account.entity.ts'));
  await assertExists(join(projectDir, 'src/database/entities/verification.entity.ts'));

  const userEntity = await readFile(join(projectDir, 'src/database/entities/user.entity.ts'), 'utf8');
  assert.match(userEntity, /@Entity\(\{ name: 'user' \}\)/);

  await assertProductionScaffold(projectDir, 'typeorm');
});

test('generates a working Prisma scaffold shape', async () => {
  const { projectDir } = await generateProject('prisma');
  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    engines?: { node?: string };
  }>(join(projectDir, 'package.json'));

  assert.ok(packageJson.dependencies['@prisma/adapter-pg']);
  assert.ok(packageJson.dependencies['@prisma/client']);
  assert.ok(packageJson.devDependencies.prisma);
  assert.match(packageJson.dependencies['@prisma/client'], /^[\^~]?7\./);
  assert.match(packageJson.dependencies['@prisma/adapter-pg'], /^[\^~]?7\./);
  assert.match(packageJson.devDependencies.prisma, /^[\^~]?7\./);
  assert.equal(packageJson.engines?.node, '>=20.19.0');
  assert.equal(packageJson.scripts.postinstall, 'prisma generate');
  assert.equal(packageJson.scripts['test:integration'], 'vitest run test/app.integration-spec.ts');
  assertPinnedDependencies(packageJson);

  await assertExists(join(projectDir, 'prisma.config.ts'));
  await assertExists(join(projectDir, 'CHANGELOG.md'));
  await assertExists(join(projectDir, 'docs/getting-started.md'));
  await assertExists(join(projectDir, 'docs/orm-notes.md'));

  const envExample = await readFile(join(projectDir, '.env.example'), 'utf8');
  assert.match(envExample, /# App/);
  assert.match(envExample, /# Database/);
  assert.match(envExample, /# Auth/);

  const gettingStarted = await readFile(join(projectDir, 'docs/getting-started.md'), 'utf8');
  assert.match(gettingStarted, /pnpm typecheck|npm run typecheck/);
  assert.match(gettingStarted, /Liquibase owns schema migrations/);

  const ormNotes = await readFile(join(projectDir, 'docs/orm-notes.md'), 'utf8');
  assert.match(ormNotes, /Prisma Client is the application data-access layer/);

  const prismaConfig = await readFile(join(projectDir, 'prisma.config.ts'), 'utf8');
  assert.match(prismaConfig, /env\('DATABASE_URL'\)/);
  assert.doesNotMatch(prismaConfig, /process\.env\.DATABASE_URL/);

  const schema = await readFile(join(projectDir, 'prisma/schema.prisma'), 'utf8');
  assert.match(schema, /provider\s+=\s+"prisma-client"/);
  assert.doesNotMatch(schema, /url\s+=\s+env\("DATABASE_URL"\)/);
  assert.match(schema, /@@map\("user"\)/);
  assert.match(schema, /model Account/);
  assert.match(schema, /@@map\("verification"\)/);

  const prismaService = await readFile(join(projectDir, 'src/database/prisma.service.ts'), 'utf8');
  assert.match(prismaService, /PrismaPg/);
  assert.match(prismaService, /generated\/prisma\/client/);

  await assertProductionScaffold(projectDir, 'prisma');
});

test('omits AGENTS.md by default', async () => {
  const { projectDir } = await generateProject('prisma');
  await assertNotExists(join(projectDir, 'AGENTS.md'));
});

test('generates AGENTS.md when --agents-md is passed', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'create-nest-backend-agents-'));
  tempDirs.push(workspace);

  const projectName = 'agents-project';
  const result = runCli([projectName, '--orm', 'drizzle', '--package-manager', 'pnpm', '--agents-md'], workspace);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const projectDir = join(workspace, projectName);
  const agents = await readFile(join(projectDir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /^# Agents Project — Agent Instructions/);
  assert.match(agents, /drizzle/);
  assert.match(agents, /pnpm start:dev/);
  assert.match(agents, /Liquibase owns schema/);
  assert.match(agents, /pnpm db:studio/);
});

test('generates a working Drizzle scaffold shape', async () => {
  const { projectDir } = await generateProject('drizzle');
  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    engines?: { node?: string };
  }>(join(projectDir, 'package.json'));

  assert.ok(packageJson.dependencies['drizzle-orm']);
  assert.ok(packageJson.devDependencies['drizzle-kit']);
  assertPinnedDependencies(packageJson);

  const schema = await readFile(join(projectDir, 'src/database/schema.ts'), 'utf8');
  assert.match(schema, /pgTable\('user'/);
  assert.match(schema, /pgTable\('account'/);
  assert.match(schema, /pgTable\('verification'/);

  await assertProductionScaffold(projectDir, 'drizzle');
});
