import { analytics } from "./analytics";

function trackClicks(selector: string, event: string): void {
  document
    .querySelectorAll<HTMLAnchorElement>(selector)
    .forEach((a) => a.addEventListener("click", () => analytics.event(event)));
}

export function setupAnalytics() {
  analytics.pageView(window.location.pathname);
  trackClicks('a[href="/editor/"]', "editor-opened");
  trackClicks(
    'a[href^="https://github.com/pablo-albaladejo/kaiord"]',
    "github-opened"
  );
  trackClicks('a[href="/docs/"]', "docs-opened");
}
