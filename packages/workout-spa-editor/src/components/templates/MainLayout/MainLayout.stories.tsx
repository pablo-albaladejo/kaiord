import type { Meta, StoryObj } from "@storybook/react";
import { MainLayout } from "./MainLayout";

const meta = {
  title: "Templates/MainLayout",
  component: MainLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Main application layout template with header, navigation, and content area. Provides consistent structure across all pages with mobile-first responsive design.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Workout Editor
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This is the main content area where your workout editor will be
          displayed.
        </p>
      </div>
    ),
  },
};

export const WithWorkoutList: Story = {
  args: {
    children: (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Workout
          </h2>
          <button className="btn-primary">Save Workout</button>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Step {step}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    5:00 @ Zone 2
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                    Edit
                  </button>
                  <button className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

export const EmptyState: Story = {
  args: {
    children: (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          No workout loaded
        </h2>
        <p className="max-w-sm text-gray-600 dark:text-gray-400">
          Create a new workout or load an existing one to get started.
        </p>
        <div className="flex gap-3">
          <button className="btn-primary">Create Workout</button>
          <button className="btn-secondary">Load Workout</button>
        </div>
      </div>
    ),
  },
};

export const MobileView: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Mobile Layout
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The layout automatically adapts to mobile screens with optimized
          spacing and touch targets.
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Step {step}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                3:00 @ 150W
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
