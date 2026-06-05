import { type PackageManager } from './types.js';

export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

export function packageNameFromProjectName(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/[._-]+$/, '') || 'nest-backend';
}

export function printNextSteps(projectName: string, packageManager: PackageManager): void {
  const install = packageManager === 'npm' ? 'npm install' : `${packageManager} install`;
  const dev = packageManager === 'npm' ? 'npm run start:dev' : `${packageManager} start:dev`;

  console.log(`\n✓ Created ${projectName}\n\nNext steps:\n  cd ${projectName}\n  cp .env.example .env\n  cp liquibase.sample.properties liquibase.properties\n  ${install}\n  docker compose up -d postgres\n  ${packageManager === 'npm' ? 'npm run db:migrate' : `${packageManager} db:migrate`}\n  ${dev}\n\nDocs will be available at http://localhost:3000/docs\n`);
}