# @kaiord/docs

VitePress documentation site for Kaiord. Hosts the public docs published at
[https://kaiord.com/docs](https://kaiord.com/docs) — guide, format references,
CLI commands, MCP tools, legal pages, and the auto-generated TypeScript API
reference.

This package is `private: true` and is not published to npm. It is built and
deployed as a static site by the `release.yml` / `pages.yml` workflows.

## Purpose

- Render the long-form Kaiord documentation as a static VitePress site.
- Keep guide content (`guide/`), format specs (`formats/`), CLI reference
  (`cli/`), MCP tools (`mcp/`), and legal pages (`legal/`) in one tree.
- Generate the TypeScript API reference into `api/` from the public packages
  (`@kaiord/core`, `@kaiord/cli`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`,
  `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/mcp`) via TypeDoc with
  the `typedoc-plugin-markdown` plugin.
- Enforce hygiene rules on docs content: spell-check (cspell) and a
  privacy-policy invariant (`scripts/check-privacy-policy.mjs`).

The home page is `index.md`. Sidebar / navigation are configured in
`.vitepress/config.ts`.

## Build entrypoint

This package is a VitePress site, not a library — it has no `main` /
`exports`. The build target is the static site under `.vitepress/dist/`.

```bash
# Develop locally with hot reload
pnpm --filter @kaiord/docs dev

# Generate the API reference and build the static site
pnpm --filter @kaiord/docs build

# Preview the built site locally
pnpm --filter @kaiord/docs preview
```

The `build` script first runs `node scripts/generate-api-docs.mjs` to refresh
`api/` from the source packages, then runs `vitepress build`. Output is the
static site that the deployment workflow uploads.

## How to test

```bash
# Run the package's node:test suite (script invariants + content guards)
pnpm --filter @kaiord/docs test

# Spell-check Markdown content only
pnpm --filter @kaiord/docs spellcheck

# Verify the site builds end-to-end (catches broken VitePress links and
# missing API references)
pnpm --filter @kaiord/docs build
```

The `test` script runs `node --test scripts/*.test.mjs`, which covers the
brand-token guard, build-output metadata check, head-config invariants,
no-hex-literals rule, and the privacy-policy check. The whole suite is also
executed in CI as part of `pnpm test:scripts`.

## License

MIT — see the `LICENSE` file at the repository root.
