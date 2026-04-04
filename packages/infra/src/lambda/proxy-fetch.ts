import { Socks5ProxyAgent } from "undici";

const SOCKS5_URL = "socks5://localhost:1055";

let proxy: Socks5ProxyAgent | undefined;

const getProxy = (): Socks5ProxyAgent => {
  proxy ??= new Socks5ProxyAgent(SOCKS5_URL);
  return proxy;
};

// Node.js 24 globalThis.fetch supports `dispatcher` via undici but
// the types are experimental (Socks5ProxyAgent doesn't match Dispatcher).
// Cast is safe: Socks5ProxyAgent IS an undici Dispatcher at runtime.
export const proxyFetch: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, {
    ...init,
    dispatcher: getProxy(),
  } as unknown as RequestInit);

export const checkTunnelHealth = async (): Promise<boolean> => {
  try {
    const res = await proxyFetch("https://sso.garmin.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
};
