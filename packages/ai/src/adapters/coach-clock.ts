/**
 * A clock as a coach writes it — `4:30`, `1:05:00`, `4'30"`, `4’30”` — in
 * seconds. Seconds (and minutes under an hour) must be below 60; anything else
 * is refused with a message the retry loop hands back to the model.
 */

const CLOCK =
  /^(?:(\d+):)?(\d+)\s*[:'’]\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|''|”|’’)?$/;
const SIXTY = 60;
const HOUR = 3600;

export const clockSeconds = (text: string): number => {
  const match = CLOCK.exec(text.trim());
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2]);
  const seconds = Number(match?.[3]);
  const nested = match?.[1] !== undefined && minutes >= SIXTY;
  if (
    !match ||
    seconds >= SIXTY ||
    nested ||
    hours * HOUR + minutes * SIXTY + seconds <= 0
  ) {
    throw new Error(
      `"${text}" is not a clock: write it as m:ss or h:mm:ss, exactly as the coach wrote it`
    );
  }
  return hours * HOUR + minutes * SIXTY + seconds;
};
