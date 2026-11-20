import { describe, expect, it } from "vitest";

import { expandIncludes } from "../scripts/expand-includes.mjs";
import indexHtml from "../index.html?raw";
import phoneScreen from "../partials/phone-screen.html?raw";

// vitest serves files as /@fs/<abs path>; the helper needs the real directory.
const landingRoot = decodeURIComponent(
  new URL("..", import.meta.url).pathname
).replace(/^\/@fs/, "");

describe("expandIncludes", () => {
  it("should leave html without markers unchanged", () => {
    // Arrange
    const html = "<main><!-- plain comment --></main>";

    // Act
    const result = expandIncludes(html, landingRoot);

    // Assert
    expect(result).toBe(html);
  });

  it("should expand the phone mockup marker once per slot in index.html", () => {
    // Arrange
    const markers = indexHtml.match(/@include partials\/phone-screen\.html/g);

    // Act
    const expanded = expandIncludes(indexHtml, landingRoot);

    // Assert
    expect(markers).toHaveLength(2);
    expect(expanded).not.toContain("@include");
    expect(expanded.match(/Push to Garmin/g)).toHaveLength(2);
  });

  it("should indent every partial line to the marker's indentation", () => {
    // Arrange
    const html =
      "<div>\n    <!-- @include partials/phone-screen.html -->\n</div>";
    const firstLine = phoneScreen.split("\n")[0];

    // Act
    const result = expandIncludes(html, landingRoot);

    // Assert
    expect(result.split("\n")[1]).toBe(`    ${firstLine}`);
  });
});
