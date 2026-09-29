/**
 * Reads the bridge's ping answer: installed, session, protocol and the
 * calendar `features` it supports (`[]` for a bridge that predates them).
 */
export type DetectionResult =
  | { installed: false }
  | { installed: true; session: false; error: string; features: string[] }
  | { installed: true; session: boolean; error: null; features: string[] };

const SUPPORTED_PROTOCOLS = [1];

/** The ping's `features`; an older bridge sends none. */
const featuresOf = (data: unknown): string[] => {
  const raw = (data as { features?: unknown } | undefined)?.features;
  return Array.isArray(raw) ? raw.filter((f) => typeof f === "string") : [];
};

export function evaluatePingResult(res: {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
}): DetectionResult {
  if (!res.ok) return { installed: false };
  const features = featuresOf(res.data);
  if (
    !res.protocolVersion ||
    !SUPPORTED_PROTOCOLS.includes(res.protocolVersion)
  )
    return {
      installed: true,
      session: false,
      error: "Update your Kaiord Garmin Bridge extension",
      features,
    };
  const data = res.data as { gcApi?: { ok: boolean } } | undefined;
  return {
    installed: true,
    session: data?.gcApi?.ok === true,
    error: null,
    features,
  };
}
