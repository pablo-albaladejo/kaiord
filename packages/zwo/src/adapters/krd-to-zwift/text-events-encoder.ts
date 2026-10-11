import type { WorkoutStep } from "@kaiord/core";

type TextEvent = Record<string, unknown>;

const textEventsOf = (step: WorkoutStep): Array<TextEvent> => {
  const stepExtensions = step.extensions?.zwift as
    Record<string, unknown> | undefined;
  return (stepExtensions?.textEvents as Array<TextEvent> | undefined) ?? [];
};

const encodeEvent = (event: TextEvent, shift = 0): TextEvent => {
  const encoded: TextEvent = { "@_message": event.message };
  if (event.timeoffset !== undefined) {
    encoded["@_timeoffset"] = (event.timeoffset as number) + shift;
  }
  if (event.distoffset !== undefined) {
    encoded["@_distoffset"] = (event.distoffset as number) + shift;
  }
  return encoded;
};

export const encodeTextEvents = (
  step: WorkoutStep
): Array<TextEvent> | TextEvent | undefined => {
  const textEvents = textEventsOf(step);
  if (textEvents.length === 0) return undefined;
  if (textEvents.length === 1) return encodeEvent(textEvents[0]!);
  return textEvents.map((event) => encodeEvent(event));
};

// One IntervalsT element holds the events of both steps. Off-step events are
// timed from the start of the pair (shifted by OnDuration) so native Zwift
// shows them after the on-step; kaiord:textEventSplit counts the on-step
// events so the reader can hand each event back to its own step.
export const encodeIntervalsTTextEvents = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  intervalsT: Record<string, unknown>
): void => {
  const onEvents = textEventsOf(onStep);
  const offEvents = textEventsOf(offStep);
  if (onEvents.length + offEvents.length === 0) return;

  const onDuration = intervalsT["@_OnDuration"] as number;
  const encoded = [
    ...onEvents.map((event) => encodeEvent(event)),
    ...offEvents.map((event) => encodeEvent(event, onDuration)),
  ];
  intervalsT.textevent = encoded.length === 1 ? encoded[0] : encoded;
  if (offEvents.length > 0) {
    intervalsT["@_kaiord:textEventSplit"] = onEvents.length;
  }
};
