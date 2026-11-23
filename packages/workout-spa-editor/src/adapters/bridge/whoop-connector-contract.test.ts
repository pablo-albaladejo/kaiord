/**
 * The WHOOP Connector at the message contract with the extension
 * (docs/adr/0004-thin-bridge-smart-connector.md). The current extension
 * (protocol 2) answers `request` with WHOOP's raw answer, read from the open
 * app.whoop.com tab, and the Connector reads it; an extension one protocol
 * behind (1) answers the legacy `whoop-fetch` already read. The reading
 * cases are the extension's content script's former ones.
 */
import { afterEach, describe, expect, it } from "vitest";

import { buildCyclesPath } from "../../application/whoop/whoop-cycles-window";
import { buildMetricsPath } from "../../application/whoop/whoop-metrics-window";
import { closedListOf, isListed } from "../../test-utils/bridge-closed-list";
import {
  currentExtension,
  json,
  previousExtension,
  uninstallFakeExtension,
} from "../../test-utils/fake-bridge-extension";
import { readWhoopFetch, WhoopBridgeError } from "./whoop-transport";

const EXT = "whoop-ext";
const USER = 42;
const HTTP_UNAUTHORIZED = 401;
const BODY_CAP = 500;
const STEP_SECONDS = 60;
const CYCLES = buildCyclesPath(USER, {
  startTime: "2026-11-01T00:00:00.000Z",
  endTime: "2026-11-23T00:00:00.000Z",
});

afterEach(() => uninstallFakeExtension());

describe("WHOOP Connector, current extension (protocol 2)", () => {
  it("should read WHOOP's JSON answer as the result the sync reads", async () => {
    // Arrange
    const sent = currentExtension({ [`GET ${CYCLES}`]: json({ records: [] }) });

    // Act
    const result = await readWhoopFetch(EXT, CYCLES);

    // Assert
    expect(sent).toEqual([{ action: "request", method: "GET", path: CYCLES }]);
    expect(result).toEqual({ ok: true, status: 200, data: { records: [] } });
  });

  it("should fall back to a truncated raw body when the answer is not JSON", async () => {
    // Arrange
    const body = "x".repeat(BODY_CAP * 2);
    currentExtension({
      [`GET ${CYCLES}`]: { contentType: "text/plain", body },
    });

    // Act
    const result = await readWhoopFetch(EXT, CYCLES);

    // Assert
    expect(result).toEqual({
      ok: true,
      status: 200,
      data: body.slice(0, BODY_CAP),
    });
  });

  it("should hand the sync WHOOP's refusal status, as before", async () => {
    // Arrange
    currentExtension({
      [`GET ${CYCLES}`]: {
        refuse: {
          error: "Request failed: 401",
          status: HTTP_UNAUTHORIZED,
          needsReauth: true,
        },
      },
    });

    // Act
    const result = await readWhoopFetch(EXT, CYCLES);

    // Assert
    expect(result).toEqual({ ok: false, status: HTTP_UNAUTHORIZED });
  });

  it("should keep the open WHOOP tab a condition, failing the read without one", async () => {
    // Arrange
    currentExtension({
      [`GET ${CYCLES}`]: { refuse: { error: "No app.whoop.com tab open." } },
    });

    // Act
    const error = await readWhoopFetch(EXT, CYCLES).catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(WhoopBridgeError);
    expect((error as WhoopBridgeError).message).toBe(
      "No app.whoop.com tab open."
    );
  });
});

describe("WHOOP Connector, extension one protocol behind (protocol 1)", () => {
  it("should read through the legacy action after the extension refuses the request", async () => {
    // Arrange
    const sent = previousExtension({
      "whoop-fetch": { ok: true, status: 200, data: { records: [] } },
    });

    // Act
    const result = await readWhoopFetch(EXT, CYCLES);

    // Assert
    expect(sent.map((m) => m.action)).toEqual(["request", "whoop-fetch"]);
    expect(result).toEqual({ ok: true, status: 200, data: { records: [] } });
  });
});

describe("WHOOP Connector asks only for what the extension's closed list admits", () => {
  it("should build every read so that the extension's list admits it", () => {
    // Arrange
    const list = closedListOf("whoop-bridge");
    const day = {
      date: "2026-11-20",
      dayStartISO: "2026-11-20T00:00:00.000Z",
      dayEndISO: "2026-11-21T00:00:00.000Z",
    };
    const asked = [
      CYCLES,
      buildMetricsPath(USER, day as never, STEP_SECONDS),
      "/activities-service/v1/sports/history?countryCode=US",
      "/advanced-labs-service/v1/biomarker-tests",
      "/advanced-labs-service/v1/biomarker-tests/3f2a-b9/summary",
      "/health-service/v2/stress-bff/2026-11-20",
    ];

    // Act
    const refused = asked.filter((p) => !isListed(list, "GET", p));

    // Assert
    expect(refused).toEqual([]);
  });
});
