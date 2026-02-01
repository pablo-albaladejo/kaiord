---
name: test
description: Run tests with vitest MCP for structured output
allowed-tools: mcp__vitest__set_project_root, mcp__vitest__run_tests, mcp__vitest__list_tests
---

Run tests using vitest MCP.

## Project Roots

| Package | Path |
|---------|------|
| Core | /Users/pablo/development/personal/kaiord/packages/core |
| Frontend | /Users/pablo/development/personal/kaiord/packages/workout-spa-editor |

## Test Patterns

| Type | Pattern | Location |
|------|---------|----------|
| Unit | `*.test.ts` | Co-located with source |
| Integration | `*-integration.test.ts` | Same directory |
| Round-trip | `round-trip/*.test.ts` | `src/tests/round-trip/` |
| E2E | `*.spec.ts` | `e2e/` (frontend only) |

## Usage

1. Set project root:
   ```
   mcp__vitest__set_project_root({ path: "<project-path>" })
   ```

2. Run tests:
   ```
   mcp__vitest__run_tests({ target: "<file-or-dir>" })
   ```

3. List available tests:
   ```
   mcp__vitest__list_tests({ path: "<optional-dir>" })
   ```

## Example

```
/test packages/core/src/adapters/fit
```
