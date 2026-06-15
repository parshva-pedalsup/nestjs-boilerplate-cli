import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { type CliOptions, type OrmChoice, ormChoices, type PackageManager, packageManagers } from './types.js';
import { validateProjectName } from './utils.js';

interface PromptResult {
  readonly projectName: string;
  readonly orm: OrmChoice;
  readonly packageManager: PackageManager;
  readonly force: boolean;
  readonly withAgentsMd: boolean;
}

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY);
}

export async function promptForMissingOptions(options: CliOptions): Promise<PromptResult> {
  if (options.yes) {
    const projectName = options.projectName ?? 'my-nest-backend';
    validateProjectName(projectName);

    return {
      projectName,
      orm: options.orm ?? 'prisma',
      packageManager: options.packageManager ?? 'pnpm',
      force: options.force,
      withAgentsMd: options.withAgentsMd ?? false,
    };
  }

  if (!isInteractive()) {
    const missing: string[] = [];
    if (!options.projectName) missing.push('<project-name>');
    if (!options.orm) missing.push('--orm');
    if (!options.packageManager) missing.push('--package-manager');
    if (missing.length > 0) {
      throw new Error(
        `Non-interactive mode requires: ${missing.join(', ')}. Example: create-nestjs-backend my-api --orm prisma --package-manager pnpm`,
      );
    }
  }

  const rl = isInteractive() ? createInterface({ input, output }) : null;
  try {
    const projectName = options.projectName ?? (await promptProjectName(rl));
    validateProjectName(projectName);

    const orm = options.orm ?? (await promptChoice(rl, 'Select ORM', ormChoices, 'prisma'));
    const packageManager =
      options.packageManager ?? (await promptChoice(rl, 'Package manager', packageManagers, 'pnpm'));
    const withAgentsMd = options.withAgentsMd ?? (await promptBoolean(rl, 'Include AGENTS.md for AI coding assistants?', false));

    return { projectName, orm, packageManager, force: options.force, withAgentsMd };
  } finally {
    rl?.close();
  }
}

async function promptProjectName(rl: ReturnType<typeof createInterface> | null): Promise<string> {
  if (!rl) return 'my-nest-backend';
  const answer = (await rl.question('Project name: ')).trim();
  return answer || 'my-nest-backend';
}

async function promptBoolean(
  rl: ReturnType<typeof createInterface> | null,
  label: string,
  fallback: boolean,
): Promise<boolean> {
  if (!rl) return fallback;
  const hint = fallback ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`${label} (${hint}): `)).trim().toLowerCase();
  if (!answer) return fallback;
  if (answer === 'y' || answer === 'yes') return true;
  if (answer === 'n' || answer === 'no') return false;
  throw new Error(`Expected yes or no, received: ${answer}`);
}

async function promptChoice<T extends readonly string[]>(
  rl: ReturnType<typeof createInterface> | null,
  label: string,
  choices: T,
  fallback: T[number],
): Promise<T[number]> {
  if (!rl) return fallback;
  const answer = (await rl.question(`${label} (${choices.join('/')}) [${fallback}]: `)).trim();
  const selected = answer || fallback;
  if (!choices.includes(selected)) {
    throw new Error(`${label} must be one of: ${choices.join(', ')}`);
  }
  return selected as T[number];
}
