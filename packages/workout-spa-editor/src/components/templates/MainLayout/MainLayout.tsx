import type { ReactNode } from "react";
<<<<<<< HEAD
import { LayoutHeader } from "./LayoutHeader";
=======
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
<<<<<<< HEAD
      <LayoutHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
=======
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Workout Editor
            </h1>
          </div>

          {/* Navigation - placeholder for future features */}
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            {/* Future: Add navigation items here */}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer - optional, can be added later */}
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
    </div>
  );
};
