import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jsonLdUnits } from "./claims-jsonld.mjs";

const block = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

describe("claims-jsonld", () => {
  it("should read the names, descriptions and answers a search engine shows, not ids, urls or types", () => {
    // Arrange
    const html = block({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "#site",
          name: "Kaiord",
          url: "https://x.test/",
          description: "A site.",
        },
        {
          "@type": "FAQPage",
          mainEntity: [{ name: "Q?", acceptedAnswer: { text: "A." } }],
        },
        { "@type": "Offer", price: "0", priceCurrency: "USD" },
      ],
    });

    // Act
    const { units } = jsonLdUnits(html);

    // Assert
    assert.deepEqual(units, ["Kaiord", "A site.", "Q?", "A."]);
  });

  it("should fail on a block that is not valid JSON", () => {
    // Arrange
    const html = '<script type="application/ld+json">{ broken</script>';

    // Act
    const result = jsonLdUnits(html);

    // Assert
    assert.deepEqual(result, { error: "a JSON-LD block is not valid JSON" });
  });
});
