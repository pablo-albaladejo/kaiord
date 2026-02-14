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
import type { KRD } from "@kaiord/core";

const { auth, service } = createGarminConnectClient();

// Login
await auth.login("email@example.com", "password");

// List workouts
const workouts = await service.list({ limit: 10 });

// Push a KRD workout to Garmin Connect
const result = await service.push(krd);
console.log(`Pushed workout: ${result.name} (id: ${result.id})`);
```

### Token Persistence

```typescript
import {
  createGarminConnectClient,
  createFileTokenStore,
} from "@kaiord/garmin-connect";

const tokenStore = createFileTokenStore("./tokens.json");
const { auth, service } = createGarminConnectClient({ tokenStore });

// Login (tokens are saved automatically)
await auth.login("email@example.com", "password");

// On next run, tokens are restored automatically
// No need to login again if tokens are still valid
```

### Custom Cookie-Aware Fetch

```typescript
import {
  createGarminConnectClient,
  createCookieFetch,
} from "@kaiord/garmin-connect";

const cookieFetch = createCookieFetch();
const { auth, service } = createGarminConnectClient({ fetchFn: cookieFetch });
```

## API

### `createGarminConnectClient(options?): { auth, service }`

Creates a Garmin Connect client with authentication and workout service.

**Options:**

- `fetchFn` - Custom fetch function (defaults to cookie-aware fetch)
- `tokenStore` - Token persistence store (defaults to in-memory)

### `auth.login(email, password): Promise<void>`

Authenticates with Garmin Connect via SSO.

### `auth.is_authenticated(): boolean`

Checks if the client has valid authentication tokens.

### `auth.export_tokens(): Promise<TokenData>`

Exports current tokens for external storage.

### `auth.restore_tokens(tokens): Promise<void>`

Restores previously exported tokens.

### `service.list(options?): Promise<WorkoutSummary[]>`

Lists workouts from Garmin Connect.

### `service.push(krd): Promise<PushResult>`

Pushes a KRD structured workout to Garmin Connect.

### `createCookieFetch(): typeof fetch`

Creates a cookie-aware fetch wrapper for SSO authentication flows.

### `createFileTokenStore(path): TokenStore`

Creates a file-based token store for persistent authentication.

### `createMemoryTokenStore(): TokenStore`

Creates an in-memory token store (tokens lost on process exit).

## License

MIT
