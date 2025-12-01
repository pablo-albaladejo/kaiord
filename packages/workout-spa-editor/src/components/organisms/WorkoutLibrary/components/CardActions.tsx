/**
 * Card Actions Component
 *
 * Displays preview and load buttons
 */

import { Eye, Play } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";

type CardActionsProps = {
  onPreview: () => void;
  onLoad: () => void;
};

export function CardActions({ onPreview, onLoad }: CardActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onPreview}
        variant="secondary"
        className="flex-1"
        size="sm"
      >
        <Eye className="mr-2 h-4 w-4" />
        Preview
      </Button>
      <Button onClick={onLoad} className="flex-1" size="sm">
        <Play className="mr-2 h-4 w-4" />
        Load
      </Button>
    </div>
  );
}
