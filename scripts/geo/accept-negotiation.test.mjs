import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prefersMarkdown } from "./accept-negotiation.mjs";

const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

describe("accept-negotiation", () => {
  it("should prefer markdown only when it is named and not ranked below html", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
    assert.equal(prefersMarkdown("text/html, text/markdown;q=0.5"), false);
    assert.equal(prefersMarkdown("text/markdown;q=0"), false);
    assert.equal(prefersMarkdown(BROWSER_ACCEPT), false);
    assert.equal(prefersMarkdown("text/markdown;q=0.5, */*"), false);
    assert.equal(prefersMarkdown("text/markdown;q=0.5, text/*"), false);
    assert.equal(prefersMarkdown("text/markdown, */*;q=0.8"), true);
    assert.equal(
      prefersMarkdown("text/markdown;q=0.5, text/html;q=0.4, */*"),
      true
    );
    assert.equal(prefersMarkdown("text/*"), false);
    assert.equal(prefersMarkdown(null), false);
  });
});
