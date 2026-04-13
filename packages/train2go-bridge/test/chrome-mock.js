/**
 * Minimal Chrome Extension API mock for vitest
 */

const chromeMock = {
  runtime: {
    lastError: null,
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

// Helper to reset state between tests
globalThis.__resetChromeMock = () => {
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};
