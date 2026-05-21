const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const getDayLabel = (date: string): { name: string; num: number } => {
  const d = new Date(date + "T12:00:00Z");
  return {
    name: DAY_NAMES[(d.getUTCDay() + 6) % 7] ?? "",
    num: d.getUTCDate(),
  };
};
