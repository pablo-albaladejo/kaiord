import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

const meta = {
  title: "Atoms/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div className="p-8">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default theme toggle in light mode
 */
export const LightMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div className="p-8 bg-white dark:bg-gray-900">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/**
 * Theme toggle in dark mode
 */
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <div className="p-8 bg-white dark:bg-gray-900">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/**
 * Theme toggle with system preference
 */
export const SystemPreference: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="system">
        <div className="p-8 bg-white dark:bg-gray-900">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/**
 * Interactive example showing theme toggle in a header
 */
export const InHeader: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Workout Editor
          </h1>
          <nav className="flex items-center gap-2">
            <Story />
          </nav>
        </header>
      </ThemeProvider>
    ),
  ],
};
