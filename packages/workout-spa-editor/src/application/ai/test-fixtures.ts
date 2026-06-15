/**
 * Shared fixtures for the AI use-case tests.
 */

import type { AddProviderInput } from "./add-provider";

export const baseProvider: AddProviderInput = {
  type: "anthropic",
  apiKey: "sk-test-1",
  label: "Anthropic",
};

export const secondProvider: AddProviderInput = {
  type: "openai",
  apiKey: "sk-test-2",
  label: "OpenAI",
};
