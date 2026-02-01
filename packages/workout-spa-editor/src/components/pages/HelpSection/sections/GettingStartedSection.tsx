/**
 * GettingStartedSection Component
 *
 * Getting started guide for the workout editor.
 */

import { BookOpen } from "lucide-react";

export function GettingStartedSection() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Getting Started
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Creating a Workout
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            <li>Click "Create New Workout" on the welcome screen</li>
            <li>
              Enter a workout name and select a sport (cycling, running,
              swimming)
            </li>
            <li>Add workout steps by clicking "Add Step"</li>
            <li>Configure duration (time, distance, or open) for each step</li>
            <li>Set target intensity (power, heart rate, pace, or cadence)</li>
            <li>Save your workout using Ctrl+S (Cmd+S on Mac)</li>
          </ol>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Loading a Workout
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            <li>Click "Load Workout" or drag and drop a file</li>
            <li>Supported formats: KRD, FIT, TCX, ZWO</li>
            <li>The workout will load and display all steps</li>
            <li>Edit any step by clicking on it</li>
          </ol>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Organizing Steps
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            <li>Drag and drop steps to reorder them</li>
            <li>Use Alt+Up/Down to move selected steps</li>
            <li>
              Group steps into repetition blocks with Ctrl+G (Cmd+G on Mac)
            </li>
            <li>Ungroup blocks with Ctrl+Shift+G (Cmd+Shift+G on Mac)</li>
            <li>Copy steps with Ctrl+C and paste with Ctrl+V</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
