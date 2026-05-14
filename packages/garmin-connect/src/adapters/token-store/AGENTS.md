<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/token-store

Token persistence layer: file-based and in-memory implementations of TokenStore interface.

**Files:**

- `file-token-store.ts` — File-based persistence; JSON format; defaults to `~/.kaiord/garmin-tokens.json`
- `memory-token-store.ts` — In-memory store; tokens lost on process exit

**Key interface (from `@kaiord/core`):**

```typescript
type TokenStore = {
  save(data: TokenData): Promise<void>;
  load(): Promise<TokenData | null>;
  clear(): Promise<void>;
};
```

**File token store patterns:**

- `createFileTokenStore(path?)` — factory; path defaults to `~/.kaiord/garmin-tokens.json`
- Stores both OAuth1 and OAuth2 tokens as JSON
- `save`: writes to disk with write permissions check
- `load`: reads JSON; returns null if file missing or corrupted
- `clear`: deletes file; no error if not present

**Memory token store patterns:**

- `createMemoryTokenStore()` — factory
- Simple object store; no I/O
- Useful for testing and ephemeral CLI runs

**Testing:**

- File store: test happy path, missing file, corrupted JSON, write failures
- Memory store: test set/get/clear lifecycle
- Both: test integration with token manager

**Error handling:**

- File store failures logged but non-blocking (best-effort persistence)
- Load failures return null; client continues without cached tokens

<!-- MANUAL: -->
