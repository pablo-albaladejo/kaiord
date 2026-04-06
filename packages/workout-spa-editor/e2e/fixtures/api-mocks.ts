/**
 * API mocking utilities for E2E tests.
 * Intercepts LLM provider and Lambda endpoints via page.route().
 */

import type { Page } from "@playwright/test";

import { LAMBDA_AUTH_ERROR, LAMBDA_SUCCESS } from "./lambda-responses";
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

/** Intercept Lambda push endpoint with a success response. */
export async function mockLambdaSuccess(page: Page): Promise<void> {
  await page.route("**execute-api**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(LAMBDA_SUCCESS),
    })
  );
}

/** Intercept Lambda push endpoint with a 401 auth error. */
export async function mockLambdaAuthError(page: Page): Promise<void> {
  await page.route("**execute-api**", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify(LAMBDA_AUTH_ERROR),
    })
  );
}
