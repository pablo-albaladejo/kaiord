/**
 * Every place data can leave the device for. A Provider and a service name
 * the origins the App's content security policy allows for it; a Platform is
 * reached through its extension, which a page policy does not govern.
 * Names are proper nouns, the same in every language.
 */
import type { LlmProviderType } from "@kaiord/ai/providers";

import type { ExtensionId } from "../connections/extension-descriptors";

export type Destination =
  | {
      group: "provider";
      name: string;
      providerType: LlmProviderType;
      origins: readonly string[];
    }
  | { group: "platform"; name: string; extension: ExtensionId }
  | {
      group: "service" | "analytics";
      name: string;
      origins: readonly string[];
    };

export const DESTINATIONS = {
  anthropic: {
    group: "provider",
    name: "Anthropic",
    providerType: "anthropic",
    origins: ["https://api.anthropic.com"],
  },
  openai: {
    group: "provider",
    name: "OpenAI",
    providerType: "openai",
    origins: ["https://api.openai.com"],
  },
  google: {
    group: "provider",
    name: "Google",
    providerType: "google",
    origins: ["https://generativelanguage.googleapis.com"],
  },
  garmin: {
    group: "platform",
    name: "Garmin Connect",
    extension: "garmin-bridge",
  },
  trainingpeaks: {
    group: "platform",
    name: "TrainingPeaks",
    extension: "trainingpeaks-bridge",
  },
  train2go: {
    group: "platform",
    name: "Train2Go",
    extension: "train2go-bridge",
  },
  tanita: { group: "platform", name: "Tanita", extension: "tanita-bridge" },
  whoop: { group: "platform", name: "WHOOP", extension: "whoop-bridge" },
  intervals: {
    group: "service",
    name: "intervals.icu",
    origins: ["https://intervals.icu"],
  },
  drive: {
    group: "service",
    name: "Google Drive",
    origins: ["https://www.googleapis.com", "https://accounts.google.com"],
  },
  umami: {
    group: "analytics",
    name: "Umami",
    origins: ["https://cloud.umami.is", "https://gateway.umami.is"],
  },
} as const satisfies Record<string, Destination>;

export type DestinationId = keyof typeof DESTINATIONS;

export const DESTINATION_IDS = Object.keys(DESTINATIONS) as DestinationId[];

export const PROVIDER_DESTINATION: Record<LlmProviderType, DestinationId> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
};
