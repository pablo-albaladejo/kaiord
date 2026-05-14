<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/AGENTS.md

Adapter implementations for the CLI. Currently contains logger adapters.

## Purpose

**What lives here:** Implementations of adapter patterns that fulfill interfaces from `@kaiord/core` or CLI-specific protocols.

**Pattern:** Adapters bridge CLI concerns (terminal output, structured logging) with core abstractions (Logger interface).

## Subdirectories

### logger/

Implementations of the `Logger` interface from `@kaiord/core`.

**Files:**

- **`pretty-logger.ts`** — Colored terminal output with emoji prefixes (🐛 debug, ℹ info, ⚠ warn, ✖ error). Respects TTY detection and `FORCE_COLOR` env var.
- **`structured-logger.ts`** — JSON structured logging using Winston. Suitable for CI/CD environments and log aggregation.

**How it works:**

1. `logger-factory.ts` detects environment (CI vs. interactive terminal)
2. Factory imports appropriate logger adapter dynamically
3. Command handlers use generic `createLogger()` and get the right implementation

## For AI Agents: Working in This Directory

### Logger Interface (from @kaiord/core)

```typescript
type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};
```

### Adding a New Logger Adapter

1. Create `newlogger.ts` implementing the Logger interface
2. Update `createLogger()` factory to support the new type
3. Handle options (level, quiet, etc.)
4. Test with different terminal environments (TTY vs. non-TTY)

### Pretty Logger Details

- **Color output:** Enabled if TTY detected OR `FORCE_COLOR=1` env var set
- **Log levels:** `debug` (min), `info`, `warn`, `error` (max)
- **Quiet mode:** Suppresses all logs except `error`
- **Context formatting:** JSON stringified and grayed out

### Structured Logger Details

- **Engine:** Winston (multiple transports, formatters)
- **Output:** JSON formatted logs suitable for log aggregation
- **Log levels:** Same hierarchy as pretty logger
- **Quiet mode:** Suppresses all except `error`

## Testing

- Test `createPrettyLogger()` with TTY mock
- Test `createStructuredLogger()` output format
- Verify quiet mode suppression
- Verify color detection logic

## Dependencies

- `chalk` — Terminal colors (pretty logger only)
- `winston` — Structured logging library (structured logger only)
- `@kaiord/core` — Logger interface definition
