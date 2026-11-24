/**
 * The content security policy, enforced on the built App served the way the
 * static host serves it (assembled by `scripts/assemble-site.mjs`, which
 * writes the policy). Pages sets no headers, so the policy is the `<meta>`
 * the assembler puts first in `<head>`; these specs read it from the served
 * page and watch the browser enforce it.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  type MergedDist,
  startMergedDist,
} from "./fixtures/merged-dist-server";
import { turnOnCapability } from "./helpers/turn-on-capability";

const ENABLED = process.env.E2E_PROD_BASE === "1";
const BOOT_TIMEOUT_MS = 15_000;
const WEBSITE_ID = "00000000-0000-4000-8000-000000000000";

// A source that would let code nobody hashed run.
const UNSAFE_SCRIPT_SOURCE =
  /^'unsafe-(inline|eval|hashes)'$|\*|^[a-z][a-z0-9+.-]*:$/i;

const PAGES = [
  { route: "/daily", testId: "daily-page" },
  { route: "/calendar", testId: "calendar-page" },
  { route: "/library", testId: "library-page" },
  { route: "/athletes", testId: "athletes-page" },
  { route: "/connections", testId: "connections-page" },
  { route: "/settings", testId: "settings-page" },
  { route: "/convert", testId: "convert-page" },
  { route: "/chat", testId: "chat-page" },
];

type Violation = { directive: string; blocked: string };

type Probe = {
  __cspViolations?: Violation[];
  __cspInjectedRan?: boolean;
  __KAIORD_CONFIG__?: { umamiWebsiteId: string };
};

/** Records every violation from the first byte of every document. */
async function recordViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Probe;
    w.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      w.__cspViolations?.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      });
    });
  });
}

const violations = (page: Page): Promise<Violation[]> =>
  page.evaluate(() => (window as unknown as Probe).__cspViolations ?? []);

async function scriptSources(page: Page): Promise<string[]> {
  const policy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute("content");
  const directive = (policy ?? "")
    .split(";")
    .map((part) => part.trim().split(/\s+/))
    .find(([name]) => name === "script-src");
  return directive?.slice(1) ?? [];
}

test.describe("@csp content security policy on the built App", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("csp");
  });

  test.afterAll(async () => {
    await dist.close();
  });

  test("should serve the App with a script policy that admits no unsafe source", async ({
    page,
  }) => {
    // Arrange
    await page.goto(dist.routeUrl("/calendar"));

    // Act
    const sources = await scriptSources(page);

    // Assert
    expect(sources).toContain("'self'");
    expect(
      sources.filter((source) => UNSAFE_SCRIPT_SOURCE.test(source))
    ).toEqual([]);
  });

  test.describe("with a script injected on purpose", () => {
    test.use({ cspViolationsAllowed: true });

    test("should block a script injected into the running App", async ({
      page,
    }) => {
      // Arrange
      await recordViolations(page);
      await page.goto(dist.routeUrl("/calendar"));
      await expect(page.getByTestId("calendar-page")).toBeVisible({
        timeout: BOOT_TIMEOUT_MS,
      });

      // Act
      await page.evaluate(() => {
        const script = document.createElement("script");
        script.textContent = "window.__cspInjectedRan = true;";
        document.body.appendChild(script);
      });

      // Assert
      expect(
        await page.evaluate(() => (window as unknown as Probe).__cspInjectedRan)
      ).toBeUndefined();
      await expect
        .poll(async () => (await violations(page)).map((v) => v.directive))
        .toContainEqual(expect.stringMatching(/^script-src/));
    });
  });

  test("should open every page, with analytics on, without a policy violation", async ({
    page,
  }) => {
    // Arrange
    await recordViolations(page);
    await page.addInitScript((id) => {
      (window as unknown as Probe).__KAIORD_CONFIG__ = { umamiWebsiteId: id };
    }, WEBSITE_ID);
    let trackerLoaded = false;
    await page.route("https://cloud.umami.is/script.js", (route) => {
      trackerLoaded = true;
      return route.fulfill({
        contentType: "application/javascript",
        body: "window.umami = { track: function () {} };",
      });
    });

    const seen: Violation[] = [];

    // Act: Templates owns /library and is off for a new athlete.
    await turnOnCapability(page, (r) => dist.routeUrl(r), /templates/i);
    for (const { route, testId } of PAGES) {
      await page.goto(dist.routeUrl(route));
      await expect(page.getByTestId(testId)).toBeVisible({
        timeout: BOOT_TIMEOUT_MS,
      });
      seen.push(...(await violations(page)));
    }

    // Assert
    expect(trackerLoaded).toBe(true);
    expect(seen).toEqual([]);
  });
});

