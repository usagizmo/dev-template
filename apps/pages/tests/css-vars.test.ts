import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const publicDir = join(import.meta.dir, '..', 'public');

// `--x: var(--x)` は値が解決できず、その宣言を使う transition/animation ごと無効になる
const selfReferenceRegex = /(--[\w-]+):\s*var\(\s*\1\s*[,)]/g;

describe('public/**/*.css', async () => {
  const cssPaths = await Array.fromAsync(new Bun.Glob('**/*.css').scan(publicDir));

  it.each(cssPaths)('%s has no self-referencing custom property', async (cssPath) => {
    const css = await Bun.file(join(publicDir, cssPath)).text();
    expect([...css.matchAll(selfReferenceRegex)].map(([, name]) => name)).toEqual([]);
  });
});
