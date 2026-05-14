<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/test-utils/

## Purpose

Shared numeric constants for test fixtures and benchmarks. Pure module with zero imports. Single responsibility: define reusable magic numbers to avoid scattered hardcoding across test suites.

## Key Files

- `constants.ts` — Exported constants for eval durations, step counts, pass rates, attempt counts, input length boundaries, config defaults

## Constants Exported

```typescript
// Eval / benchmark durations (ms)
EVAL_DURATION_MS_PASS = 1500;
EVAL_DURATION_MS_DEFAULT = 1000;

// Step / workout counts
EXPECTED_STEP_COUNT_THREE = 3;

// Reporter pass rate (%)
PASS_RATE_FIFTY = 50;

// AiParsingError attempt counts
ATTEMPTS_THREE = 3;

// Validate-input length boundaries (chars)
INPUT_LEN_OVER_LIMIT = 2001;
INPUT_LEN_AT_LIMIT = 2000;
INPUT_TEXT_TRUNCATED_MAX_LEN = 203;

// text-to-workout config defaults
MAX_OUTPUT_TOKENS_DEFAULT = 4096;
```

## For AI Agents

### Working In This Directory

- **Add a constant**: Define as `export const NAME = value as const` to preserve literal type
- **Import in tests**: `import { CONSTANT } from "@kaiord/ai/test-utils"` or relative path
- **Never scatter magic numbers**: Always define in `constants.ts` first

### Testing Requirements

No tests for this file (it's a pure constants module, not testable behavior).

### Common Patterns

- **`as const` suffix**: Preserves literal types for TypeScript inference
- **Grouping by domain**: Organize with comment sections (eval durations, step counts, etc.)

## Dependencies

### Internal

None (zero imports).

### External

None (pure TypeScript).

## File Line Limits

- `constants.ts`: 23 lines

<!-- MANUAL: -->
