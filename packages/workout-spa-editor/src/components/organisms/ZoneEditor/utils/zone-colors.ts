/**
 * Zone color utilities
 *
 * Color mapping for zone visualization.
 */

export function getZoneColor(zoneNumber: number): string {
  const colors = [
    "bg-blue-100 dark:bg-blue-900/30",
    "bg-green-100 dark:bg-green-900/30",
    "bg-yellow-100 dark:bg-yellow-900/30",
    "bg-orange-100 dark:bg-orange-900/30",
    "bg-red-100 dark:bg-red-900/30",
    "bg-purple-100 dark:bg-purple-900/30",
    "bg-pink-100 dark:bg-pink-900/30",
  ];
  return colors[(zoneNumber - 1) % colors.length];
}
