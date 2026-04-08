/**
 * API mocking utilities for E2E tests.
 * Intercepts LLM provider endpoints via page.route().
 */

import type { Page } from "@playwright/test";

import { LLM_CYCLING_RESPONSE } from "./llm-responses";

/** Intercept all LLM provider API calls and return a mock structured output. */
export async function mockLlmApis(
  page: Page,
  response = LLM_CYCLING_RESPONSE
): Promise<void> {
  const patterns = [
    "**/api.anthropic.com/**",
    "**/api.openai.com/**",
    "**/generativelanguage.googleapis.com/**",
  ];

  for (const pattern of patterns) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      })
    );
  }
}
