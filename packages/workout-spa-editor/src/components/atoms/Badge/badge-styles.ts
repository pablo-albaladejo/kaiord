import type { BadgeSize, BadgeVariant } from "./Badge";

export const variantClasses: Record<BadgeVariant, string> = {
  warmup:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  active:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
  cooldown:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
  rest: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
  recovery:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
  interval:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800",
  other:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
  power:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  heart_rate:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800",
  cadence:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
  pace: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800",
  stroke_type:
    "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800",
  open: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  default:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
};

export const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};
