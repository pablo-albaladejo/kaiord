<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# mcp

## Purpose

Model Context Protocol (MCP) server documentation. Documents the MCP tools available for AI/LLM integration, tool capabilities, request/response formats, and setup instructions. Hand-written content explaining how to use Kaiord via MCP.

## Key Files

- `tools.md` — MCP tools reference: list of available tools, tool descriptions, request/response schemas, usage examples

## Subdirectories

None. All MCP content is in this directory.

## For AI Agents

### Working In This Directory

Edit `tools.md` hand-written directly. Keep it in sync with the actual MCP tools defined in `packages/mcp/src/`.

**Conventions:**

1. Frontmatter: `title` and `description` for SEO.
2. Tool sections: Use header hierarchy (`## fit-to-tcx`, `## tcx-to-fit`, etc.).
3. Tool format: Document inputs (JSON schema), outputs, error cases, and examples.
4. Code examples: Show JSON requests/responses and error messages.
5. Links: Cross-reference API docs (e.g., `/api/mcp/`) and format guides.

### Testing Requirements

- **MCP tool sync**: When MCP tools change, update `tools.md`. Run the MCP server and inspect available tools.
- **Spelling**: `pnpm --filter @kaiord/docs spellcheck` validates all .md files.
- **Formatting**: `pnpm --filter @kaiord/docs lint:fix` auto-formats.
- **Build validation**: `pnpm --filter @kaiord/docs build` ensures the page links correctly.
- **Tool discovery**: Test that tools described in the guide actually exist and match the server output.

### Common Patterns

- **Tool grouping**: Group tools by category (conversion tools, validation tools, inspection tools).
- **Input/output schemas**: Show JSON schema or example JSON for each tool's request/response.
- **Error handling**: Document error cases (invalid format, validation failure, unsupported conversion).
- **LLM-friendly**: Write descriptions assuming the reader is an AI assistant using Kaiord via MCP.

## Dependencies

### Internal

- `@kaiord/mcp` — MCP server implementation (must stay in sync)
- `/formats/` — Format specifications (tools convert between formats)
- `/api/mcp/` — Auto-generated API reference for MCP

### External

- **Model Context Protocol (MCP)** — Protocol specification and server contracts
- **VitePress** — Renders Markdown to HTML

<!-- MANUAL: -->

## Notes for Agents

1. **MCP tools are AI-facing**: These tools are called by AI assistants. Write descriptions that help AI understand what each tool does.
2. **Tools are not auto-documented**: Unlike the API reference, MCP tools are hand-documented in `tools.md`. Keep them in sync.
3. **Tool discovery**: MCP clients discover tools by querying the server. Document all tools that the server exposes.
4. **Request/response formats**: Tools exchange KRD format (JSON). Show real examples so users/AI can construct requests.
5. **Error messages matter**: If a tool fails, the error message helps AI/users debug. Document what errors to expect.
