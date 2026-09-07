import type { Meta, StoryObj } from "@storybook/react";
import { forwardRef } from "react";
import { fireEvent, within } from "storybook/test";

import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { EditorContextMenu } from "./EditorContextMenu";

/**
 * `EditorContextMenu` renders only `children` — no context menu at all —
 * unless `useEditorContextMenu` reports at least one enabled action, and
 * that hook reads exclusively from the `useWorkoutStore` zustand singleton
 * (never React Context). Every non-suppressed story below seeds the real
 * store with `loadWorkout` and a matching `selectedStepId`/`selectedStepIds`
 * before rendering, then a `play` function fires a real `contextmenu` DOM
 * event (Radix's `ContextMenu.Trigger` opens on that native event) so the
 * Portal content is actually visible in the canvas.
 *
 * The component's own dependencies were traced end to end
 * (`useEditorContextMenu` -> `useEditorCommands` -> `useContextMenuStore`
 * -> per-domain zustand selectors, plus `useTranslate` for copy) and none
 * of them read a React Context that the global provider stack does not
 * already supply (`useTranslate` needs `LocaleProvider`, which is global).
 */
const meta = {
  title: "Organisms/EditorContextMenu",
  component: EditorContextMenu,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  // `children` is required, and every story below supplies its subject through
  // `render` instead of args. Declaring the default here is what lets those
  // stories omit `args` without the meta demanding it back.
  args: { children: null },
} satisfies Meta<typeof EditorContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const warmupStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 150 } },
  intensity: "warmup",
  name: "Warmup",
};

const intervalStep: WorkoutStep = {
  stepIndex: 1,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 260 } },
  intensity: "active",
  name: "Threshold Interval",
};

const recoveryStep: WorkoutStep = {
  stepIndex: 2,
  durationType: "time",
  duration: { type: "time", seconds: 120 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 100 } },
  intensity: "rest",
  name: "Recovery",
};

const cooldownStep: WorkoutStep = {
  stepIndex: 3,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  intensity: "cooldown",
  name: "Cooldown",
};

const workoutWithBlock: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-01T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Threshold Set",
      sport: "cycling",
      steps: [
        warmupStep,
        {
          repeatCount: 3,
          steps: [intervalStep, recoveryStep],
        } as RepetitionBlock,
        cooldownStep,
      ],
    },
  },
};

const emptyWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-01T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Blank Session", sport: "cycling", steps: [] },
  },
};

type StoreItem = { id: string; stepIndex?: number; repeatCount?: number };

function topLevelItems(): Array<StoreItem> {
  // `extensions` is an open record, so `structured_workout` arrives as `{}`
  // and needs narrowing before `steps` is reachable.
  const structured = useWorkoutStore.getState().currentWorkout?.extensions
    ?.structured_workout as { steps?: Array<StoreItem> } | undefined;
  return structured?.steps ?? [];
}

/** Reads the live selection back from the store, so the `data-step-id` the
 * Radix trigger relies on always matches whatever a story's decorator just
 * seeded — never a value captured before the store was reset. Forwards its
 * ref: `ContextMenu.Trigger asChild` clones this element and needs a real
 * DOM ref to attach to. */
const ContextMenuTarget = forwardRef<HTMLDivElement, { label: string }>(
  ({ label }, ref) => {
    const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
    const selectedStepIds = useWorkoutStore((s) => s.selectedStepIds);
    const targetId = selectedStepId ?? selectedStepIds[0];

    return (
      <div
        ref={ref}
        data-testid="context-menu-trigger"
        data-step-id={targetId}
        className="rounded-lg border border-dashed border-edge p-10 text-center text-sm text-ink-muted"
      >
        {label}
      </div>
    );
  }
);
ContextMenuTarget.displayName = "ContextMenuTarget";

const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const trigger = await canvas.findByTestId("context-menu-trigger");
  fireEvent.contextMenu(trigger, { clientX: 40, clientY: 40 });
};

export const TopLevelStepSelected: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(workoutWithBlock);
      const step = topLevelItems().find((item) => "stepIndex" in item);
      useWorkoutStore.setState({
        selectedStepId: step?.id ?? null,
        selectedStepIds: [],
      });
      return <Story />;
    },
  ],
  render: () => (
    <EditorContextMenu>
      <ContextMenuTarget label='Right-click "Warmup" — offers Cut/Copy/Delete/Select All' />
    </EditorContextMenu>
  ),
  play: openMenu,
};

export const RepetitionBlockSelected: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(workoutWithBlock);
      const block = topLevelItems().find((item) => "repeatCount" in item);
      useWorkoutStore.setState({
        selectedStepId: block?.id ?? null,
        selectedStepIds: [],
      });
      return <Story />;
    },
  ],
  render: () => (
    <EditorContextMenu>
      <ContextMenuTarget label="Right-click the 3x block — offers Ungroup (not Cut/Copy)" />
    </EditorContextMenu>
  ),
  play: openMenu,
};

export const MultiStepSelection: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(workoutWithBlock);
      const steps = topLevelItems().filter((item) => "stepIndex" in item);
      useWorkoutStore.setState({
        selectedStepId: null,
        selectedStepIds: steps.map((s) => s.id),
      });
      return <Story />;
    },
  ],
  render: () => (
    <EditorContextMenu>
      <ContextMenuTarget label="Right-click with 2 steps selected — offers Group and Delete" />
    </EditorContextMenu>
  ),
  play: openMenu,
};

/** No selection and an empty workout: `hasAnyAction` is false, so the
 * component renders only its children — no `ContextMenu.Root` is even
 * mounted, and a right-click opens nothing. */
export const NoActionsAvailable: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(emptyWorkout);
      useWorkoutStore.setState({ selectedStepId: null, selectedStepIds: [] });
      return <Story />;
    },
  ],
  render: () => (
    <EditorContextMenu>
      <ContextMenuTarget label="Right-click here — menu is suppressed, nothing opens" />
    </EditorContextMenu>
  ),
};
