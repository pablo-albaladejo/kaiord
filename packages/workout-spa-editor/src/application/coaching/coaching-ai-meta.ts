import type { AiMeta } from "../../types/calendar-fragments";

/** Only the fields a Workout keeps of the AI run that built it. */
export const pickAiMeta = ({
  provider,
  model,
  promptVersion,
  processedAt,
}: AiMeta): AiMeta => ({ provider, model, promptVersion, processedAt });
