/**
 * /health — Hub landing page.
 *
 * MVP: shows the active profile + a card grid linking to each
 * metric-specific page (Sleep, Weight, Recovery, Activity). When
 * the per-metric live data lands we surface the most-recent values
 * inline on each card.
 */
import { Link } from "wouter";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { HealthPageHeader } from "./HealthPageHeader";

const CARDS: ReadonlyArray<{ to: string; label: string; description: string }> =
  [
    {
      to: "/health/sleep",
      label: "Sleep",
      description: "Stages, duration, score across the week.",
    },
    {
      to: "/health/weight",
      label: "Weight",
      description: "Weight history with optional body composition.",
    },
    {
      to: "/health/recovery",
      label: "Recovery",
      description: "HRV trend + stress episodes.",
    },
    {
      to: "/health/activity",
      label: "Activity",
      description: "Daily steps, calories, intensity minutes.",
    },
  ];

const cardClass =
  "block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800";

export default function HealthDashboardPage() {
  const active = useActiveProfileLive();
  const profileLabel = active?.profile?.name ?? "Active profile";
  return (
    <section data-testid="health-dashboard">
      <HealthPageHeader title="Health" subtitle={profileLabel} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <li key={card.to}>
            <Link href={card.to} className={cardClass}>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                {card.label}
              </span>
              <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">
                {card.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
