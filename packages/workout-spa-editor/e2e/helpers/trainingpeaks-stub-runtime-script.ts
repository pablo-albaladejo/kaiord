/**
 * Page-side `chrome.runtime` of the Kaiord for TrainingPeaks stub (current
 * extension, protocol 2) and its announcement: the Session check and the
 * athlete id are answered here, `request` by the account
 * (`trainingpeaks-stub-account-script`); an unanswered request never calls
 * back. Self-contained, as Playwright serialises it.
 */
export const installTrainingPeaksRuntimeScript = (args: {
  extensionId: string;
}): void => {
  type Msg = Record<string, unknown>;
  const win = window as unknown as Record<string, unknown>;
  const manifest = {
    id: "trainingpeaks-bridge",
    name: "TrainingPeaks (stub)",
    version: "0.0.0-stub",
    protocolVersion: 2,
    capabilities: ["read:body", "write:body", "write:workouts"],
  };
  const ok = (data: unknown) => ({ ok: true, protocolVersion: 2, data });
  const answer = (m: Msg): unknown => {
    const action = String(m.action ?? "");
    if (action === "ping" || action === "checkSession")
      return ok({ ...manifest, session: "signed-in", authenticated: true });
    if (action === "read-athlete-id") return ok({ athleteId: 77 });
    if (action === "set-theme") return ok(null);
    if (action === "request")
      return (win.__TP_STUB__ as (m: Msg) => unknown)(m);
    const error = "Origin or action not permitted";
    return { ok: false, protocolVersion: 2, error, retryable: false };
  };
  win.chrome = {
    runtime: {
      lastError: null,
      sendMessage: (_id: string, m: Msg, cb?: (r: unknown) => void) => {
        const r = answer(m);
        if (r !== undefined) setTimeout(() => cb?.(r), 0);
      },
    },
  };
  const ann = {
    type: "KAIORD_BRIDGE_ANNOUNCE",
    bridgeId: manifest.id,
    extensionId: args.extensionId,
    ...manifest,
  };
  const post = (): void => void window.postMessage(ann, "*");
  window.addEventListener("message", (e: MessageEvent) => {
    const type = (e.data as { type?: string } | null)?.type;
    if (e.source === window && type === "KAIORD_BRIDGE_DISCOVER") post();
  });
  for (const delayMs of [0, 250, 500, 1000, 2000, 4000])
    setTimeout(post, delayMs);
};
