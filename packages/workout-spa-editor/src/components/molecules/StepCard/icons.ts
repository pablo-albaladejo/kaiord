import {
  Activity,
  Clock,
  Gauge,
  Heart,
  type LucideIcon,
  Repeat,
  Ruler,
  Zap,
} from "lucide-react";

/**
 * Get icon for target type
 */
export const getTargetIcon = (targetType: string): LucideIcon => {
  switch (targetType) {
    case "power":
      return Zap;
    case "heart_rate":
      return Heart;
    case "cadence":
      return Repeat;
    case "pace":
      return Activity;
    default:
      return Gauge;
  }
};

/**
 * Get icon for duration type
 */
export const getDurationIcon = (durationType: string): LucideIcon => {
  switch (durationType) {
    case "time":
      return Clock;
    case "distance":
      return Ruler;
    default:
      return Clock;
  }
};
