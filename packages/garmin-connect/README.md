# @kaiord/garmin-connect

[![npm version](https://img.shields.io/npm/v/@kaiord/garmin-connect.svg)](https://www.npmjs.com/package/@kaiord/garmin-connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Garmin Connect API client for the Kaiord health & fitness data framework. Provides authentication, workout listing, and workout pushing via the Garmin Connect API.

## Installation

```bash
pnpm add @kaiord/garmin-connect
```

## Usage

### Quick Start

```typescript
import { createGarminConnectClient } from "@kaiord/garmin-connect";

const client = createGarminConnectClient();

// Login
await client.auth.login("email@example.com", "password");

// List workouts
const workouts = await client.service.list({ limit: 10 });

// Push a KRD workout to Garmin Connect
const result = await client.service.push(krd);
console.log(`Pushed workout: ${result.name} (id: ${result.id})`);
```

### Token Persistence with Auto-Restore

```typescript
import {
  createGarminConnectClient,
  createFileTokenStore,
} from "@kaiord/garmin-connect";

const client = createGarminConnectClient({
  tokenStore: createFileTokenStore("./tokens.json"),
});

// Auto-restore tokens from store (login not needed if tokens are valid)
const { restored } = await client.init();
if (!restored) {
  await client.auth.login("email@example.com", "password");
}
```

### With Retry for Transient Failures

```typescript
import { createGarminConnectClient } from "@kaiord/garmin-connect";

const client = createGarminConnectClient({
  retry: { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 },
});
```

### Custom Fetch Function

```typescript
import {
  createGarminConnectClient,
  createCookieFetch,
} from "@kaiord/garmin-connect";

const client = createGarminConnectClient({
  fetchFn: createCookieFetch(),
});
```

## API

### `createGarminConnectClient(options?): GarminConnectClient`

Creates a Garmin Connect client with authentication and workout service.

**Options:**

- `fetchFn` - Custom fetch function (defaults to cookie-aware fetch)
- `tokenStore` - Token persistence store
- `logger` - Custom logger
- `retry` - Retry options: `{ maxRetries?, baseDelay?, maxDelay? }`

**Returns:** `{ auth, service, init }`

### `client.init(): Promise<{ restored: boolean }>`

Auto-restores tokens from the token store. Returns `{ restored: true }` if valid tokens were found. Idempotent: no-op if tokens are already in memory.

### `client.auth.login(email, password): Promise<void>`

Authenticates with Garmin Connect via SSO.

### `client.auth.is_authenticated(): boolean`

Checks if the client has valid (non-expired) authentication tokens.

### `client.auth.export_tokens(): Promise<TokenData>`

Exports current tokens for external storage.

### `client.auth.restore_tokens(tokens): Promise<void>`

Restores previously exported tokens.

### `client.auth.logout(): Promise<void>`

Clears all tokens from memory and token store.

### `client.service.list(options?): Promise<WorkoutSummary[]>`

Lists workouts from Garmin Connect.

### `client.service.push(krd): Promise<PushResult>`

Pushes a KRD structured workout to Garmin Connect.

### `createFileTokenStore(path?): TokenStore`

Creates a file-based token store. Defaults to `~/.kaiord/garmin-tokens.json`.

### `createMemoryTokenStore(): TokenStore`

Creates an in-memory token store (tokens lost on process exit).

### `createCookieFetch(): typeof fetch`

Creates a cookie-aware fetch wrapper for SSO authentication flows.

## Migration from v5.x

```typescript
// Before (v5.x)
const { auth, service } = createGarminConnectClient();
await auth.login(email, password);

// After (v6.x)
const client = createGarminConnectClient({ tokenStore });
const { restored } = await client.init();
if (!restored) await client.auth.login(email, password);
```

See the [design document](../../openspec/changes/refactor-garmin-auth/design.md) for the full migration guide.

## License

MIT
