/**
 * LibraryButton — header navigation entry to the routed Library page.
 *
 * Surface contract: per the SPA surface-classification rule the Library
 * is a routed page (`/library`), NOT a modal. This button navigates;
 * it does not open a dialog. A no-dual-mount mechanical guard enforces
 * that the WorkoutLibrary content component cannot be re-mounted as a
 * header modal in a future PR.
 */

import { Library } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "../../../atoms/Button/Button";

type LibraryButtonProps = {
  libraryCount: number;
};

export const LibraryButton = ({ libraryCount }: LibraryButtonProps) => {
  const [, navigate] = useLocation();
  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={() => navigate("/library")}
      aria-label="Open workout library"
      className="relative"
    >
      <Library className="h-4 w-4" />
      <span className="hidden sm:inline">Library</span>
      {libraryCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white"
          aria-label={`${libraryCount} ${libraryCount === 1 ? "workout" : "workouts"} in library`}
        >
          {libraryCount}
        </span>
      )}
    </Button>
  );
};
