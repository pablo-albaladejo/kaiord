// @vitest-environment jsdom
//
// Kaiord Bridge Core — vendored unit tests for bridge-popup-shell.js.
// Master: packages/_shared/bridge-core/test/bridge-popup-shell.test.js. Never
// edit a vendored copy — edit the master and run `pnpm bridge:sync`. Every
// bridge runs this suite against its own vendored shell copy, so a drifted
// copy fails where it is used rather than only in the parity guard.
import { beforeEach, describe, expect, it } from "vitest";

const {
  renderStatusBlock,
  renderChips,
  renderSkeleton,
  renderCtas,
} = require("../bridge-popup-shell.js");

// Minimal shell markup: the regions every popup.html declares. The renderers
// resolve elements through the injected `$`, so this stands in for the real
// popup document without loading it.
const SHELL_HTML = `
  <div id="status" class="status-block status-block--muted">
    <span class="status-block__dot"></span>
    <span class="status-block__body">
      <span class="status-block__verdict" id="status-text"></span>
      <span class="status-block__cause" id="status-sub" hidden></span>
    </span>
  </div>
  <div id="chips-region"></div>
  <div id="paused-region"></div>
  <div id="footer-region"></div>
`;

const $ = (id) => document.getElementById(id);

const MESSAGES = {
  connected: "Connected",
  connectedAs: "Connected as $1",
  cause: "Because of $1.",
  feeds: "Feeds Kaiord",
  missing: "What Kaiord is missing",
};

const msg = (key, subs) => {
  const template = MESSAGES[key] ?? "";
  if (subs == null) return template;
  return template.replace(/\$(\d)/g, (_, i) =>
    String(subs[Number(i) - 1] ?? "")
  );
};

