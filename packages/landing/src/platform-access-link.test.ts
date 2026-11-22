import { describe, expect, it } from "vitest";

import indexHtml from "../index.html?raw";
import { applyLocaleHrefs } from "../scripts/build-locales.mjs";

// The public register of unofficial access per Platform (#1631) is linked
// from the landing footer, on both locales.
const REGISTER = "/docs/legal/platform-access";

const footerLinks = (lang: "en" | "es") => {
  const doc = new DOMParser().parseFromString(indexHtml, "text/html");
  applyLocaleHrefs(doc, lang);
  return [...doc.querySelectorAll("footer a")].map((a) =>
    a.getAttribute("href")
  );
};

describe("landing platform access link", () => {
  it("should link the footer to the platform access register in English", () => {
    // Arrange
    const lang = "en";

    // Act
    const hrefs = footerLinks(lang);

    // Assert
    expect(hrefs).toContain(REGISTER);
  });

  it("should keep the link on the Spanish page", () => {
    // Arrange
    const lang = "es";

    // Act
    const hrefs = footerLinks(lang);

    // Assert
    expect(hrefs).toContain(REGISTER);
  });
});
