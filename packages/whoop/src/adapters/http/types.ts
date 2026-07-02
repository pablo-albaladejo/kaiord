/**
 * Injected HTTP/auth port for the WHOOP adapter.
 *
 * Mirrors `GarminHttpClient` in
 * `garmin-connect/src/adapters/client/garmin-workout-service.ts`: the
 * adapter is PURE and never performs OAuth. The composition edge (the
 * `@kaiord/whoop-bridge` Chrome extension) implements this port, owns the
 * bearer token, rate-limit back-off, and refresh-token rotation, and hands
 * the adapter fully-authenticated JSON.
 *
 * `get<T>` receives a WHOOP developer-API path relative to the client's
 * configured base (e.g. `/v2/recovery?limit=25`) and resolves to the parsed
 * JSON body. The port surfaces only reads because the WHOOP data API kaiord
 * consumes (recovery, sleep) is read-only.
 */
export type WhoopHttpClient = {
  get: <T>(path: string) => Promise<T>;
};
