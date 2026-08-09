import type { Page } from "@playwright/test";

/**
 * Records the status of every document response, in order.
 *
 * This is the property the SPA-routing specs are actually about: not that the
 * URL is eventually right, but that nothing answered 404 on the way to it. The
 * returned array fills as the page navigates, so it MUST be registered before
 * the first navigation — a listener attached afterwards records an empty list
 * and every assertion against it passes.
 */
export function documentStatuses(page: Page): number[] {
  const statuses: number[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "document") {
      statuses.push(response.status());
    }
  });
  return statuses;
}
