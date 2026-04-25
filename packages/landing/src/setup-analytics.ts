import { analytics } from "./analytics";

export function setupAnalytics() {
  analytics.pageView(window.location.pathname);

  document
    .querySelectorAll<HTMLAnchorElement>('a[href="/editor/"]')
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("editor-opened"));
    });

  document
    .querySelectorAll<HTMLAnchorElement>(
      'a[href^="https://github.com/pablo-albaladejo/kaiord"]'
    )
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("github-opened"));
    });

  document
    .querySelectorAll<HTMLAnchorElement>('a[href="/docs/"]')
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("docs-opened"));
    });
}
