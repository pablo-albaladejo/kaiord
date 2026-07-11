export type UmamiEventData = Record<string, string | number | boolean>;

export type UmamiPayloadModifier = (
  props: Record<string, unknown>
) => Record<string, unknown>;

export type UmamiTracker = {
  track: (name: string | UmamiPayloadModifier, data?: UmamiEventData) => void;
};
