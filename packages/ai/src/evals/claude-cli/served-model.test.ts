import { describe, expect, it } from "vitest";

import { CALIBRATION_SERVED_MODEL_ID } from "../../test-utils/calibration-capture-fixture";
import {
  OFFICIAL_SERVED_FORM,
  isOfficialServedModel,
} from "../cassettes/validate-cassette";
import {
  committedServedFault,
  recordPreflightFault,
  servedModelOf,
} from "./served-model";

describe("servedModelOf", () => {
  it("should accept the requested id or a dated snapshot of it", () => {
    // Arrange
    const requested = "claude-haiku-4-5";

    // Act
    const bare = servedModelOf(["claude-haiku-4-5"], requested);
    const dated = servedModelOf(["claude-haiku-4-5-20251001"], requested);

    // Assert
    expect(bare).toEqual({ ok: true, servedModelId: "claude-haiku-4-5" });
    expect(dated).toEqual({
      ok: true,
      servedModelId: "claude-haiku-4-5-20251001",
    });
  });

  it("should reject zero, several or a different served model", () => {
    // Arrange
    const requested = "claude-sonnet-5";

    // Act
    const results = [
      servedModelOf([], requested),
      servedModelOf(["claude-sonnet-5", "claude-haiku-4-5"], requested),
      servedModelOf(["claude-sonnet-5-5"], requested),
      servedModelOf(["claude-sonnet-5-2026"], requested),
    ];

    // Assert
    expect(results.map((r) => r.ok)).toEqual([false, false, false, false]);
  });

  it("should treat regex metacharacters in the requested id literally", () => {
    // Arrange
    const requested = "claude-sonnet-5+";

    // Act
    const widened = servedModelOf(["claude-sonnet-55-20260101"], requested);
    const literal = servedModelOf(["claude-sonnet-5+-20260101"], requested);

    // Assert
    expect(widened.ok).toBe(false);
    expect(literal.ok).toBe(true);
  });
});

describe("committedServedFault", () => {
  it("should refuse every committed write while the served form is unpinned", () => {
    // Arrange
    const served = "claude-sonnet-5";

    // Act
    const fault = committedServedFault(served, null);

    // Assert
    expect(fault).toContain("OFFICIAL_SERVED_FORM is not pinned");
  });

  it("should ship pinned to the bare id the real calibration served", () => {
    // Arrange
    const served = [CALIBRATION_SERVED_MODEL_ID, "claude-sonnet-5-20261001"];

    // Act
    const faults = served.map((id) => committedServedFault(id));

    // Assert
    expect(OFFICIAL_SERVED_FORM).toBe("bare");
    expect(faults[0]).toBeUndefined();
    expect(faults[1]).toContain("the pinned form for claude-sonnet-5 is bare");
  });

  it("should accept only the pinned form once it is set", () => {
    // Arrange
    const bare = "claude-sonnet-5";
    const dated = "claude-sonnet-5-20261001";

    // Act
    const faults = [
      committedServedFault(bare, "bare"),
      committedServedFault(dated, "bare"),
      committedServedFault(dated, "dated"),
      committedServedFault(bare, "dated"),
    ];

    // Assert
    expect(faults.map((f) => f === undefined)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });
});

describe("isOfficialServedModel", () => {
  it("should accept both forms unpinned and narrow to the pinned one", () => {
    // Arrange
    const ids = [
      "claude-sonnet-5",
      "claude-sonnet-5-20261001",
      "claude-haiku-4-5",
    ];

    // Act
    const unpinned = ids.map((id) => isOfficialServedModel(id, null));
    const bare = ids.map((id) => isOfficialServedModel(id, "bare"));
    const dated = ids.map((id) => isOfficialServedModel(id, "dated"));

    // Assert
    expect(unpinned).toEqual([true, true, false]);
    expect(bare).toEqual([true, false, false]);
    expect(dated).toEqual([false, true, false]);
  });
});

describe("recordPreflightFault", () => {
  it("should refuse only the official model while the form is unpinned", () => {
    // Arrange
    const cases = [
      recordPreflightFault("claude-sonnet-5", null),
      recordPreflightFault("claude-sonnet-5", "bare"),
      recordPreflightFault("claude-haiku-4-5", null),
    ];

    // Act
    const refused = cases.map((fault) => fault !== undefined);

    // Assert
    expect(refused).toEqual([true, false, false]);
  });
});
