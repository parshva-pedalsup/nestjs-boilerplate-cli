import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { type CliOptions, type OrmChoice, ormChoices, type PackageManager, packageManagers } from './types.js';
import { isValidProjectName } from './utils.js';

interface PromptResult {
  readonly projectName: string;
  readonly orm: OrmChoice;
  readonly packageManager: PackageManager;
  readonly force: boolean;
}

export async function promptForMissingOptions(options: CliOptions): Promise<PromptResult> {
  const rl = createInterface({ input, output });
  try {
    const projectName = options.projectName ?? (await promptProjectName(rl));
    if (!isValidProjectName(projectName)) {
      throw new Error('Project name must contain only letters, numbers, dots, underscores, and dashes.');
    }

    const orm = options.orm ?? (await promptChoice(rl, 'Select ORM', ormChoices, 'prisma'));
    const packageManager =
      options.packageManager ?? (await promptChoice(rl, 'Package manager', packageManagers, 'pnpm'));

    return { projectName, orm, packageManager, force: options.force };
  } finally {
    rl.close();
  }
}

async function promptProjectName(rl: ReturnType<typeof createInterface>): Promise<string> {
  const answer = (await rl.question('Project name: ')).trim();
  return answer || 'my-nest-backend';
}

async function promptChoice<T extends readonly string[]>(
  rl: ReturnType<typeof createInterface>,
  label: string,
  choices: T,
  fallback: T[number],
): Promise<T[number]> {
  const answer = (await rl.question(`${label} (${choices.join('/')}) [${fallback}]: `)).trim();
  const selected = answer || fallback;
  if (!choices.includes(selected)) {
    throw new Error(`${label} must be one of: ${choices.join(', ')}`);
  }
  return selected as T[number];
}