import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import wouterPkg from "../node_modules/wouter/package.json" with { type: "json" };
import { computeRouterBase } from "./router-base";

describe("computeRouterBase", () => {
  it.each([
    ["/", ""],
    ["/editor/", "/editor"],
    ["/a/b/", "/a/b"],
    // Vite normalises BASE_URL to start+end with `/`. The empty-string row is
    // a defensive guard against a future Vite contract regression.
    ["", ""],
  ])("should strip trailing slash from %j to produce %j", (input, expected) => {
    const result = computeRouterBase(input);

    expect(result).toBe(expected);
  });
});

describe("wouter Router base contract", () => {
  it("should match a route at /editor/x when base is /editor", () => {
    const { hook } = memoryLocation({ path: "/editor/x" });

    render(
      <Router base="/editor" hook={hook}>
        <Route path="/x">{() => <span>ok</span>}</Route>
      </Router>
    );

    expect(screen.getByText("ok")).toBeTruthy();
  });

  it("should be pinned to wouter major version 3", () => {
    expect(wouterPkg.version.split(".")[0]).toBe("3");
  });
});
