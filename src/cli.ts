import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import { generateProject } from './generator.js';
import { promptForMissingOptions } from './prompts.js';
import { type CliOptions, ormChoices, packageManagers } from './types.js';
import { packageNameFromProjectName, printNextSteps, resolveSafeProjectDirectory } from './utils.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

export async function runCli(args: readonly string[]): Promise<void> {
  try {
    const parsed = parseArgs(args);
    if (parsed.help) {
      printHelp();
      return;
    }
    if (parsed.version) {
      console.log(version);
      return;
    }

    const answers = await promptForMissingOptions(parsed.options);
    const targetDir = resolveSafeProjectDirectory(process.cwd(), answers.projectName);

    await assertTargetDirectory(targetDir, answers.force);

    await generateProject({
      ...answers,
      packageName: packageNameFromProjectName(answers.projectName),
      targetDir,
    });

    printNextSteps(answers.projectName, answers.packageManager);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n✖ ${message}`);
    process.exitCode = 1;
  }
}

function parseArgs(args: readonly string[]): { help: boolean; version: boolean; options: CliOptions } {
  const options: CliOptions = { force: false };
  let projectName: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (!current) continue;

    if (current === '--help' || current === '-h') return { help: true, version: false, options };
    if (current === '--version' || current === '-v') return { help: false, version: true, options };
    if (current === '--force' || current === '-f') {
      Object.assign(options, { force: true });
      continue;
    }
    if (current === '--agents-md') {
      Object.assign(options, { withAgentsMd: true });
      continue;
    }
    if (current === '--no-agents-md') {
      Object.assign(options, { withAgentsMd: false });
      continue;
    }
    if (current === '--orm') {
      Object.assign(options, { orm: parseChoice(args[++index], ormChoices, '--orm') });
      continue;
    }
    if (current.startsWith('--orm=')) {
      Object.assign(options, { orm: parseChoice(current.slice(6), ormChoices, '--orm') });
      continue;
    }
    if (current === '--package-manager' || current === '--pm') {
      Object.assign(options, {
        packageManager: parseChoice(args[++index], packageManagers, '--package-manager'),
      });
      continue;
    }
    if (current.startsWith('--package-manager=')) {
      Object.assign(options, {
        packageManager: parseChoice(current.slice(18), packageManagers, '--package-manager'),
      });
      continue;
    }
    if (current.startsWith('-')) throw new Error(`Unknown option: ${current}`);
    projectName ??= current;
  }

  return {
    help: false,
    version: false,
    options: projectName ? { ...options, projectName } : options,
  };
}

function parseChoice<T extends readonly string[]>(value: string | undefined, choices: T, flag: string): T[number] {
  if (!value || !choices.includes(value)) {
    throw new Error(`${flag} must be one of: ${choices.join(', ')}`);
  }
  return value as T[number];
}

async function assertTargetDirectory(targetDir: string, force: boolean): Promise<void> {
  try {
    const entries = await readdir(targetDir);
    if (entries.length > 0 && !force) {
      throw new Error(`Target directory is not empty. Re-run with --force to write into it: ${targetDir}`);
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
    throw error;
  }
}

function printHelp(): void {
  console.log(
    `create-nestjs-backend <project-name> [options]\n\n` +
      `Project name must be a subdirectory inside the current working directory (not "." or "..").\n\n` +
      `Non-interactive usage requires all options:\n` +
      `  create-nestjs-backend my-api --orm prisma --package-manager pnpm\n\n` +
      `Options:\n` +
      `  --orm <typeorm|prisma|drizzle>       Select the ORM adapter\n` +
      `  --package-manager <pnpm|npm|yarn>    Choose package manager\n` +
      `  --agents-md                          Generate AGENTS.md for AI coding assistants\n` +
      `  --no-agents-md                       Skip AGENTS.md generation\n` +
      `  --force, -f                          Merge into a non-empty directory (overwrites generated files only)\n` +
      `  --version, -v                        Show CLI version\n` +
      `  --help, -h                           Show this help\n`,
  );
}
