/**
 * The extension popup and the App's card read the same answer from the same
 * extension. This feeds one answer to both — the popup's own
 * `connectionStateOf`, lifted out of its shipped `popup.js`, and the App's
 * prober — and asserts the two show the same notice, word for word (#1091).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { connectionNotice } from "@kaiord/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

import { connectionStateOf } from "../../application/connections/connection-state";
import {
  probeGarminSession,
  probeTrain2GoSession,
  probeTrainingPeaksSession,
  probeWhoopSession,
} from "./bridge-ping-session-probes";
import type { SessionProber } from "./bridge-session-probe-types";
import { sendBridgeMessage } from "./bridge-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);

type PopupAnswer = { ok: boolean; data?: unknown; error?: string };

const popupStateOf = (bridge: string): ((res: PopupAnswer) => string) => {
  const src = readFileSync(
    join(process.cwd(), "..", bridge, "popup.js"),
    "utf8"
  );
  const start = src.indexOf("const connectionStateOf = ");
  const close = "\n};";
  const end = src.indexOf(`${close}\n`, start);
  if (start < 0 || end < 0) throw new Error(`${bridge}: no connectionStateOf`);
  const body = src.slice(start, end + close.length);
  return new Function(`${body}\nreturn connectionStateOf;`)() as (
    res: PopupAnswer
  ) => string;
};

const BRIDGES: readonly (readonly [
  string,
  string,
  SessionProber,
  PopupAnswer[],
])[] = [
  [
    "garmin-bridge",
    "Garmin",
    probeGarminSession,
    [
      { ok: true, data: { gcApi: { ok: true } } },
      { ok: true, data: { gcApi: { ok: false, status: 503 } } },
      { ok: true, data: { gcApi: { ok: false, needsReauth: true } } },
      { ok: false, error: "No response" },
    ],
  ],
  [
    "train2go-bridge",
    "Train2Go",
    probeTrain2GoSession,
    [
      { ok: true, data: { sessionActive: true } },
      { ok: true, data: { sessionActive: false } },
      { ok: true, data: { sessionActive: false, needsReauth: true } },
      { ok: false, error: "No response" },
    ],
  ],
  [
    "trainingpeaks-bridge",
    "TrainingPeaks",
    probeTrainingPeaksSession,
    [
      { ok: true, data: { authenticated: true } },
      { ok: true, data: { authenticated: false, needsReauth: false } },
      { ok: true, data: { authenticated: false, needsReauth: true } },
      { ok: false, error: "No response" },
    ],
  ],
  [
    "whoop-bridge",
    "WHOOP",
    probeWhoopSession,
    [
      { ok: true, data: { connected: true, userId: 1 } },
      { ok: true, data: { connected: true, userId: null } },
      { ok: true, data: { connected: false, userId: null } },
      { ok: false, error: "No response" },
    ],
  ],
];

const CASES = BRIDGES.flatMap(([bridge, platform, probe, answers]) =>
  answers.map(
    (answer) =>
      [bridge, JSON.stringify(answer), platform, probe, answer] as const
  )
);

describe("popup and App parity", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each(CASES)(
    "should word %s answering %s the same in the popup and the App",
    async (bridge, _label, platform, probe, answer) => {
      // Arrange
      const popupState = popupStateOf(bridge);
      mockedSend.mockResolvedValue({
        delivered: true,
        protocolVersion: 1,
        ...answer,
      });

      // Act
      const probed = await probe("ext-1");
      const appState = connectionStateOf(
        { ...probed, checking: false, lastCheckedAt: 1 },
        { installed: true, settled: true, hasProbe: true }
      );
      const popup = connectionNotice(
        popupState(answer) as typeof appState,
        platform,
        "en"
      );
      const app = connectionNotice(appState, platform, "en");

      // Assert
      expect(app).toEqual(popup);
    }
  );
});
