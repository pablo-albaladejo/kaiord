/**
 * Position utilities for tutorial dialog
 */

type Position = "top" | "bottom" | "left" | "right" | "center";

export function getPositionClasses(position?: Position): string {
  if (!position || position === "center") {
    return "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]";
  }

  switch (position) {
    case "top":
      return "left-[50%] top-[10%] translate-x-[-50%]";
    case "bottom":
      return "left-[50%] bottom-[10%] translate-x-[-50%]";
    case "left":
      return "left-[10%] top-[50%] translate-y-[-50%]";
    case "right":
      return "right-[10%] top-[50%] translate-y-[-50%]";
    default:
      return "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]";
  }
}
