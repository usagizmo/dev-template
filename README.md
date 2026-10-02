# Dev Template

Template for client static sites. HTML / CSS / JS in `apps/pages/public/` run in the browser as is, with no build step.

Demo: https://dev-template.usagizmo.com/

- Runtime: [Bun](https://bun.sh/) workspaces
- Lint / format: [oxlint](https://oxc.rs/docs/guide/usage/linter) / [oxfmt](https://oxc.rs/docs/guide/usage/formatter) / [markuplint](https://markuplint.dev/)
- Type check: [TypeScript](https://www.typescriptlang.org/) (`tests/*.ts` and `public/**/*.js` via `checkJs`)
- Git hooks: [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) (`.husky/pre-commit`, `.lintstagedrc.json`)
- CI: GitHub Actions (`.github/workflows/main.yml`)

## New project checklist

After creating a repository from this template:

- [ ] This README: title, description, and environment URLs
- [ ] Every `dev-template` (`git grep -n dev-template`), including the `dev-template.usagizmo.com` URLs in OGP
- [ ] `apps/pages/public/index.html`: `<title>`, description, and the sample content
- [ ] `apps/pages/public/`: `favicon.ico`, `apple-touch-icon.png`, `images/ogp.png`
- [ ] `apps/pages/commands/deploy.sh`: `DEPLOY_HOST` / `DEPLOY_DIR` / `DEPLOY_URL`
- [ ] `LICENSE`: replace or remove for client work
- [ ] `bun run test:update`, then review `apps/pages/tests/external-links.txt`

## Commands

Run from the repository root.

```bash
bun install          # Also installs the Git hooks
bun run dev          # BrowserSync at http://localhost:3000
bun run lint         # oxlint + oxfmt --check + markuplint
bun run format       # oxfmt
bun run check        # tsc
bun run test         # See Tests
bun run test:update  # Refresh apps/pages/tests/external-links.txt
bun run deploy       # rsync apps/pages/public/ to the server
```

Pre-commit formats and lints the staged files, then runs `bun run test`.

## Tests

`apps/pages/tests/` checks `apps/pages/public/`:

- `external-links.txt` snapshots every external URL and every local link that does not resolve. Links come from HTML `href` / `src` / `srcset` and CSS `url()` (`data:` and `#` are skipped). A new link or a broken path fails the test; review the diff after `bun run test:update`.
- Image file names match `[0-9a-z_-]` (`avif` / `gif` / `jpg` / `png` / `svg` / `webp`).
- No CSS custom property references itself (`--x: var(--x)`).

## Deploy

Set `DEPLOY_HOST` / `DEPLOY_DIR` / `DEPLOY_URL` at the top of `apps/pages/commands/deploy.sh`. It mirrors `public/` with `rsync --delete`.
