/**
 * ZoneTable Types
 *
 * Shared types for zone table components.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

export type ZoneRowData = HeartRateZone | PowerZone | PaceZone;

export type ZoneTableCallbacks = {
  onNameChange: (index: number, name: string) => void;
  onMinChange: (index: number, raw: string) => void;
  onMaxChange: (index: number, raw: string) => void;
  onRemove: (index: number) => void;
};
