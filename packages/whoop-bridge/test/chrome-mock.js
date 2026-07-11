/**
 * Minimal Chrome Extension API mock for the WHOOP bridge (vitest).
 * Session-piggyback model: storage.session + local, tabs, webRequest,
 * scripting, and runtime messaging. No identity (OAuth) surface.
 */

const sessionStore = {};
const localStore = {};

const readStore = (store, key) => {
  const list =
    typeof key === "string"
      ? [key]
      : Array.isArray(key)
        ? key
        : Object.keys(key);
  const result = {};
  for (const k of list) result[k] = store[k];
  return Promise.resolve(result);
};

const makeArea = (store) => ({
  get: vi.fn((key) => readStore(store, key)),
  set: vi.fn((obj) => {
    Object.assign(store, obj);
    return Promise.resolve();
  }),
  remove: vi.fn((keys) => {
    for (const k of Array.isArray(keys) ? keys : [keys]) delete store[k];
    return Promise.resolve();
  }),
});

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
  tabs: {
    query: vi.fn((q, cb) =>
      typeof cb === "function" ? cb([]) : Promise.resolve([])
    ),
    sendMessage: vi.fn((tabId, msg, cb) => cb(undefined)),
    create: vi.fn(() => Promise.resolve({ id: 1 })),
  },
  scripting: {
    executeScript: vi.fn(() => Promise.resolve([])),
  },
  webRequest: {
    onBeforeSendHeaders: { addListener: vi.fn() },
  },
  storage: {
    session: makeArea(sessionStore),
    local: makeArea(localStore),
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
  for (const key of Object.keys(sessionStore)) delete sessionStore[key];
  for (const key of Object.keys(localStore)) delete localStore[key];
  chromeMock.runtime.lastError = null;
  vi.clearAllMocks();
};

globalThis.__chromeMock = chromeMock;
globalThis.__chromeSessionStore = sessionStore;
globalThis.__chromeLocalStore = localStore;
