import { describe, expect, it } from "vitest";

import { getTranslate } from "../../i18n/use-translate";
import { attentionCauseText } from "./attention-cause-copy";
import type { AttentionCause } from "./source-attention";

const t = getTranslate("common");

describe("attentionCauseText", () => {
  it("should state the failed read and offer a sign-in without diagnosing why", () => {
    // Arrange
    const cause: AttentionCause = { kind: "noAccess" };

    // Act
    const text = attentionCauseText(cause, t);

    // Assert
    // Pinned as concepts, not as one punctuated sentence: the wording is free
    // to change, the claim it may not make is not.
    expect(text).toMatch(/cannot read/i);
    expect(text).toMatch(/sign(?:ing)?\s+in\b/i);
    expect(text).not.toMatch(/sign(?:ed|ing)?[\s-]*out|signout/i);
  });

  it("should tell an outdated extension to update", () => {
    // Arrange
    const cause: AttentionCause = { kind: "extensionOutdated" };

    // Act
    const text = attentionCauseText(cause, t);

    // Assert
    expect(text).toBe("An extension is out of date — update it to resume");
  });

  it("should date the consequence from the last data that arrived", () => {
    // Arrange
    const cause: AttentionCause = {
      kind: "noNewDataSince",
      date: "2026-07-25",
    };

    // Act
    const text = attentionCauseText(cause, t);

    // Assert
    expect(text).toBe("No new data since 2026-07-25");
  });

  it("should never claim a credential expired or a session was signed out", () => {
    // Arrange
    // WHOOP cannot distinguish an expired token from never having signed in,
    // and Garmin's reads outlive the browser session entirely, so no cause may
    // word itself as an expiry OR as a sign-out.
    const causes: readonly AttentionCause[] = [
      { kind: "noAccess" },
      { kind: "extensionOutdated" },
      { kind: "noNewDataSince", date: "2026-07-25" },
    ];

    // Act
    const texts = causes.map((cause) => attentionCauseText(cause, t));

    // Assert
    for (const text of texts) {
      expect(text).not.toMatch(/expir/i);
      expect(text).not.toMatch(/sign(?:ed|ing)?[\s-]*out|signout/i);
    }
  });
});
