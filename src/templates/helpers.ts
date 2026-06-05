import { type OrmChoice, type ProjectOptions } from '../types.js';
import {
  devDependencies as pinnedDevDependencies,
  ormDevDependencies,
  ormRuntimeDependencies,
  runtimeDependencies as pinnedRuntimeDependencies,
} from './dependency-versions.js';

export function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function packageJson(options: ProjectOptions): string {
  const dependencies: Record<string, string> = {
    ...pinnedRuntimeDependencies,
    ...ormRuntimeDependencies[options.orm],
  };

  const devDependencies: Record<string, string> = {
    ...pinnedDevDependencies,
    ...ormDevDependencies[options.orm],
  };

  return json({
    name: options.packageName,
    version: '0.1.0',
    private: true,
    type: 'commonjs',
    engines: { node: '>=20.19.0' },
    scripts: scriptsFor(options.orm),
    dependencies,
    devDependencies,
  });
}

function scriptsFor(orm: OrmChoice): Record<string, string> {
  const scripts: Record<string, string> = {
    build: 'nest build',
    start: 'node dist/src/main.js',
    'start:dev': 'nest start --watch',
    'start:prod': 'node dist/src/main.js',
    typecheck: 'tsc -p tsconfig.json --noEmit',
    lint: 'oxlint .',
    format: 'oxfmt --write .',
    'format:check': 'oxfmt --check .',
    test: 'vitest run',
    'test:watch': 'vitest',
    'test:integration': 'vitest run test/app.integration-spec.ts',
    'db:migrate': 'docker compose run --rm liquibase update',
    'db:rollback': 'docker compose run --rm liquibase rollback-count --count=1',
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
