import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { commonFiles } from './templates/common.js';
import { drizzleFiles } from './templates/drizzle.js';
import { prismaFiles } from './templates/prisma.js';
import { typeormFiles } from './templates/typeorm.js';
import { type FileEntry, type ProjectOptions } from './types.js';

export async function generateProject(options: ProjectOptions): Promise<void> {
  const files = resolveFiles(options);

  await Promise.all(
    files.map(async (file) => {
      const targetPath = join(options.targetDir, file.path);
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, file.content, 'utf8');
    }),
  );
}

function resolveFiles(options: ProjectOptions): readonly FileEntry[] {
  const ormFiles = {
    drizzle: drizzleFiles,
    prisma: prismaFiles,
    typeorm: typeormFiles,
  }[options.orm](options);

  return [...commonFiles(options), ...ormFiles];
}