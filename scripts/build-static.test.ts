import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

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

describe('buildStaticSite', () => {
  test('creates the static Pages artifact', async () => {
    await buildStaticSite();

    await expect(fileExists(join(distDir, 'index.html'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, 'app.js'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, 'site.css'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, 'favicon.svg'))).resolves.toBe(true);
    await expect(fileExists(join(distDir, '.nojekyll'))).resolves.toBe(true);
  });
});