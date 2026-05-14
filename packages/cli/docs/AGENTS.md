<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# docs/AGENTS.md

Architecture and implementation documentation for the CLI package.

## Purpose

**What lives here:** Design docs, architecture explanations, and implementation guides for CLI features and systems.

## Key Documents

### plugin-architecture.md

Comprehensive guide to the plugin system (currently designed, not yet implemented).

**Contents:**

- Plugin interface (`KaiordPlugin` type contract)
- Plugin package structure and npm metadata
- Plugin discovery algorithm (from `node_modules/@kaiord/plugin-*`, global dir, config)
- Plugin registry implementation
- Integration with CLI convert/validate/diff commands
- Configuration in `.kaiordrc.json`
- Example GPX plugin implementation (full working example)
- Plugin development guide (create, build, test, publish)
- Security considerations (sandboxing, version validation, error isolation)
- Performance (lazy loading, caching, parallel loading)
- Future enhancements (marketplace, hot reload, dependencies, hooks)
- CLI commands for plugin management (`plugins list`, `install`, `enable`, etc.)

**For AI agents:** Read this before implementing plugin system. Defines the complete contract and integration points.

### plugin-system-summary.md

High-level overview of the plugin architecture and design principles.

### example-plugin-gpx.md

Complete example of a working GPX format plugin. Shows how to:

- Create plugin package structure
- Implement converters (`toKrd`, `fromKrd`)
- Add tests with round-trip validation
- Publish to npm

**For AI agents:** Reference this when implementing a real plugin or helping users create one.

### npm-publish-verification.md

Publishing checklist and verification steps before releasing to npm.

**Contents:**

- Pre-publish checks (build, tests, types)
- Version updates (package.json, CHANGELOG)
- Publish command and verification
- Post-publish verification (tarball, npm registry, installation)

**For AI agents:** Reference before any release. Ensures quality and prevents broken releases.

## For AI Agents: Working in This Directory

### Adding Documentation

1. Document features/systems when implementing them (don't defer)
2. Include code examples (tested, not pseudo-code)
3. Explain "why" not just "what" (rationale, constraints)
4. Link to related docs and code files
5. Keep under 500 lines per file (split into multiple docs if larger)

### Documentation Templates

- **Feature guides:** What, why, how, examples, troubleshooting
- **Architecture docs:** Design principles, patterns, trade-offs, future enhancements
- **Implementation guides:** Step-by-step instructions with code samples

### Linking Conventions

- Internal links: `[Plugin System](./plugin-architecture.md)`
- Code references: Link to source files with line numbers where possible
- External links: Use full URLs

## Testing

- Examples in docs must be valid (copy-paste ready)
- Keep examples in sync with actual code
- If example breaks, update docs immediately

## Code Examples in Docs

All code examples should be:

- **Syntactically valid** — Copy-paste and run without errors
- **Concise** — Show the essential pattern, not full implementation
- **Tested** — Verify example works before documenting
- **Linked** — Reference actual source files when detailed

## Related Files

- `README.md` — User-facing CLI usage and installation
- `CHANGELOG.md` — Version history and release notes
- `.kaiordrc.example.json` — Configuration file template
- `/packages/cli/src/` — Actual implementation (reference for accuracy)

## Maintenance

- Update docs when APIs change
- Add docs for new features before/during implementation
- Keep examples in sync with code
- Remove docs for deprecated features
