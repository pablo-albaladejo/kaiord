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

  it("should recognize markdown **bold** as strong (bridge converts <strong> → ** before storing)", () => {
    // Arrange
    const text =
      "Avituallamiento intraentreno\n\n**Calentamiento:** 20 Z1 + 15' Z2.\n\n**Parte Principal:**\n\n3x15' Z3 d/5' Z1";

    // Act
    const result = formatCoachingDescription(text);

    // Assert
    const calentamiento = result.find((p) =>
      p.inlines.some((i) => i.kind === "strong" && i.value === "Calentamiento:")
    );
    expect(calentamiento).toBeDefined();
    const parte = result.find((p) =>
      p.inlines.some(
        (i) => i.kind === "strong" && i.value === "Parte Principal:"
      )
    );
    expect(parte).toBeDefined();
  });

  it("should split on single newlines from train2go-bridge parser output", () => {
    // Arrange
    // The train2go-bridge parser flattens <p> and <br> to single "\n"
    // (see packages/train2go-bridge/parser.js extractDescription), so
    // descriptions arrive with single newlines, not double. Each line
    // must render as its own paragraph.
    const text =
      "Calentamiento – 15 minutos\n10' rodaje en Z2 baja (130-150w / 120-140 bpm)\n3 progresiones de 1' en Z3 -> Z4:\nBloque principal – 3x4 minutos a ritmo de competición";

    // Act
    const result = formatCoachingDescription(text);

    // Assert
    // eslint-disable-next-line no-magic-numbers -- expected paragraph count from 4-line input
    expect(result).toHaveLength(4);
    expect(result[0]?.inlines[0]?.value).toBe("Calentamiento – 15 minutos");
    expect(result[1]?.inlines[0]?.value).toBe(
      "10' rodaje en Z2 baja (130-150w / 120-140 bpm)"
    );
    expect(result[2]?.inlines[0]?.value).toBe(
      "3 progresiones de 1' en Z3 -> Z4:"
    );
    expect(result[3]?.inlines[0]?.value).toBe(
      "Bloque principal – 3x4 minutos a ritmo de competición"
    );
  });

  it("should preserve <strong> with attributes", () => {
    // Arrange
    const html = '<p>Effort <strong class="zone-4">Z4</strong></p>';

    // Act
    const result = formatCoachingDescription(html);

    // Assert
    expect(result[0]?.inlines).toEqual([
      { kind: "text", value: "Effort" },
      { kind: "strong", value: "Z4" },
    ]);
  });

  it("should render bullet-list output from train2go-bridge as one paragraph per line", () => {
    // Arrange
    // End-to-end shape: the train2go-bridge parser converts
    // `<p>title</p><ul><li>a</li><li>b</li><li>c</li></ul><p>tail</p>`
    // into the 5-line "\n"-separated text below. The SPA renderer
    // MUST split each line into its own paragraph so bullets don't
    // collapse onto a single line (user-reported regression).
    const text =
      "3 progresiones de 1' en Z3 → Z4:\n1' @ 200–220w\n1' @ 220–240w\n1' @ 240–260w\n(Recuperación 1' fácil entre cada una)";

    // Act
    const result = formatCoachingDescription(text);

    // Assert
    // eslint-disable-next-line no-magic-numbers -- expected paragraph count from 5-line bullet shape
    expect(result).toHaveLength(5);
    expect(result[0]?.inlines[0]?.value).toBe(
      "3 progresiones de 1' en Z3 → Z4:"
    );
    expect(result[1]?.inlines[0]?.value).toBe("1' @ 200–220w");
    expect(result[2]?.inlines[0]?.value).toBe("1' @ 220–240w");
    expect(result[3]?.inlines[0]?.value).toBe("1' @ 240–260w");
    expect(result[4]?.inlines[0]?.value).toBe(
      "(Recuperación 1' fácil entre cada una)"
    );
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
