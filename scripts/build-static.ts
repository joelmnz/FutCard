import { access, copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

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

async function fingerprintFile(filePath: string, prefix: string) {
  const sourcePath = join(distDir, filePath);
  const content = await readFile(sourcePath);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
  const ext = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '';
  const nextFileName = `${prefix}.${hash}${ext}`;
  const nextPath = join(distDir, nextFileName);

  await rename(sourcePath, nextPath);
  return nextFileName;
}

export async function buildStaticSite() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await copyRecursive(srcDir, distDir);

  if (await exists(publicDir)) {
    await copyRecursive(publicDir, distDir);
  }

  const hashedAppFile = await fingerprintFile('app.js', 'app');
  const hashedStyleFile = await fingerprintFile('site.css', 'site');

  const precacheUrls = [
    './index.html',
    './manifest.webmanifest',
    './favicon.svg',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    './icons/maskable-icon.svg',
    `./${hashedAppFile}`,
    `./${hashedStyleFile}`,
  ];

  const indexPath = join(distDir, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  await writeFile(
    indexPath,
    indexHtml
      .replace('./site.css', `./${hashedStyleFile}`)
      .replace('./app.js', `./${hashedAppFile}`),
  );

  const swPath = join(distDir, 'sw.js');
  const swTemplate = await readFile(swPath, 'utf8');
  const buildVersion = `${hashedAppFile}:${hashedStyleFile}`;
  await writeFile(
    swPath,
    swTemplate
      .replaceAll('__FUTCARD_SW_VERSION__', buildVersion)
      .replace('__FUTCARD_PRECACHE_URLS__', JSON.stringify(precacheUrls)),
  );

  await writeFile(join(distDir, '.nojekyll'), '');
  console.log('Built static site into dist/.');
}

if (import.meta.main) {
  await buildStaticSite();
}