test.describe("@csp content security policy on the landing", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("csp-landing", { realLanding: true });
  });

  test.afterAll(async () => {
    await dist.close();
  });

  for (const path of ["/", "/es/", "/no-such-page"]) {
    test(`should serve ${path} under a safe policy and load it without a violation`, async ({
      page,
    }) => {
      // Arrange
      await recordViolations(page);

      // Act
      await page.goto(`${dist.server.url}${path}`, { waitUntil: "load" });
      const sources = await scriptSources(page);

      // Assert
      expect(sources).toContain("'self'");
      expect(
        sources.filter((source) => UNSAFE_SCRIPT_SOURCE.test(source))
      ).toEqual([]);
      expect(await violations(page)).toEqual([]);
    });
  }
});

test.describe("@csp content security policy on the docs", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("csp-docs", { withDocs: true });
  });

  test.afterAll(async () => {
    await dist.close();
  });

  const docsUrl = (path: string) => `${dist.server.url}/docs/${path}`;

  for (const path of [
    "",
    "guide/getting-started.html",
    "es/",
    "legal/privacy-policy.html",
    "404.html",
  ]) {
    test(`should serve /docs/${path} under a safe policy and load it without a violation`, async ({
      page,
    }) => {
      // Arrange
      await recordViolations(page);

      // Act
      await page.goto(docsUrl(path), { waitUntil: "load" });
      const sources = await scriptSources(page);

      // Assert
      expect(sources).toContain("'self'");
      expect(
        sources.filter((source) => UNSAFE_SCRIPT_SOURCE.test(source))
      ).toEqual([]);
      await expect(page.locator(".VPNavBarSearchButton")).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test.describe("with a script injected on purpose", () => {
    test.use({ cspViolationsAllowed: true });

    test("should block a script injected into a docs page", async ({
      page,
    }) => {
      // Arrange
      await recordViolations(page);
      await page.goto(docsUrl("guide/getting-started.html"), {
        waitUntil: "load",
      });

      // Act
      await page.evaluate(() => {
        const script = document.createElement("script");
        script.textContent = "window.__cspInjectedRan = true;";
        document.body.appendChild(script);
      });

      // Assert
      expect(
        await page.evaluate(() => (window as unknown as Probe).__cspInjectedRan)
      ).toBeUndefined();
      await expect
        .poll(async () => (await violations(page)).map((v) => v.directive))
        .toContainEqual(expect.stringMatching(/^script-src/));
    });
  });

  test("should find a page with the local search and open it", async ({
    page,
  }) => {
    // Arrange
    await recordViolations(page);
    await page.goto(docsUrl(""), { waitUntil: "load" });

    // Act
    await page.locator(".VPNavBarSearchButton").click();
    await page
      .locator(".VPLocalSearchBox .search-input")
      .fill("getting started");
    const firstResult = page.locator(".VPLocalSearchBox .results li a").first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Assert
    await expect(page.locator(".VPLocalSearchBox")).toBeHidden();
    await expect(page).not.toHaveURL(docsUrl(""));
    await expect(page.locator(".vp-doc h1").first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("should switch the theme and keep it across a reload", async ({
    page,
  }) => {
    // Arrange
    await recordViolations(page);
    await page.goto(docsUrl("guide/getting-started.html"), {
      waitUntil: "load",
    });
    const html = page.locator("html");
    await expect(html).toHaveClass(/\bdark\b/);

    // Act
    await page.locator(".VPNavBarAppearance .VPSwitchAppearance").click();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await page.reload({ waitUntil: "load" });

    // Assert
    await expect(html).not.toHaveClass(/\bdark\b/);
    expect(await violations(page)).toEqual([]);
  });
});
