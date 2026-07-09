/**
 * Card Thumbnail Component
 *
 * Displays workout thumbnail image
 */

import { useTranslate } from "../../../../i18n/use-translate";

type CardThumbnailProps = {
  thumbnailData?: string;
  workoutName: string;
};

export function CardThumbnail({
  thumbnailData,
  workoutName,
}: CardThumbnailProps) {
  const t = useTranslate("library");
  if (!thumbnailData) return null;

  return (
    <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        src={thumbnailData}
        alt={t("card.thumbnailAlt", { name: workoutName })}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
