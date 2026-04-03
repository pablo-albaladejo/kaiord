import { SocksProxyAgent } from "socks-proxy-agent";

const SOCKS5_URL = "socks://localhost:1055";

const agent = new SocksProxyAgent(SOCKS5_URL);

export const proxyFetch: typeof globalThis.fetch = (input, init) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.fetch(input, { ...init, dispatcher: agent } as any);

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
