/**
 * Card Thumbnail Component
 *
 * Displays workout thumbnail image
 */

type CardThumbnailProps = {
  thumbnailData?: string;
  workoutName: string;
};

export function CardThumbnail({
  thumbnailData,
  workoutName,
}: CardThumbnailProps) {
  if (!thumbnailData) return null;

  return (
    <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        src={thumbnailData}
        alt={`${workoutName} preview`}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
