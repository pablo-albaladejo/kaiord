<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/docs

## Purpose

VitePress documentation site for Kaiord, published at https://kaiord.com/docs. Renders long-form guides, format specifications, CLI reference, MCP tools, legal pages, and auto-generated TypeScript API reference. Single-source-of-truth for all public documentation.

## Key Files

- `package.json` — Build scripts (`build` runs API generation + VitePress), test suite (node:test for guards)
- `index.md` — Home page with hero section, quick-start steps, and feature cards
- `README.md` — Package overview and build instructions
- `.vitepress/config.ts` — VitePress config with sidebar/nav, SEO head transforms, JSON-LD breadcrumbs
- `scripts/generate-api-docs.mjs` — TypeDoc runner for all public packages; auto-generates `api/*/` dirs
- `scripts/check-privacy-policy.mjs` — Lint guard: ensures `legal/privacy-policy.md` matches spec

## Subdirectories

- **`guide/`** — Long-form guides: quick-start, architecture, testing, contributing, why-kaiord, getting-started
- **`formats/`** — Format specifications: krd, fit, tcx, zwo, gcn
- **`cli/`** — CLI reference: commands.md (static, not auto-generated)
- **`mcp/`** — MCP tools reference: tools.md
- **`legal/`** — Privacy policy (single page, linted by check-privacy-policy.mjs)
- **`api/`** — Auto-generated TypeScript API reference (TypeDoc + markdown plugin)
  - `api/{cli,core,fit,garmin,garmin-connect,mcp,tcx,zwo}/` — Auto-generated; do NOT hand-edit
  - Each subdir contains classes/, functions/, type-aliases/, variables/ from TypeDoc
- **`.vitepress/`** — VitePress config and theme customization
  - `config.ts` — Site config, navigation, sidebar, SEO
  - `theme/` — Custom Vue components and CSS
  - `dist/` — Build output (gitignored)
- **`public/`** — Static assets: logos, OG images
- **`scripts/`** — Build and lint utilities (all have co-located .test.mjs)

## For AI Agents

### Working In This Directory

1. **Hand-written docs** (`guide/`, `formats/`, `cli/`, `mcp/`, `legal/`) — Edit directly. Keep Markdown clean, follow VitePress conventions (frontmatter, code fences with language tags, relative links).
2. **Auto-generated docs** (`api/`) — Never hand-edit. Regenerate via `pnpm build` (runs `scripts/generate-api-docs.mjs`).
3. **VitePress config** (`.vitepress/config.ts`) — Central source for sidebar, nav, SEO. Changes here ripple through all pages.
4. **Theme** (`.vitepress/theme/`) — Modify `custom.css` for styling; `NotFound.vue` for 404 page; `index.ts` for theme setup.

### Testing Requirements

- **Build command**: `pnpm --filter @kaiord/docs build` — Runs API generation, then VitePress build. Must produce clean output.
- **Lint**: `pnpm --filter @kaiord/docs lint` — Spell-check (cspell, excludes `api/`), Prettier format check, privacy-policy guard.
- **Test suite**: `pnpm --filter @kaiord/docs test` — Runs `scripts/*.test.mjs`:
  - `brand-tokens.test.mjs` — CSS custom property coverage
  - `head-config.test.mjs` — Static head config invariants
  - `build-output-meta.test.mjs` — Build metadata checks
  - `no-hex-literals.test.mjs` — No hardcoded hex colors
  - `check-privacy-policy.test.mjs` — Policy matches spec + extension manifests
- **Spell-check only**: `pnpm --filter @kaiord/docs spellcheck`

### Common Patterns

- **Frontmatter**: Every .md file (except generated API docs) must have `title` and `description` in YAML frontmatter. Affects SEO, breadcrumbs.
- **Code examples**: Use ` ```ts twoslash ``` ` for executable TypeScript (with type hints). Use ` ```bash ``` ` for CLI.
- **Links**: Use relative links (e.g., `/guide/quick-start`) that resolve from doc root.
- **API references**: Link to auto-generated docs via `/api/{package}/` (e.g., `/api/core/functions/fromBinary.md`). Verify links exist after regeneration.
- **Sidebar**: Defined in `.vitepress/config.ts` `themeConfig.sidebar` array. Add new docs here, not only in the file tree.

## Dependencies

### Internal

- `@kaiord/core`, `@kaiord/cli`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/mcp` — API reference source packages (devDependencies; used only for TypeDoc extraction)

### External

- **VitePress 2.0** (alpha) — Static site generator; renders Markdown + Vue
- **TypeDoc + typedoc-plugin-markdown** — Extracts TypeScript API from source; outputs Markdown
- **Shikijs (vitepress-twoslash)** — TypeScript code highlighting with type inference overlay
- **cspell** — Spell-check for Markdown
- **Prettier** — Format checker for all files
- **vitepress-plugin-llms** — Exposes `llms.txt` for AI/LLM integration

<!-- MANUAL: -->

## Notes for Agents

1. **API regeneration is destructive**: `scripts/generate-api-docs.mjs` overwrites `api/{package}/*` directories. Hand-edits to those files are lost on next build.
2. **Privacy policy is linted**: Any change to `legal/privacy-policy.md` must satisfy the spec at `openspec/specs/privacy-policy/spec.md` AND match current extension manifests (train2go-bridge, garmin-bridge).
3. **CLI reference is hand-written**: Unlike API docs, `/cli/commands.md` is not auto-generated. Keep it in sync with actual CLI output.
4. **SEO is critical**: The site generates JSON-LD breadcrumbs and OpenGraph metadata. Verify frontmatter `title` and `description` are meaningful and unique per page.
5. **Build performance**: TypeDoc generation can take 30+ seconds. Use `pnpm --filter @kaiord/docs dev` for iterating on hand-written docs; run full build only when updating API reference.
