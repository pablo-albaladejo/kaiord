<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/prompts/`

## Purpose

MCP **prompts** — reusable, parameterized prompt templates the client can
surface to users (typically as slash-commands). Each file exports a
`register<Name>Prompt(server)` function that calls `server.prompt(name,
description, zodArgs, handler)`. Handlers return a `messages` array
instructing the LLM which Kaiord tools to call in what order.

## Key Files

- `analyze-workout.ts` — registers `analyze_workout` prompt. Arg: `file_path:
string`. Tells the LLM to call `kaiord_inspect`, then `kaiord_extract_workout`,
  then summarize sport / total steps / intensity distribution / duration
  breakdown / target zones and give training recommendations.
- `convert-file.ts` — registers `convert_file` prompt. Args: `file_path:
string`, `target_format: formatSchema` (`fit`/`tcx`/`zwo`/`gcn`/`krd`). Tells
  the LLM to call `kaiord_inspect` first, then `kaiord_convert` with the
  target format, then report results.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Prompt arg shapes are **Zod shape objects** (`{ key: z.string()... }`),
  not `z.object(...)`. The MCP SDK turns the shape into the prompt's
  argument schema.
- Each prompt body is a single user message whose `text` is a joined
  multi-line string — step-by-step instructions that reference real tool
  names registered elsewhere in this package.
- Keep prompts **stateless**: do not call tools inside the handler; the LLM
  is expected to execute the listed tools itself.
- When you add a new prompt, wire it inside `../server/create-server.ts`
  alongside the existing `registerConvertFilePrompt` /
  `registerAnalyzeWorkoutPrompt` calls.

### Testing Requirements

- No co-located tests today. Integration coverage comes via
  `tests/helpers/mcp-test-client.ts` calling `client.listPrompts()` and
  `client.getPrompt(...)`.

### Common Patterns

- Tool names referenced from prompt bodies must stay in sync with the actual
  registrations under `../tools/`. A grep for the prompt's instructions is
  the simplest sanity check.

## Dependencies

### Internal

- `../types/tool-schemas` — `formatSchema` (Zod enum of supported formats).

### External

- `@modelcontextprotocol/sdk/server/mcp.js` — `McpServer`.
- `zod` — `z.string()` and the enum from `formatSchema`.

<!-- MANUAL: -->
