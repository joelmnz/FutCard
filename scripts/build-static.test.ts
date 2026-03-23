import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

import { buildStaticSite } from './build-static';

const distDir = join(process.cwd(), 'dist');

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hasMatchingFile(dirPath: string, pattern: RegExp) {
  const entries = await readdir(dirPath);
  return entries.some((entry) => pattern.test(entry));
}

describe('buildStaticSite', () => {
  test('creates the static Pages artifact', async () => {
    await buildStaticSite();

    await expect(fileExists(join(distDir, 'index.html'))).resolves.toBe(true);
    await expect(hasMatchingFile(distDir, /^app\.[a-f0-9]{8}\.js$/)).resolves.toBe(true);
    await expect(hasMatchingFile(distDir, /^site\.[a-f0-9]{8}\.css$/)).resolves.toBe(true);
    await expect(fileExists(join(distDir, 'manifest.webmanifest'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, 'sw.js'))).resolves.toBe(true);
    await expect(readFile(join(distDir, 'sw.js'), 'utf8')).resolves.not.toContain('__FUTCARD_SW_VERSION__');
    await expect(readFile(join(distDir, 'sw.js'), 'utf8')).resolves.not.toContain('__FUTCARD_PRECACHE_URLS__');
    await expect(fileExists(join(distDir, 'favicon.svg'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, '.nojekyll'))).resolves.toBe(true);
  });
});