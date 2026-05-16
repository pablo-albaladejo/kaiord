import { Card } from "../atoms/Card/Card";

export function GettingStartedTips() {
  return (
    <Card className="p-6">
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        Getting Started
      </h3>
      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
        <li>• Create a new workout from scratch</li>
        <li>• Load an existing workout file</li>
        <li>• Add, edit, and organize workout steps</li>
      </ul>
    </Card>
  );
}
