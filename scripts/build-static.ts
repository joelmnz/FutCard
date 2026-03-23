import { access, copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const srcDir = join(rootDir, 'src');
const publicDir = join(rootDir, 'public');

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyRecursive(sourceDir: string, destinationDir: string) {
  await mkdir(destinationDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith('.md')) continue;

    const sourcePath = join(sourceDir, entry.name);
    const destinationPath = join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(sourcePath, destinationPath);
      continue;
    }

    await mkdir(dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }
}

export async function buildStaticSite() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await copyRecursive(srcDir, distDir);

  if (await exists(publicDir)) {
    await copyRecursive(publicDir, distDir);
  }

  await writeFile(join(distDir, '.nojekyll'), '');
  console.log('Built static site into dist/.');
}

if (import.meta.main) {
  await buildStaticSite();
}