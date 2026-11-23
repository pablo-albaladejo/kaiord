import { describe, expect, it } from "vitest";

import { getTranslate } from "../../i18n/use-translate";
import { attentionCauseText } from "./attention-cause-copy";
import type { AttentionCause } from "./source-attention";

const t = getTranslate("common");
const tEs = getTranslate("common", "es");

describe("attentionCauseText", () => {
  it("should word a lone source with its own Connection notice", () => {
    // Arrange
    const cause: AttentionCause = {
      kind: "notice",
      connection: "not-answering",
      name: "Garmin",
    };

    // Act
    const text = attentionCauseText(cause, t, "en");

    // Assert
    expect(text).toBe(
      "Garmin is not answering, so you cannot use it in Kaiord right now."
    );
  });

  it("should tell an outdated extension to update, by its name", () => {
    // Arrange
    const cause: AttentionCause = {
      kind: "notice",
      connection: "outdated",
      name: "WHOOP",
    };

    // Act
    const text = attentionCauseText(cause, tEs, "es");

    // Assert
    expect(text).toBe(
      "No puedes usar WHOOP en Kaiord hasta que actualices Kaiord for WHOOP."
    );
  });

  it("should claim only the count for several sources", () => {
    // Arrange
    const cause: AttentionCause = { kind: "several" };

    // Act
    const text = attentionCauseText(cause, t, "en");

    // Assert
    expect(text).toBe("Each one shows its fix on Connections.");
  });

  it("should never claim a credential expired or a session was signed out", () => {
    // Arrange
    const causes: readonly AttentionCause[] = [
      { kind: "notice", connection: "not-answering", name: "Garmin" },
      { kind: "notice", connection: "signed-out", name: "Train2Go" },
      { kind: "notice", connection: "outdated", name: "WHOOP" },
      { kind: "several" },
    ];

    // Act
    const texts = causes.map((cause) => attentionCauseText(cause, t, "en"));

    // Assert
    for (const text of texts) {
      expect(text).not.toMatch(/expir/i);
      expect(text).not.toMatch(/sign(?:ed|ing)?[\s-]*out|signout/i);
    }
  });
});
