import { describe, expect, it } from "vitest";

import {
  buildSitemap,
  createGitProvider,
  PAGES,
  type GitProvider,
} from "../scripts/build-sitemap.mjs";

const DATES: Record<string, string> = {
  "https://kaiord.com/": "2026-09-01T00:00:00.000Z",
  "https://kaiord.com/es/": "2026-09-02T00:00:00.000Z",
  "https://kaiord.com/app/": "2026-09-03T00:00:00.000Z",
};

const fullHistory: GitProvider = {
  isShallow: () => false,
  lastCommitDate: (paths) =>
    DATES[PAGES.find((page) => page.sources === paths)?.loc ?? ""] ?? null,
};

const shallow: GitProvider = {
  isShallow: () => true,
  lastCommitDate: () => "2026-09-28T00:00:00.000Z",
};

const lastmods = (xml: string) =>
  [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);

describe("landing sitemap", () => {
  it("should date every URL from git when the history is complete", () => {
    // Arrange
    const env = { REQUIRE_FULL_HISTORY: "1" };

    // Act
    const xml = buildSitemap({ git: fullHistory, env });

    // Assert
    expect(xml.match(/<loc>/g)).toHaveLength(PAGES.length);
    expect(lastmods(xml)).toEqual(Object.values(DATES));
    expect(xml).toContain('hreflang="es" href="https://kaiord.com/es/"');
  });

  it("should omit lastmod in a shallow clone rather than date it HEAD", () => {
    // Arrange
    const env = {};

    // Act
    const xml = buildSitemap({ git: shallow, env });

    // Assert
    expect(xml.match(/<loc>/g)).toHaveLength(PAGES.length);
    expect(xml).not.toContain("<lastmod>");
  });

  it("should throw in a shallow clone when REQUIRE_FULL_HISTORY=1", () => {
    // Arrange
    const env = { REQUIRE_FULL_HISTORY: "1" };

    // Act
    const build = () => buildSitemap({ git: shallow, env });

    // Assert
    expect(build).toThrow(/fetch-depth: 0/);
  });

  it("should throw when a page has no commit date and history is required", () => {
    // Arrange
    const git: GitProvider = {
      isShallow: () => false,
      lastCommitDate: () => null,
    };

    // Act
    const build = () =>
      buildSitemap({ git, env: { REQUIRE_FULL_HISTORY: "1" } });

    // Assert
    expect(build).toThrow(/no commit dates https:\/\/kaiord.com\//);
  });

  it("should read shallowness and dates through the injected git", () => {
    // Arrange
    const calls: string[][] = [];
    const git = createGitProvider((args) => {
      calls.push(args);
      return args[0] === "rev-parse" ? "false" : "1767225600";
    });

    // Act
    const shallowClone = git.isShallow();
    const date = git.lastCommitDate(["packages/landing/src"]);

    // Assert
    expect(shallowClone).toBe(false);
    expect(date).toBe("2026-01-01T00:00:00.000Z");
    expect(calls[1]).toEqual([
      "log",
      "-1",
      "--format=%at",
      "--",
      "packages/landing/src",
    ]);
  });

  it("should treat a failing git as no history", () => {
    // Arrange
    const git = createGitProvider(() => null);

    // Act
    const shallowClone = git.isShallow();

    // Assert
    expect(shallowClone).toBe(true);
  });
});
