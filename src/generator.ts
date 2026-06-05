import { randomUUID } from 'node:crypto';
import { access, cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { commonFiles } from './templates/common.js';
import { drizzleFiles } from './templates/drizzle.js';
import { prismaFiles } from './templates/prisma.js';
import { typeormFiles } from './templates/typeorm.js';
import { type FileEntry, type ProjectOptions } from './types.js';

export async function generateProject(options: ProjectOptions): Promise<void> {
  const files = resolveFiles(options);
  const { targetDir } = options;
  const tempDir = join(dirname(targetDir), `.${basename(targetDir)}-tmp-${randomUUID()}`);

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
      return;
    }

    await rename(tempDir, targetDir);
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
