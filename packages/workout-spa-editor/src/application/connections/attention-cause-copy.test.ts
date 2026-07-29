import { describe, expect, it } from "vitest";

import { getTranslate } from "../../i18n/use-translate";
import { attentionCauseText } from "./attention-cause-copy";
import type { AttentionCause } from "./source-attention";

const t = getTranslate("common");

describe("attentionCauseText", () => {
  it("should tell a signed-out source to sign in again", () => {
    // Arrange
    const cause: AttentionCause = { kind: "signedOut" };

    // Act
    const text = attentionCauseText(cause, t);

    // Assert
    expect(text).toBe("Session signed out — sign in again to resume");
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

  it("should never claim a credential expired", () => {
    // Arrange
    // WHOOP cannot distinguish an expired token from never having signed in,
    // so no cause may word itself as an expiry.
    const causes: readonly AttentionCause[] = [
      { kind: "signedOut" },
      { kind: "extensionOutdated" },
      { kind: "noNewDataSince", date: "2026-07-25" },
    ];

    // Act
    const texts = causes.map((cause) => attentionCauseText(cause, t));

    // Assert
    expect(texts.some((text) => /expir/i.test(text))).toBe(false);
  });
});
