/**
 * Minimal Chrome Extension API mock for the WHOOP bridge (vitest).
 * Covers storage.local, identity (OAuth), and runtime messaging.
 */

const localStore = {};

const chromeMock = {
  runtime: {
    id: "whoop-test-extension-id",
    lastError: null,
    getManifest: vi.fn(() => ({ version: "0.1.0" })),
    onMessage: { addListener: vi.fn() },
    onMessageExternal: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  identity: {
    getRedirectURL: vi.fn(
      () => "https://whoop-test-extension-id.chromiumapp.org/"
    ),
    launchWebAuthFlow: vi.fn((details, cb) => {
      const state = new URL(details.url).searchParams.get("state");
      cb(
        `https://whoop-test-extension-id.chromiumapp.org/?code=auth-code&state=${state}`
      );
    }),
  },
  storage: {
    local: {
      get: vi.fn((key) => {
        if (typeof key === "string") {
          return Promise.resolve({ [key]: localStore[key] });
        }
        const result = {};
        for (const k of Array.isArray(key) ? key : Object.keys(key)) {
          result[k] = localStore[k];
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((obj) => {
        Object.assign(localStore, obj);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        for (const k of Array.isArray(keys) ? keys : [keys]) {
          delete localStore[k];
        }
        return Promise.resolve();
      }),
    },
  },
};

globalThis.chrome = chromeMock;
globalThis.fetch = vi.fn();

const windowMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  postMessage: vi.fn(),
  location: { origin: "https://kaiord.com" },
};
globalThis.window = windowMock;

globalThis.__resetChromeMock = () => {
  for (const key of Object.keys(localStore)) delete localStore[key];
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};

globalThis.__chromeMock = chromeMock;
globalThis.__chromeLocalStore = localStore;
