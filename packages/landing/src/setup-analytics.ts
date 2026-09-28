import type { AnalyticsEvent } from "@kaiord/core";
import { analytics } from "./analytics";

function trackClicks(
  selector: string,
  event: string,
  data?: (link: HTMLAnchorElement) => AnalyticsEvent
): void {
  document
    .querySelectorAll<HTMLAnchorElement>(selector)
    .forEach((a) =>
      a.addEventListener("click", () => analytics.event(event, data?.(a)))
    );
}

// Chrome Web Store listing URLs are /detail/<slug>/<id>: only the public
// listing slug is sent, never the id or anything about the visitor.
export function extensionSlug(link: HTMLAnchorElement): AnalyticsEvent {
  const [, section, slug] = new URL(link.href).pathname.split("/");
  return { extension: section === "detail" && slug ? slug : "unknown" };
}

export function setupAnalytics() {
  analytics.pageView(window.location.pathname);
  trackClicks('a[href="/app/"]', "editor-opened");
  trackClicks(
    'a[href^="https://github.com/pablo-albaladejo/kaiord"]',
    "github-opened"
  );
  trackClicks('a[href="/docs/"]', "docs-opened");
  trackClicks(
    'a[href^="https://chromewebstore.google.com/"]',
    "extension-install-clicked",
    extensionSlug
  );
}