describe("bridge-popup-shell (vendored)", () => {
  beforeEach(() => {
    document.body.innerHTML = SHELL_HTML;
  });

  describe("renderStatusBlock", () => {
    it("should apply the tone modifier and render verdict plus cause", () => {
      // Arrange
      const options = {
        tone: "ok",
        verdictKey: "connected",
        causeKey: "cause",
      };

      // Act
      renderStatusBlock($, msg, { ...options, causeSubs: ["sleep"] });

      // Assert
      expect($("status").className).toBe("status-block status-block--ok");
      expect($("status-text").textContent).toBe("Connected");
      expect($("status-sub").textContent).toBe("Because of sleep.");
      expect($("status-sub").hidden).toBe(false);
    });

    it("should substitute verdict placeholders", () => {
      // Arrange
      const options = { verdictKey: "connectedAs", verdictSubs: ["Pablo"] };

      // Act
      renderStatusBlock($, msg, options);

      // Assert
      expect($("status-text").textContent).toBe("Connected as Pablo");
    });

    it("should hide the cause line when no cause key is given", () => {
      // Arrange
      renderStatusBlock($, msg, { verdictKey: "connected", causeKey: "cause" });

      // Act
      renderStatusBlock($, msg, { verdictKey: "connected" });

      // Assert
      expect($("status-sub").textContent).toBe("");
      expect($("status-sub").hidden).toBe(true);
    });

    it("should default to the muted tone", () => {
      // Arrange
      const options = { verdictKey: "connected" };

      // Act
      renderStatusBlock($, msg, options);

      // Assert
      expect($("status").className).toBe("status-block status-block--muted");
    });

    it("should leave verdict and cause announceable instead of labelling the block", () => {
      // Arrange
      const options = { verdictKey: "connectedAs", verdictSubs: ["Ana"] };

      // Act
      renderStatusBlock($, msg, {
        ...options,
        causeKey: "cause",
        causeSubs: ["x"],
      });

      // Assert
      // An aria-label here would replace the block's content for assistive
      // tech and swallow the cause sentence.
      expect($("status").getAttribute("aria-label")).toBeNull();
      expect($("status").textContent).toContain("Connected as Ana");
      expect($("status").textContent).toContain("Because of x.");
    });
  });

  describe("renderChips", () => {
    it("should render a caption and one chip per item", () => {
      // Arrange
      const items = [{ label: "Sleep" }, { label: "HRV" }];

      // Act
      renderChips($, items, { caption: msg("feeds") });

      // Assert
      const region = $("chips-region");
      expect(region.querySelector(".caption").textContent).toBe("Feeds Kaiord");
      expect(
        [...region.querySelectorAll(".chip")].map((c) => c.textContent)
      ).toEqual(["Sleep", "HRV"]);
    });

    it("should append the modifier class to a chip that declares one", () => {
      // Arrange
      const items = [{ label: "Weight", modifier: "dashed" }];

      // Act
      renderChips($, items);

      // Assert
      expect($("chips-region").querySelector(".chip").className).toBe(
        "chip chip--dashed"
      );
    });

    it("should clear the region for an empty item list", () => {
      // Arrange
      renderChips($, [{ label: "Sleep" }], { caption: msg("feeds") });

      // Act
      renderChips($, []);

      // Assert
      expect($("chips-region").children.length).toBe(0);
    });

    it("should render into the requested region", () => {
      // Arrange
      const items = [{ label: "Strain", modifier: "muted" }];

      // Act
      renderChips($, items, {
        caption: msg("missing"),
        region: "paused-region",
      });

      // Assert
      expect($("paused-region").textContent).toContain(
        "What Kaiord is missing"
      );
      expect($("chips-region").children.length).toBe(0);
    });
  });

  describe("renderSkeleton", () => {
    it("should fill the chips and footer regions with sized placeholders", () => {
      // Arrange
      const doc = document;

      // Act
      renderSkeleton($);

      // Assert
      expect(
        doc.querySelectorAll("#chips-region .skeleton--caption").length
      ).toBe(1);
      expect(doc.querySelectorAll("#chips-region .skeleton--chip").length).toBe(
        3
      );
      expect(
        doc.querySelectorAll("#footer-region .skeleton--line").length
      ).toBe(2);
      expect(doc.querySelectorAll("#footer-region .skeleton--cta").length).toBe(
        1
      );
    });

    it("should replace any previously rendered content", () => {
      // Arrange
      renderChips($, [{ label: "Sleep" }], { caption: msg("feeds") });

      // Act
      renderSkeleton($);

      // Assert
      expect($("chips-region").querySelectorAll(".chip").length).toBe(0);
    });
  });

  describe("renderCtas", () => {
    it("should render the primary and secondary links as safe new-tab anchors", () => {
      // Arrange
      const options = {
        primaryLabel: "Sign in",
        primaryHref: "https://example.test/in",
        secondaryLabel: "Open editor",
        secondaryHref: "https://example.test/editor",
      };

      // Act
      renderCtas($, options);

      // Assert
      const primary = $("footer-region").querySelector(".cta-primary");
      const secondary = $("footer-region").querySelector(".cta-secondary");
      expect(primary.textContent).toBe("Sign in");
      expect(primary.getAttribute("href")).toBe("https://example.test/in");
      expect(primary.rel).toBe("noopener");
      expect(primary.target).toBe("_blank");
      expect(primary.getAttribute("aria-label")).toBe("Sign in");
      expect(secondary.textContent).toBe("Open editor");
    });

    it("should omit the secondary link when it has no target", () => {
      // Arrange
      const options = {
        primaryLabel: "Sign in",
        primaryHref: "https://example.test/in",
      };

      // Act
      renderCtas($, options);

      // Assert
      expect($("footer-region").querySelector(".cta-secondary")).toBeNull();
    });

    it("should replace the checking skeleton", () => {
      // Arrange
      renderSkeleton($);

      // Act
      renderCtas($, {
        primaryLabel: "Go",
        primaryHref: "https://example.test/",
      });

      // Assert
      expect($("footer-region").querySelectorAll(".skeleton").length).toBe(0);
    });
  });
});
