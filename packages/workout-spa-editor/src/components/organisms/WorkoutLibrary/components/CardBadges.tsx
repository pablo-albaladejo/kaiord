/**
 * Card Badges Component
 *
 * Displays badges for sport, difficulty, and duration
 */

import { Badge } from "../../../atoms/Badge/Badge";
import { formatDuration, getDifficultyColor } from "../utils/card-helpers";

type CardBadgesProps = {
  sport: string;
  difficulty?: string;
  duration?: number;
};

export function CardBadges({ sport, difficulty, duration }: CardBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" className="text-xs">
        {sport}
      </Badge>
      {difficulty && (
        <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </Badge>
      )}
      {duration && (
        <Badge variant="default" className="text-xs">
          {formatDuration(duration)}
        </Badge>
      )}
    </div>
  );
}
