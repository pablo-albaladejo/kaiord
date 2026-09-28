import { afterEach, describe, expect, it, vi } from "vitest";
import indexHtml from "../index.html?raw";

import { setupAnalytics } from "./setup-analytics";

const { event } = vi.hoisted(() => ({ event: vi.fn() }));
vi.mock("./analytics", () => ({
  analytics: { event, pageView: vi.fn() },
}));

const CWS =
  "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";

function mountLinks(): void {
  document.body.innerHTML = `
    <a id="cws" href="${CWS}">Install</a>
    <a id="cws-odd" href="https://chromewebstore.google.com/category/extensions">Store</a>
    <a id="app" href="/app/">Open</a>`;
}

const click = (id: string): void => {
  document.getElementById(id)?.dispatchEvent(new MouseEvent("click"));
};

describe("setupAnalytics", () => {
  afterEach(() => {
    event.mockClear();
    document.body.innerHTML = "";
  });

  it("should send extension-install-clicked with only the listing slug", () => {
    // Arrange
    mountLinks();
    setupAnalytics();

    // Act
    click("cws");

    // Assert
    expect(event).toHaveBeenCalledTimes(1);
    expect(event).toHaveBeenCalledWith("extension-install-clicked", {
      extension: "kaiord-garmin-bridge",
    });
  });

  it("should send unknown instead of any other part of a non-listing URL", () => {
    // Arrange
    mountLinks();
    setupAnalytics();

    // Act
    click("cws-odd");

    // Assert
    expect(event).toHaveBeenCalledWith("extension-install-clicked", {
      extension: "unknown",
    });
  });

  it("should keep the existing editor-opened event without a payload", () => {
    // Arrange
    mountLinks();
    setupAnalytics();

    // Act
    click("app");

    // Assert
    expect(event).toHaveBeenCalledWith("editor-opened", undefined);
  });

  it("should match every Chrome Web Store link on the landing page", () => {
    // Arrange
    document.body.innerHTML = indexHtml.slice(indexHtml.indexOf("<body"));
    setupAnalytics();
    const links = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="https://chromewebstore.google.com/"]'
    );

    // Act
    links.forEach((a) => a.dispatchEvent(new MouseEvent("click")));

    // Assert
    expect(links.length).toBeGreaterThan(0);
    expect(event.mock.calls).toEqual(
      [...links].map(() => [
        "extension-install-clicked",
        { extension: "kaiord-garmin-bridge" },
      ])
    );
  });
});
