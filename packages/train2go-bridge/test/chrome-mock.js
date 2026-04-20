/**
 * Minimal Chrome Extension API mock for vitest
 */

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
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};
