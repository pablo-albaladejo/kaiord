> Tasks: 6 completed, 0 deferred

# Tasks

## 1. Root cause

- [x] 1.1 Reproduce the uncaught rejection in a browser and find where the
      promise is created; `ai` floor raised to `^7.0.123`, with a
      browser-runtime regression test in `@kaiord/ai`.

## 2. Key check

- [x] 2.1 `verifyProviderKey` in `@kaiord/ai`, tested with a mocked fetch
      only (no real provider is called).
- [x] 2.2 Settings → AI rejects a refused key, saves an unverified one with
      a note, and re-checks on edit only when the key changed.

## 3. Chat

- [x] 3.1 Model label without empty parentheses, in both pickers.
- [x] 3.2 Chat gate: no profile, keyless provider only, no provider.
- [x] 3.3 e2e: a refused key is not saved; a chat turn answered with 401
      shows the auth error and no `pageerror`. The specs that add providers
      through the UI answer the key check locally.
