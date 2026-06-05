import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const distDir = dirname(fileURLToPath(import.meta.url));
const cliEntry = join(distDir, 'index.js');
const tempDirs: string[] = [];

after(async () => {
  await Promise.all(tempDirs.map(async (dir) => rm(dir, { recursive: true, force: true })));
});

function runCli(args: readonly string[], cwd: string) {
  return spawnSync(process.execPath, [cliEntry, ...args], { cwd, encoding: 'utf8' });
}

async function assertExists(path: string): Promise<void> {
  await access(path);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
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
  assert.match(result.stdout, /create-nest-backend <project-name>/);
  assert.match(result.stdout, /--orm <typeorm\|prisma\|drizzle>/);
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

test('generates a working TypeORM scaffold shape', async () => {
  const { projectDir, output } = await generateProject('typeorm');
  assert.match(output, /Created sample-typeorm/);

  const packageJson = await readJson<{ dependencies: Record<string, string> }>(join(projectDir, 'package.json'));
  assert.ok(packageJson.dependencies.typeorm);
  assert.ok(packageJson.dependencies['@nestjs/typeorm']);

  await assertExists(join(projectDir, 'src/database/entities/account.entity.ts'));
  await assertExists(join(projectDir, 'src/database/entities/verification.entity.ts'));

  const userEntity = await readFile(join(projectDir, 'src/database/entities/user.entity.ts'), 'utf8');
  assert.match(userEntity, /@Entity\(\{ name: 'user' \}\)/);

  const authConfig = await readFile(join(projectDir, 'src/auth/auth.config.ts'), 'utf8');
  assert.match(authConfig, /experimental: \{ joins: true \}/);
  assert.match(authConfig, /email_verified/);
});

test('generates a working Prisma scaffold shape', async () => {
  const { projectDir } = await generateProject('prisma');
  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  }>(join(projectDir, 'package.json'));

  assert.ok(packageJson.dependencies['@prisma/adapter-pg']);
  assert.ok(packageJson.dependencies['@prisma/client']);
  assert.ok(packageJson.devDependencies.prisma);
  assert.equal(packageJson.scripts.postinstall, 'prisma generate');

  await assertExists(join(projectDir, 'prisma.config.ts'));

  const schema = await readFile(join(projectDir, 'prisma/schema.prisma'), 'utf8');
  assert.match(schema, /provider\s+=\s+"prisma-client"/);
  assert.doesNotMatch(schema, /url\s+=\s+env\("DATABASE_URL"\)/);
  assert.match(schema, /@@map\("user"\)/);
  assert.match(schema, /model Account/);
  assert.match(schema, /@@map\("verification"\)/);

  const prismaService = await readFile(join(projectDir, 'src/database/prisma.service.ts'), 'utf8');
  assert.match(prismaService, /PrismaPg/);
  assert.match(prismaService, /generated\/prisma\/client/);
});

test('generates a working Drizzle scaffold shape', async () => {
  const { projectDir } = await generateProject('drizzle');
  const packageJson = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }>(join(projectDir, 'package.json'));

  assert.ok(packageJson.dependencies['drizzle-orm']);
  assert.ok(packageJson.devDependencies['drizzle-kit']);

  const schema = await readFile(join(projectDir, 'src/database/schema.ts'), 'utf8');
  assert.match(schema, /pgTable\('user'/);
  assert.match(schema, /pgTable\('account'/);
  assert.match(schema, /pgTable\('verification'/);
});