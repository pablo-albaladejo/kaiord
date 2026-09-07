import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";

import { type PushState, useGarminBridge } from "../../../contexts";
import { GarminPushButton } from "./GarminPushButton";

const meta = {
  title: "Molecules/GarminPushButton",
  component: GarminPushButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The editor's single **Send** control. It no longer decides watch reachability itself — `useGarminGate` (`no-extension` / `export-disabled` / `no-session` / `ready`) owns that upstream, and `EditorStateRibbon` only mounts this button once the gate is `ready`. So those four gates never render *inside* this component; the states below are the ones this component itself owns: the send button plus its push-feedback outcome. Under Storybook there is no seeded Dexie database and no `:id` route param, so the workout this button would push always resolves to `undefined` — a real state the component must (and does) tolerate, not a story-harness workaround.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GarminPushButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const LOADING_STATE: PushState = { status: "loading" };
const SUCCESS_STATE: PushState = { status: "success" };
const ERROR_STATE: PushState = {
  status: "error",
  message: "Push failed: 403",
};

/**
 * Forces the shared GarminBridge context (wired globally in
 * `.storybook/preview.tsx`) into a given push state before rendering, so
 * each story can show one send-feedback outcome without mocking modules —
 * `state` is a stable module-level reference, so the effect fires once.
 */
function WithPushState({ state }: { state: PushState }) {
  const { setPushing } = useGarminBridge();
  useEffect(() => {
    setPushing(state);
  }, [state, setPushing]);
  return <GarminPushButton />;
}

export const Idle: Story = {
  name: "Idle (no workout persisted yet)",
  render: () => <GarminPushButton />,
};

export const Sending: Story = {
  name: "Sending (button disabled mid-push)",
  render: () => <WithPushState state={LOADING_STATE} />,
};

export const Sent: Story = {
  name: "Sent (feedback names the outcome, not a colour)",
  render: () => <WithPushState state={SUCCESS_STATE} />,
};

export const Failed: Story = {
  name: 'Failed (the cause is shown, not just "error")',
  render: () => <WithPushState state={ERROR_STATE} />,
};
