import { Library } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";

type LibraryButtonProps = {
  libraryCount: number;
  onLibraryClick: () => void;
};

export const LibraryButton = ({
  libraryCount,
  onLibraryClick,
}: LibraryButtonProps) => (
  <Button
    variant="tertiary"
    size="sm"
    onClick={onLibraryClick}
    aria-label="Open workout library"
    className="relative"
  >
    <Library className="h-4 w-4" />
    <span className="hidden sm:inline">Library</span>
    {libraryCount > 0 && (
      <span
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white"
        aria-label={`${libraryCount} workouts in library`}
      >
        {libraryCount}
      </span>
    )}
  </Button>
);
