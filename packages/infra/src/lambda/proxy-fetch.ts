import { Dispatcher, setGlobalDispatcher } from "undici";
import { socksDispatcher } from "fetch-socks";

const SOCKS5_HOST = "localhost";
const SOCKS5_PORT = 1055;

let currentDispatcher: Dispatcher | undefined;

export const enableSocksProxy = (): void => {
  if (currentDispatcher) {
    currentDispatcher.destroy();
  }
  const dispatcher = socksDispatcher({
    type: 5,
    host: SOCKS5_HOST,
    port: SOCKS5_PORT,
  });
  currentDispatcher = dispatcher as unknown as Dispatcher;
  setGlobalDispatcher(currentDispatcher);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const probe = async (): Promise<boolean> => {
  try {
    const res = await globalThis.fetch("https://sso.garmin.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
};

export const checkTunnelHealth = async (
  maxRetries = 3,
  delayMs = 2000
): Promise<boolean> => {
  const retries = Math.max(1, maxRetries);
  for (let i = 0; i < retries; i++) {
    if (await probe()) return true;
    if (i < retries - 1) await sleep(delayMs);
  }
  return false;
};
