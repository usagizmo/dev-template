import { describe, expect, it } from 'bun:test';
import { basename, dirname, join } from 'node:path';

const publicDir = join(import.meta.dir, '..', 'public');
const snapshotPath = join(import.meta.dir, 'external-links.txt');
const updateSnapshots = process.env.UPDATE_SNAPSHOTS === '1';

const imageExtensions = ['avif', 'gif', 'jpg', 'png', 'svg', 'webp'];
const imageFileNameRegex = new RegExp(`^[0-9a-z_-]+\\.(?:${imageExtensions.join('|')})$`);
const htmlLinkRegex = /(?:href|src)="([^"]+?)"/g;
const htmlSrcsetRegex = /srcset="([^"]+?)"/g;
const cssUrlRegex = /url\(\s*(['"]?)(.+?)\1\s*\)/g;

const scan = (pattern: string) => Array.fromAsync(new Bun.Glob(pattern).scan(publicDir));

/**
 * Returns the links in an HTML file: `href`, `src`, and every URL in `srcset`.
 */
const htmlLinks = (html: string): string[] => [
  ...[...html.matchAll(htmlLinkRegex)].map(([, link = '']) => link),
  ...[...html.matchAll(htmlSrcsetRegex)].flatMap(([, srcset = '']) =>
    srcset.split(',').map((candidate) => candidate.trim().split(/\s+/)[0] ?? ''),
  ),
];

/**
 * Returns the `url()` links in a CSS file. `data:` and `#` (SVG fragment) references are skipped.
 */
const cssLinks = (css: string): string[] =>
  [...css.matchAll(cssUrlRegex)]
    .map(([, , link = '']) => link)
    .filter((link) => !link.startsWith('data:') && !link.startsWith('#'));

/**
 * Returns whether a local link resolves: `/` is the server root, `#` an id in the same file.
 */
const resolves = async (link: string, sourcePath: string, source: string): Promise<boolean> => {
  if (link.startsWith('#')) return source.includes(`id="${link.slice(1)}"`);
  const [path = ''] = link.split(/[?#]/);
  const filePath = path.startsWith('/')
    ? join(publicDir, path)
    : join(publicDir, dirname(sourcePath), path);
  return Bun.file(path.endsWith('/') ? join(filePath, 'index.html') : filePath).exists();
};

describe('public/', () => {
  // Unresolved local links land in the snapshot too, so a broken path fails the same way as a new URL.
  it('matches the external link snapshot', async () => {
    const links = new Set<string>();
    const sources = [
      ...(await scan('**/*.html')).map((path) => ({ path, extract: htmlLinks })),
      ...(await scan('**/*.css')).map((path) => ({ path, extract: cssLinks })),
    ];

    for (const { path, extract } of sources) {
      const source = await Bun.file(join(publicDir, path)).text();
      for (const link of extract(source)) {
        if (/^(?:https?:)?\/\//.test(link) || !(await resolves(link, path, source))) {
          links.add(link);
        }
      }
    }

    const data = [...links].sort().join('\n');
    if (updateSnapshots) {
      await Bun.write(snapshotPath, data);
      return;
    }

    const snapshot = Bun.file(snapshotPath);
    if (!(await snapshot.exists())) {
      throw new Error('Missing tests/external-links.txt. Run `bun run test:update` to create it.');
    }
    expect(data).toBe(await snapshot.text());
  });

  it('has only lowercase kebab/snake-case image file names', async () => {
    const invalid = (await scan(`**/*.{${imageExtensions.join(',')}}`))
      .map((path) => basename(path))
      .filter((name) => !imageFileNameRegex.test(name));
    expect(invalid).toEqual([]);
  });
});
