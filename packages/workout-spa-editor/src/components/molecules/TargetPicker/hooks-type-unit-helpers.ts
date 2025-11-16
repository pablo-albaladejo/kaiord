export function getDefaultUnit(
  type: "power" | "heart_rate" | "pace" | "cadence" | "open"
): string {
  if (type === "power") return "watts";
  if (type === "heart_rate") return "bpm";
  if (type === "pace") return "mps";
  if (type === "cadence") return "rpm";
  return "";
}

export function resetFieldValues(
  setValue: (value: string) => void,
  setMinValue: (value: string) => void,
  setMaxValue: (value: string) => void
) {
  setValue("");
  setMinValue("");
  setMaxValue("");
}
