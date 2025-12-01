/**
 * ExampleWorkout Component
 *
 * Displays an example workout with steps.
 */

type ExampleWorkoutProps = {
  title: string;
  sport: string;
  description: string;
  steps: Array<string>;
};

export function ExampleWorkout({
  title,
  sport,
  description,
  steps,
}: ExampleWorkoutProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700 kiroween:border-gray-600 kiroween:bg-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
          {title}
        </h3>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          {sport}
        </span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {description}
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
