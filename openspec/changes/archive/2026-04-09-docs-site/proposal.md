## Why

Kaiord has comprehensive internal documentation (20+ files in `docs/`, READMEs per package, OpenSpec specs) but no public-facing documentation site. Developers discovering Kaiord via kaiord.com have no way to learn the API, understand the architecture, or see code examples beyond the landing page's 4-line snippet. Additionally, existing docs have ~30% JSDoc coverage and no mechanism to prevent drift — docs go stale silently when code changes.

Top OSS projects (Vite, tRPC, Astro) solve this with type-checked code examples (Twoslash) and auto-generated API reference (TypeDoc). Kaiord needs the same, plus a Claude Code hook for AI-powered doc sync — pioneering "100% AI-documented" as an extension of the "100% AI-coded" brand.

## What Changes

- **New `@kaiord/docs` package** (`packages/docs/`): VitePress 2.x documentation site with dark mode, Kaiord branding, and system font stack.
- **Manual guides**: Migrate existing docs (Getting Started, Architecture, KRD Format, Testing) from `docs/` to VitePress Markdown pages.
- **Auto-generated API reference**: TypeDoc + typedoc-plugin-markdown generates API docs from TSDoc comments across all packages (core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp).
- **Twoslash type-checked code examples**: Code blocks compiled against real `@kaiord/*` types at build time — build breaks if API changes without doc update.
- **CLI command reference**: Auto-generated from commander definitions.
- **MCP tool reference**: Auto-generated from MCP tool definitions.
- **Format adapter docs**: KRD, FIT, TCX, ZWO, GCN format specifications and usage.
- **Anti-drift CI checks**: Link checker, spellcheck, Twoslash compilation in CI pipeline.
- **Claude Code hook**: Pre-commit hook in `settings.json` — if `src/` files changed, verifies `packages/docs/` is updated.
- **LLM-friendly output**: `vitepress-plugin-llms` generates `llms.txt` for AI tool consumption.
- **Deploy pipeline update**: `deploy-site.yml` builds 3 packages, merges into `dist/` + `dist/editor/` + `dist/docs/`.

## Capabilities

### New Capabilities

- `docs-site`: VitePress documentation site at kaiord.com/docs/ with manual guides, auto-generated API reference, type-checked code examples, and LLM-friendly output.
- `doc-drift-prevention`: Multi-layer anti-drift system: Twoslash type-checked examples, TypeDoc auto-generation, CI link/spell checks, and Claude Code pre-commit hook for AI-powered doc sync.

### Modified Capabilities

- `landing-page`: Update landing page navigation to include "Docs" link pointing to /docs/. Update robots.txt to allow /docs/. Update sitemap.xml with doc pages.

## Impact

- **New package**: `packages/docs/` (VitePress 2.x, private, zero runtime dependencies)
- **New devDependencies**: vitepress, @shikijs/vitepress-twoslash, typedoc, typedoc-plugin-markdown, vitepress-plugin-llms, cspell
- **Modified workflow**: `deploy-site.yml` — add docs build step, update merge to include `dist/docs/`, update artifact verification
- **Modified package**: `@kaiord/landing` — add "Docs" link to navigation
- **Modified files**: `packages/landing/public/robots.txt` (allow /docs/), `packages/landing/public/sitemap.xml` (add doc URLs)
- **New Claude Code hook**: `.claude/settings.local.json` — pre-commit doc-sync check
- **Existing docs**: `docs/` directory content migrated to `packages/docs/`, originals kept as references
- **Hexagonal layers**: None affected — documentation is a cross-cutting concern outside domain/ports/adapters
- **TSDoc coverage**: Will need to increase from ~30% to ~80%+ for meaningful auto-generated API reference
