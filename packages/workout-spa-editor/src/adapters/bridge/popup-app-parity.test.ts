/**
 * The extension popup and the App's card read the same answer from the same
 * extension. This feeds one answer to both — the popup's own
 * `connectionStateOf`, lifted out of its shipped `popup.js`, and the App's
 * prober — and asserts the two show the same notice, word for word (#1091).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { connectionNotice, connectionReasonNotice } from "@kaiord/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  connectionReasonOf,
  connectionStateOf,
} from "../../application/connections/connection-state";
import { connectionNoticeOf } from "../../components/molecules/ConnectionNotice/connection-notice-of";
import {
  probeGarminSession,
  probeTrain2GoSession,
  probeTrainingPeaksSession,
} from "./bridge-ping-session-probes";
import type { SessionProber } from "./bridge-session-probe-types";
import { sendBridgeMessage } from "./bridge-transport";
import { probeWhoopSession } from "./whoop-session-probe";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);

type PopupAnswer = { ok: boolean; data?: unknown; error?: string };

const popupStateOf = (bridge: string): ((res: PopupAnswer) => string) => {
  const src = readFileSync(
    join(process.cwd(), "..", bridge, "popup.js"),
    "utf8"
  );
  const typed = src.indexOf("const TYPED_STATE = ");
  const start = typed >= 0 ? typed : src.indexOf("const connectionStateOf = ");
  const close = "\n};";
  const end = src.indexOf(
    `${close}\n`,
    src.indexOf("const connectionStateOf = ")
  );
  if (start < 0 || end < 0 || !src.includes("const connectionStateOf = "))
    throw new Error(`${bridge}: no connectionStateOf`);
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

// #1091: WHOOP holds a sign-in whose token carries no account id. The popup
// reads its own `popup-status` (with `userId`) and, finding none, shows the
// shared `no-account-id` notice; the App reads `status` and `read-user-id`,
// and must show the same notice at the same moment.
describe("popup and App parity, a WHOOP sign-in with no account id", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const appNoticeOf = (probed: Awaited<ReturnType<SessionProber>>) => {
    const row = { ...probed, checking: false, lastCheckedAt: 1 };
    const state = connectionStateOf(row, {
      installed: true,
      settled: true,
      hasProbe: true,
    });
    return connectionNoticeOf(state, connectionReasonOf(row), "WHOOP", "en");
  };

  const popupSrc = () =>
    readFileSync(join(process.cwd(), "..", "whoop-bridge", "popup.js"), "utf8");

  it.each([
    [
      "the current extension (status, then read-user-id refused)",
      [
        {
          ok: true,
          delivered: true,
          protocolVersion: 2,
          data: { connected: true, session: "signed-in" },
        },
        {
          ok: false,
          delivered: true,
          protocolVersion: 2,
          error: "no session token captured — open app.whoop.com and reload it",
        },
      ],
    ],
    [
      "the extension one protocol behind (status with a null id)",
      [
        {
          ok: true,
          delivered: true,
          protocolVersion: 1,
          data: { connected: true, userId: null, capturedAt: 1 },
        },
      ],
    ],
  ])(
    "should show the popup's no-account-id notice in the App for %s",
    async (_label, answers) => {
      // Arrange
      for (const answer of answers) mockedSend.mockResolvedValueOnce(answer);
      const popup = connectionReasonNotice("no-account-id", "WHOOP", "en");

      // Act
      const probed = await probeWhoopSession("ext-1");
      const app = appNoticeOf(probed);

      // Assert
      expect(popupSrc()).toMatch(/statusRes\.data\.userId != null/);
      expect(popupSrc()).toMatch(/noticeForReason\(\s*"no-account-id"/);
      expect(app).toEqual(popup);
    }
  );

  it("should keep a WHOOP sign-in that names its account Connected, with no notice", async () => {
    // Arrange
    mockedSend
      .mockResolvedValueOnce({
        ok: true,
        delivered: true,
        protocolVersion: 2,
        data: { connected: true, session: "signed-in" },
      })
      .mockResolvedValueOnce({
        ok: true,
        delivered: true,
        protocolVersion: 2,
        data: { userId: 7 },
      });

    // Act
    const probed = await probeWhoopSession("ext-1");
    const app = appNoticeOf(probed);

    // Assert
    expect(app).toBeNull();
  });
});
