/**
 * API mocking utilities for E2E tests.
 * Intercepts LLM provider endpoints via page.route().
 *
 * Three named helpers cover the dialog flows that exercise the AI
 * transport boundary:
 *   - `mockLlmSuccess(page, response?)` resolves with a 200 + JSON body.
 *   - `mockLlmFailure(page, error?)` resolves with an error status.
 *   - `mockLlmHang(page)` never resolves (cancel/abort flows).
 * `mockLlmApis(page, response?)` is preserved for existing callers and
 * delegates to `mockLlmSuccess` so the behaviour is unchanged.
 */

import type { Page } from "@playwright/test";

import { LLM_CYCLING_RESPONSE } from "./llm-responses";

const LLM_ROUTE_PATTERNS = [
  "**/api.anthropic.com/**",
  "**/api.openai.com/**",
  "**/generativelanguage.googleapis.com/**",
];

export type LlmFailure = {
  status?: number;
  body?: string;
  contentType?: string;
};

/** Intercept all LLM provider API calls and return a mock structured output. */
export async function mockLlmSuccess(
  page: Page,
  response: unknown = LLM_CYCLING_RESPONSE
): Promise<void> {
  for (const pattern of LLM_ROUTE_PATTERNS) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      })
    );
  }
}

/** Intercept all LLM provider API calls and return an error response. */
export async function mockLlmFailure(
  page: Page,
  error: LlmFailure = {}
): Promise<void> {
  const status = error.status ?? 500;
  const body = error.body ?? JSON.stringify({ error: "Mocked LLM failure" });
  const contentType = error.contentType ?? "application/json";
  for (const pattern of LLM_ROUTE_PATTERNS) {
    await page.route(pattern, (route) =>
      route.fulfill({ status, contentType, body })
    );
  }
}

/**
 * Intercept all LLM provider API calls but never resolve the request.
 * Used to exercise the in-flight / cancel / re-click-while-pending flows.
 */
export async function mockLlmHang(page: Page): Promise<void> {
  for (const pattern of LLM_ROUTE_PATTERNS) {
    await page.route(pattern, () => {
      // Intentionally never call route.fulfill / route.abort / route.continue.
    });
  }
}

/** Back-compat wrapper: forwards to {@link mockLlmSuccess}. */
export async function mockLlmApis(
  page: Page,
  response: unknown = LLM_CYCLING_RESPONSE
): Promise<void> {
  await mockLlmSuccess(page, response);
}
