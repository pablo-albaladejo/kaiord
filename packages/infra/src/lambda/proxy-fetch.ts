import { Socks5ProxyAgent } from "undici";

const SOCKS5_URL = "socks5://localhost:1055";

let proxy: Socks5ProxyAgent | undefined;

const getProxy = (): Socks5ProxyAgent => {
  proxy ??= new Socks5ProxyAgent(SOCKS5_URL);
  return proxy;
};

export const proxyFetch: typeof globalThis.fetch = (input, init) =>
  // Socks5ProxyAgent is a valid undici Dispatcher but types are experimental
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.fetch(input, { ...init, dispatcher: getProxy() as any });

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
