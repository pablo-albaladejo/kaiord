/**
 * ExamplesSection Component
 *
 * Example workouts showcase.
 */

import { FileText } from "lucide-react";
import { ExampleWorkout } from "../components/ExampleWorkout";

export function ExamplesSection() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
          Example Workouts
        </h2>
      </div>

      <div className="space-y-4">
        <ExampleWorkout
          title="Sweet Spot Intervals"
          sport="Cycling"
          description="Classic sweet spot training with 3x10 minute intervals at 88-93% FTP"
          steps={[
            "10 min warmup at 50-60% FTP",
            "3x (10 min at 88-93% FTP, 5 min recovery at 50% FTP)",
            "10 min cooldown at 50% FTP",
          ]}
        />

        <ExampleWorkout
          title="Tempo Run"
          sport="Running"
          description="Sustained tempo effort to build aerobic endurance"
          steps={[
            "15 min easy warmup",
            "20 min at tempo pace (Zone 3-4)",
            "10 min easy cooldown",
          ]}
        />

        <ExampleWorkout
          title="Swim Intervals"
          sport="Swimming"
          description="High-intensity intervals with active recovery"
          steps={[
            "400m easy warmup",
            "8x (100m hard, 50m easy)",
            "200m cooldown",
          ]}
        />
      </div>
    </div>
  );
}
