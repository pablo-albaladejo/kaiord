<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# cli

## Purpose

Command-line interface reference. Documents all Kaiord CLI commands, options, usage examples, and real-world workflows. Hand-written content; NOT auto-generated from CLI help.

## Key Files

- `commands.md` — Complete CLI reference: all commands (convert, validate, inspect, diff), options, exit codes, examples

## Subdirectories

None. All CLI content is in this directory.

## For AI Agents

### Working In This Directory

Edit `commands.md` hand-written directly. Keep it in sync with the actual CLI implementation in `packages/cli/src/`.

**Conventions:**

1. Frontmatter: `title` and `description` for SEO.
2. Command format: Use header hierarchy (`## convert`, `### Options`, `### Examples`).
3. Code examples: Use ` ```bash ``` ` for CLI invocations and output.
4. Option tables: Document flags, arguments, defaults, and required/optional status.
5. Links: Cross-reference guide pages (e.g., `/guide/getting-started`) and API docs.

### Testing Requirements

- **CLI sync**: When CLI commands change, update `commands.md`. Run `pnpm --filter @kaiord/cli --` to verify command names and options.
- **Spelling**: `pnpm --filter @kaiord/docs spellcheck` validates all .md files.
- **Formatting**: `pnpm --filter @kaiord/docs lint:fix` auto-formats.
- **Build validation**: `pnpm --filter @kaiord/docs build` ensures the page links correctly.

### Common Patterns

- **Command-by-command**: Each CLI command gets its own section with options, exit codes, and multiple examples.
- **Real-world examples**: Show common use cases (e.g., batch conversion, validation before upload).
- **Exit codes**: Document success (0) and error codes (non-zero); helpful for automation.
- **Environment variables**: If CLI uses environment variables (e.g., API keys), document them here.

## Dependencies

### Internal

- `@kaiord/cli` — CLI source code (must stay in sync with actual commands)
- `/guide/` — Cross-references to getting-started and other guides
- `/api/` — May reference API docs for library usage

### External

- **VitePress** — Renders Markdown to HTML

<!-- MANUAL: -->

## Notes for Agents

1. **CLI is not auto-generated**: Unlike API docs, CLI reference is hand-written. Keep it synchronized with the actual CLI implementation.
2. **Commands are stable**: Once a CLI command is released, breaking changes require a major version bump. Document carefully.
3. **Exit codes matter**: Automation and scripts rely on exit codes. Document them clearly.
4. **Examples are best**: Real-world examples help users understand what the CLI can do. Include multiple scenarios per command.
5. **Help output**: When the CLI changes, update the guide. Consider mentioning that users can run `kaiord --help` for the latest.
