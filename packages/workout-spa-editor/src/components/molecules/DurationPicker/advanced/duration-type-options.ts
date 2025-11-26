/**
 * Duration Type Options
 *
 * Configuration for advanced duration types.
 */

export type AdvancedDurationType =
  | "calories"
  | "power_less_than"
  | "power_greater_than"
  | "heart_rate_less_than"
  | "repeat_until_time"
  | "repeat_until_distance"
  | "repeat_until_calories"
  | "repeat_until_heart_rate_greater_than"
  | "repeat_until_heart_rate_less_than"
  | "repeat_until_power_less_than"
  | "repeat_until_power_greater_than";

export const DURATION_TYPE_OPTIONS: Array<{
  value: AdvancedDurationType;
  label: string;
}> = [
  { value: "calories", label: "Calories" },
  { value: "power_less_than", label: "Power Less Than" },
  { value: "power_greater_than", label: "Power Greater Than" },
  { value: "heart_rate_less_than", label: "Heart Rate Less Than" },
  { value: "repeat_until_time", label: "Repeat Until Time" },
  { value: "repeat_until_distance", label: "Repeat Until Distance" },
  { value: "repeat_until_calories", label: "Repeat Until Calories" },
  {
    value: "repeat_until_heart_rate_greater_than",
    label: "Repeat Until HR Greater Than",
  },
  {
    value: "repeat_until_heart_rate_less_than",
    label: "Repeat Until HR Less Than",
  },
  {
    value: "repeat_until_power_less_than",
    label: "Repeat Until Power Less Than",
  },
  {
    value: "repeat_until_power_greater_than",
    label: "Repeat Until Power Greater Than",
  },
];
