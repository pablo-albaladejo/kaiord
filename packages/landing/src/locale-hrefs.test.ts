import { describe, expect, it } from "vitest";

import indexHtml from "../index.html?raw";
import { applyLocaleHrefs } from "../scripts/build-locales.mjs";

const ATHLETE_GUIDES = 3;

const guideLinks = (lang: "en" | "es") => {
  const doc = new DOMParser().parseFromString(indexHtml, "text/html");
  applyLocaleHrefs(doc, lang);
  const hrefs = [...doc.querySelectorAll("a[href*='/docs/']")]
    .map((a) => a.getAttribute("href") ?? "")
    .filter((href) => href.includes("/guide/"));
  return { doc, hrefs };
};

describe("landing locale hrefs", () => {
  it("should point the Spanish page at the Spanish guides", () => {
    // Arrange
    const lang = "es";

    // Act
    const { doc, hrefs } = guideLinks(lang);

    // Assert
    expect(hrefs.length).toBeGreaterThanOrEqual(ATHLETE_GUIDES);
    expect(hrefs.every((href) => href.includes("/docs/es/guide/"))).toBe(true);
    expect(doc.querySelector("[data-es-href]")).toBeNull();
  });

  it("should keep the English guides on the English page", () => {
    // Arrange
    const lang = "en";

    // Act
    const { doc, hrefs } = guideLinks(lang);

    // Assert
    expect(hrefs.length).toBeGreaterThanOrEqual(ATHLETE_GUIDES);
    expect(hrefs.some((href) => href.includes("/docs/es/"))).toBe(false);
    expect(doc.querySelector("[data-es-href]")).toBeNull();
  });
});
