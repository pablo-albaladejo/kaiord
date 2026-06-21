/**
 * Validates an intervals.icu API key from the browser. intervals.icu uses HTTP
 * Basic auth with username `API_KEY` and the key as the password; `/athlete/0`
 * resolves to the authenticated athlete. A 2xx means the key works (CORS is
 * permitted for browser origins — see the change's CORS spike). `fetch` is
 * injectable for tests.
 */
const ATHLETE_URL = "https://intervals.icu/api/v1/athlete/0";
const REQUEST_TIMEOUT_MS = 10000;

export const validateIntervalsIcuKey = async (
  credential: string,
  fetchFn: typeof fetch = fetch
): Promise<boolean> => {
  const auth = btoa(`API_KEY:${credential}`);
  const response = await fetchFn(ATHLETE_URL, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return response.ok;
};
