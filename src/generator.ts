import { randomUUID } from 'node:crypto';
import { access, cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { commonFiles } from './templates/common.js';
import { drizzleFiles } from './templates/drizzle.js';
import { prismaFiles } from './templates/prisma.js';
import { typeormFiles } from './templates/typeorm.js';
import { type FileEntry, type ProjectOptions } from './types.js';

export interface GenerateProjectResult {
  readonly files: readonly FileEntry[];
  readonly createdFiles: readonly string[];
  readonly overwrittenFiles: readonly string[];
  readonly mergedIntoExistingDirectory: boolean;
}

export async function generateProject(options: ProjectOptions): Promise<GenerateProjectResult> {
  const files = resolveFiles(options);
  const { targetDir } = options;
  const tempDir = join(dirname(targetDir), `.${basename(targetDir)}-tmp-${randomUUID()}`);
  const existingFiles = await findExistingGeneratedFiles(targetDir, files);

  try {
    await mkdir(tempDir, { recursive: true });
    await Promise.all(
      files.map(async (file) => {
        const targetPath = join(tempDir, file.path);
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, file.content, 'utf8');
      }),
    );

    let targetExists = false;
    try {
      await access(targetDir);
      targetExists = true;
    } catch {
      targetExists = false;
    }

    if (targetExists) {
      await cp(tempDir, targetDir, { recursive: true });
      await rm(tempDir, { recursive: true, force: true });
      return {
        files,
        createdFiles: files.map((file) => file.path).filter((path) => !existingFiles.has(path)),
        overwrittenFiles: [...existingFiles],
        mergedIntoExistingDirectory: true,
      };
    }

    await rename(tempDir, targetDir);
    return {
      files,
      createdFiles: files.map((file) => file.path),
      overwrittenFiles: [],
      mergedIntoExistingDirectory: false,
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

export function resolveFiles(options: ProjectOptions): readonly FileEntry[] {
  const ormFiles = {
    drizzle: drizzleFiles,
    prisma: prismaFiles,
    typeorm: typeormFiles,
  }[options.orm](options);

  const files = [...commonFiles(options), ...ormFiles];
  assertUniqueFilePaths(files);
  return files;
}

export function assertUniqueFilePaths(files: readonly FileEntry[]): void {
  const paths = new Set<string>();

  for (const file of files) {
    if (paths.has(file.path)) {
      throw new Error(`Duplicate template file path: ${file.path}`);
    }
    paths.add(file.path);
  }
}

async function findExistingGeneratedFiles(
  targetDir: string,
  files: readonly FileEntry[],
): Promise<ReadonlySet<string>> {
  const existing = new Set<string>();

  await Promise.all(
    files.map(async (file) => {
      try {
        await access(join(targetDir, file.path));
        existing.add(file.path);
      } catch {
        // Missing files are expected for new projects and partial force merges.
      }
    }),
  );

  return existing;
}
