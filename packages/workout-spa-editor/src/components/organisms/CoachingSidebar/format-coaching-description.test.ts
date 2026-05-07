/**
 * Tests for `formatCoachingDescription`. Verifies the spec'd contract:
 * `<p>` paragraphs and `<strong>` markers preserved; everything else
 * stripped. Plain text falls back to `\n\n`-split paragraphs.
 */
import { describe, expect, it } from "vitest";

import { formatCoachingDescription } from "./format-coaching-description";

describe("formatCoachingDescription", () => {
  it("should preserve <p> paragraph boundaries", () => {
    // Arrange
    const html = "<p>First paragraph</p><p>Second paragraph</p>";

    // Act
    const result = formatCoachingDescription(html);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]?.inlines).toEqual([
      { kind: "text", value: "First paragraph" },
    ]);
    expect(result[1]?.inlines).toEqual([
      { kind: "text", value: "Second paragraph" },
    ]);
  });

  it("should preserve <strong> as inline emphasis", () => {
    // Arrange
    const html = "<p>Sweet spot at <strong>FTP - 5%</strong> for 20 min</p>";

    // Act
    const result = formatCoachingDescription(html);

    // Assert
    expect(result[0]?.inlines).toEqual([
      { kind: "text", value: "Sweet spot at" },
      { kind: "strong", value: "FTP - 5%" },
      { kind: "text", value: "for 20 min" },
    ]);
  });

  it("should strip non-allowlisted tags", () => {
    // Arrange
    const html = '<p>Be <em>careful</em> with <a href="x">links</a></p>';

    // Act
    const result = formatCoachingDescription(html);

    // Assert
    expect(result[0]?.inlines).toEqual([
      { kind: "text", value: "Be careful with links" },
    ]);
  });

  it("should fall back to \\n\\n-split paragraphs for plain text", () => {
    // Arrange
    const text = "Warmup 10 min easy.\n\nThen 4×5 min Z4.";

    // Act
    const result = formatCoachingDescription(text);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]?.inlines[0]?.value).toBe("Warmup 10 min easy.");
    expect(result[1]?.inlines[0]?.value).toBe("Then 4×5 min Z4.");
  });

  it("should decode common HTML entities", () => {
    // Arrange
    const html = "<p>Pace &lt; threshold &amp; effort &gt; Z3</p>";

    // Act
    const result = formatCoachingDescription(html);

    // Assert
    expect(result[0]?.inlines[0]?.value).toBe("Pace < threshold & effort > Z3");
  });
});
