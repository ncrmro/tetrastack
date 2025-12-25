import type { GraphCategory } from '../types';
import { categoryColors, categoryLabels } from '../types';

interface CategoryBadgeProps {
  category: GraphCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const colors = categoryColors[category];
  const label = categoryLabels[category];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
    >
      {label}
    </span>
  );
}
