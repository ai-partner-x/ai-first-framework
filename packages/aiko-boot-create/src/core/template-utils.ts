import path from 'path';
import fs from 'fs-extra';

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.mjs',
  '.cjs',
  '.md',
  '.css',
  '.html',
]);

export async function replaceScopeInDir(
  dir: string,
  fromScope: string,
  toScope: string,
): Promise<void> {
  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        await walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;
        let content = await fs.readFile(full, 'utf-8');
        const before = content;
        const from = `@${fromScope}/`;
        const to = `@${toScope}/`;
        content = content.replaceAll(from, to);
        if (content !== before) {
          await fs.writeFile(full, content, 'utf-8');
        }
      }
    }
  }

  await walk(dir);
}

