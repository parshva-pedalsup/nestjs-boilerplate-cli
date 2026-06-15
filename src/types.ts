export const ormChoices = ['typeorm', 'prisma', 'drizzle'] as const;
export type OrmChoice = (typeof ormChoices)[number];

export const packageManagers = ['pnpm', 'npm', 'yarn'] as const;
export type PackageManager = (typeof packageManagers)[number];

export interface CliOptions {
  readonly projectName?: string;
  readonly orm?: OrmChoice;
  readonly packageManager?: PackageManager;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly withAgentsMd?: boolean;
}

export interface ProjectOptions {
  readonly projectName: string;
  readonly packageName: string;
  readonly orm: OrmChoice;
  readonly packageManager: PackageManager;
  readonly targetDir: string;
  readonly force: boolean;
  readonly withAgentsMd: boolean;
}

export interface FileEntry {
  readonly path: string;
  readonly content: string;
}
