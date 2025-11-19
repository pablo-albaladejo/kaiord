import { useEffect, useState } from "react";

export function useConversionTimeEstimate(
  isLoading: boolean,
  progress: number
): string | null {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
    } else if (!isLoading) {
      setStartTime(null);
      setEstimate(null);
    }
  }, [isLoading, startTime]);

  useEffect(() => {
    if (!isLoading || !startTime || progress <= 0 || progress >= 100) {
      return;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    const rate = progress / elapsed;
    const remaining = (100 - progress) / rate;

    if (remaining < 1) {
      setEstimate("Less than 1 second");
    } else if (remaining < 60) {
      setEstimate(`About ${Math.ceil(remaining)} seconds`);
    } else {
      const minutes = Math.ceil(remaining / 60);
      setEstimate(`About ${minutes} minute${minutes > 1 ? "s" : ""}`);
    }
  }, [isLoading, startTime, progress]);

  return estimate;
}

