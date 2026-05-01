/**
 * Minimal Chrome Extension API mock for vitest
 */

const localStore = {};

const chromeMock = {
  runtime: {
    id: "train2go-test-extension-id",
    lastError: null,
    getManifest: vi.fn(() => ({ version: "0.1.1" })),
    onMessage: {
      addListener: vi.fn(),
    },
    onMessageExternal: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn((query, cb) => cb([])),
    sendMessage: vi.fn((tabId, msg, cb) => cb(undefined)),
    create: vi.fn(() => Promise.resolve({ id: 1 })),
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

// Helper to reset state between tests
globalThis.__resetChromeMock = () => {
  for (const key of Object.keys(localStore)) {
    delete localStore[key];
  }
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};

globalThis.__chromeMock = chromeMock;
globalThis.__chromeLocalStore = localStore;
