import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { addProvider } from "../../../application/ai/add-provider";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { AiWorkoutInput } from "./AiWorkoutInput";

/**
 * `useAiProvidersLive` reads the real browser IndexedDB (Dexie) through
 * the module-level `aiProviderRepository` singleton — not a prop, and not
 * mockable without diverging from how the component actually works. Each
 * story seeds it via the real `addProvider` use case (the repository's own
 * write path, encryption included) in a Storybook `loader` that runs
 * before the story mounts.
 */
const seedOneProvider = async () => {
  await db.table("aiProviders").clear();
  await addProvider(createDexiePersistence(db), {
    type: "anthropic",
    apiKey: "sk-ant-demo-not-a-real-key",
    label: "Team Claude",
  });
};

const meta = {
  title: "Organisms/AiWorkoutInput",
  component: AiWorkoutInput,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      useAiRuntimeStore.setState({ generation: { status: "idle" } });
      return <Story />;
    },
  ],
  args: {
    onSettingsClick: fn(),
  },
} satisfies Meta<typeof AiWorkoutInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No AI provider configured — the real, empty state of a fresh browser profile. */
export const NoProviderConfigured: Story = {
  loaders: [
    async () => {
      await db.table("aiProviders").clear();
      return {};
    },
  ],
};

/** A provider is configured; the prompt is empty so Generate stays disabled. */
export const ReadyToGenerate: Story = {
  loaders: [
    async () => {
      await seedOneProvider();
      return {};
    },
  ],
};

/** A generation request is in flight — the textarea and Generate button both disable. */
export const GenerationInProgress: Story = {
  loaders: [
    async () => {
      await seedOneProvider();
      return {};
    },
  ],
  decorators: [
    (Story) => {
      useAiRuntimeStore.setState({ generation: { status: "loading" } });
      return <Story />;
    },
  ],
};

/** The provider rejected the last request — the runtime-store error renders inline. */
export const GenerationFailed: Story = {
  loaders: [
    async () => {
      await seedOneProvider();
      return {};
    },
  ],
  decorators: [
    (Story) => {
      useAiRuntimeStore.setState({
        generation: {
          status: "error",
          message: "Anthropic rejected the request: invalid API key.",
        },
      });
      return <Story />;
    },
  ],
};
