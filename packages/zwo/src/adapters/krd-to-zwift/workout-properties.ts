type ZwiftExtensions = Record<string, unknown>;

export const addWorkoutProperties = (
  workoutFile: Record<string, unknown>,
  workoutName: string | undefined,
  zwiftExtensions: ZwiftExtensions
): void => {
  if (zwiftExtensions.author) {
    workoutFile.author = zwiftExtensions.author;
  }
  if (workoutName) {
    workoutFile.name = workoutName;
  }
  if (zwiftExtensions.description) {
    workoutFile.description = zwiftExtensions.description;
  }
  if (zwiftExtensions.thresholdSecPerKm !== undefined) {
    workoutFile.thresholdSecPerKm = zwiftExtensions.thresholdSecPerKm;
  }

  const tags = zwiftExtensions.tags as Array<string> | undefined;
  if (tags && tags.length > 0) {
    workoutFile.tags = {
      tag: tags.map((name) => ({ "@_name": name })).filter((t) => t["@_name"]),
    };
  }
};

export const mapSportType = (sport?: string): string => {
  return sport === "cycling" ? "bike" : sport === "running" ? "run" : "bike";
};
