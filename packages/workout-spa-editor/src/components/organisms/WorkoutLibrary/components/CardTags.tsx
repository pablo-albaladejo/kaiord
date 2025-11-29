/**
 * Card Tags Component
 *
 * Displays workout tags with overflow indicator
 */

import { Badge } from "../../../atoms/Badge/Badge";

type CardTagsProps = {
  tags: string[];
};

export function CardTags({ tags }: CardTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="default" className="text-xs">
          {tag}
        </Badge>
      ))}
      {tags.length > 3 && (
        <Badge variant="default" className="text-xs">
          +{tags.length - 3}
        </Badge>
      )}
    </div>
  );
}
