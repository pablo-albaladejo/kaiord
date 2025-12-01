/**
 * HeaderLogo Component
 *
 * Logo and title for the header.
 */

export function HeaderLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white kiroween:text-white sm:text-2xl">
        Workout Editor
      </h1>
    </div>
  );
}
