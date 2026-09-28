import { describe, expect, it } from "vitest";

import indexHtml from "../index.html?raw";
import meta from "../i18n/meta.json";

// Search engines cut snippets at ~160 characters; a longer description is
// truncated mid-sentence in results.
const MAX_DESCRIPTION = 160;
const DESCRIPTION_SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:description"]',
  'meta[name="twitter:description"]',
];

const en = new DOMParser().parseFromString(indexHtml, "text/html");
const length = (text: string) => [...text].length;

describe("landing meta descriptions", () => {
  it("should keep every EN description within 160 characters", () => {
    // Arrange
    const contents = DESCRIPTION_SELECTORS.map(
      (selector) => en.querySelector(selector)?.getAttribute("content") ?? ""
    );

    // Act
    const lengths = contents.map(length);

    // Assert
    expect(contents.every((text) => text.length > 0)).toBe(true);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it("should keep every ES description within 160 characters", () => {
    // Arrange
    const contents = [meta.es.description, meta.es.ogDescription];

    // Act
    const lengths = contents.map(length);

    // Assert
    expect(Math.min(...lengths)).toBeGreaterThan(0);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it("should give the EN and ES pages different titles and descriptions", () => {
    // Arrange
    const enDescription = en
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    // Act
    const enTitle = en.querySelector("title")?.textContent;

    // Assert
    expect(enTitle).not.toBe(meta.es.title);
    expect(enDescription).not.toBe(meta.es.description);
  });
});
