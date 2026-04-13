/**
 * HeaderLogo Component
 *
 * Kaiord logo and title for the header.
 * Uses wouter Link for SPA navigation (no full page reload).
 */

import { Link } from "wouter";

export function HeaderLogo() {
  return (
    <Link href="/calendar" className="flex items-center gap-3 no-underline">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
        <svg
          className="h-6 w-6"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <g transform="translate(2,2) scale(0.9)">
            <path
              d="M20 0L37.32 10L37.32 30L20 40L2.68 30L2.68 10Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="20" cy="20" r="5" fill="currentColor" />
          </g>
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        Kaiord Editor
      </h1>
    </Link>
  );
}
