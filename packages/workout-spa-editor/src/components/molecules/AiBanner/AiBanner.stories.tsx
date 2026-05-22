import type { Meta, StoryObj } from "@storybook/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { AiBanner } from "./AiBanner";

/**
 * AiBanner wraps `AiWorkoutInput` in a Radix Accordion that is closed
 * by default. Auto-collapse fires once on the first AI-generation
 * success (consumes the one-shot `armed` flag); subsequent toggles do
 * not auto-collapse. Shipped in PR #648.
 */
const meta = {
  title: "Molecules/AiBanner",
  component: AiBanner,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Collapsed-by-default accordion that wraps the AI workout generator. Auto-collapses once on the first AI success after the user opens it.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      // Reset to idle so every story starts from a known state.
      useAiRuntimeStore.setState({ generation: { status: "idle" } });
      const { hook } = memoryLocation({ path: "/workout/new" });
      return (
        <Router hook={hook}>
          <Story />
        </Router>
      );
    },
  ],
} satisfies Meta<typeof AiBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Closed state. Header chip visible; body is not mounted. The default
 * scratch entry experience.
 */
export const ClosedDefault: Story = {};

/**
 * Generation in progress. Same closed state at mount, but the runtime
 * store has been seeded so a click to expand would reveal the panel.
 */
export const GenerationPending: Story = {
  decorators: [
    (Story) => {
      useAiRuntimeStore.setState({ generation: { status: "idle" } });
      return <Story />;
    },
  ],
};

/**
 * Post-success. Demonstrates the runtime store after an AI generation
 * has reported success. The component itself stays closed until the
 * user opens it — auto-collapse only fires when the user has already
 * expanded the panel.
 */
export const AfterAiSuccess: Story = {
  decorators: [
    (Story) => {
      useAiRuntimeStore.setState({ generation: { status: "success" } });
      return <Story />;
    },
  ],
};
