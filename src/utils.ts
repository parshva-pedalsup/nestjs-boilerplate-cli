import { isAbsolute, relative, resolve } from 'node:path';
import { type PackageManager } from './types.js';

export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

export function validateProjectName(projectName: string): void {
  const trimmed = projectName.trim();

  if (!trimmed || trimmed === '.' || trimmed === '..') {
    throw new Error('Project name must be a subdirectory name inside the current working directory.');
  }

  if (!isValidProjectName(trimmed)) {
    throw new Error('Project name must contain only letters, numbers, dots, underscores, and dashes.');
  }
}

export function resolveSafeProjectDirectory(cwd: string, projectName: string): string {
  validateProjectName(projectName);
  const trimmed = projectName.trim();

  const targetDir = resolve(cwd, trimmed);
  const relativePath = relative(cwd, targetDir);

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Project directory must be inside the current working directory.');
  }

  return targetDir;
}

export function packageNameFromProjectName(projectName: string): string {
  return (
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/^[._-]+/, '')
      .replace(/[._-]+$/, '') || 'nest-backend'
  );
}

export function printNextSteps(projectName: string, packageManager: PackageManager): void {
  const install = packageManager === 'npm' ? 'npm install' : `${packageManager} install`;
  const typecheck = packageManager === 'npm' ? 'npm run typecheck' : `${packageManager} typecheck`;
  const build = packageManager === 'npm' ? 'npm run build' : `${packageManager} build`;
  const dev = packageManager === 'npm' ? 'npm run start:dev' : `${packageManager} start:dev`;

  console.log(
    `\nCreated ${projectName}\n\n` +
      `Next steps:\n` +
      `  cd ${projectName}\n` +
      `  cp .env.example .env\n` +
      `  cp liquibase.sample.properties liquibase.properties\n` +
      `  ${install}\n` +
      `  ${typecheck}\n` +
      `  ${build}\n\n` +
      `Database setup when you are ready:\n` +
      `  docker compose up -d postgres\n` +
      `  ${packageManager === 'npm' ? 'npm run db:migrate' : `${packageManager} db:migrate`}\n\n` +
      `Run locally:\n` +
      `  ${dev}\n\n` +
      `Liquibase owns schema migrations. Keep ORM schema/entity files aligned with Liquibase changelogs.\n` +
      `Docs will be available at http://localhost:3000/docs\n`,
  );
}
