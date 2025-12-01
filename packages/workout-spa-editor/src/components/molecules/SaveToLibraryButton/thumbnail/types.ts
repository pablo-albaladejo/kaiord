/**
 * Thumbnail Types
 *
 * Type definitions for thumbnail generation.
 */

export type StepWithDuration = {
  duration: {
    type: string;
    seconds?: number;
  };
};

export type ThumbnailConfig = {
  width: number;
  height: number;
  padding: number;
};
