/**
 * Minimal Chrome Extension API mock for vitest
 */

const sessionStore = {};

const chromeMock = {
  runtime: {
    id: "garmin-test-extension-id",
    lastError: null,
    getManifest: vi.fn(() => ({ version: "0.2.0" })),
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
  webRequest: {
    onBeforeSendHeaders: {
      addListener: vi.fn(),
    },
  },
  storage: {
    session: {
      get: vi.fn((key) => {
        const k = typeof key === "string" ? key : Object.keys(key)[0];
        return Promise.resolve({ [k]: sessionStore[k] ?? undefined });
      }),
      set: vi.fn((obj) => {
        Object.assign(sessionStore, obj);
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
  for (const key of Object.keys(sessionStore)) {
    delete sessionStore[key];
  }
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};
