import { detectFormat } from "../../../utils/file-format-detector";

export function reportImported(
  filename: string,
  onImported?: (format: string) => void
) {
  if (!onImported) return;
  const detection = detectFormat(filename);
  if (detection.success) onImported(detection.format);
}
