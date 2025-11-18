import type { ProjectPriority } from '@/database/schema.projects';
import type { TaskPriority } from '@/database/schema.tasks';

type Priority = ProjectPriority | TaskPriority;

interface PriorityIndicatorProps {
  priority: Priority;
  className?: string;
  showLabel?: boolean;
}

const priorityConfig: Record<
  Priority,
  {
    label: string;
    icon: string;
    className: string;
  }
> = {
  low: {
    label: 'Low',
    icon: '▼',
    className: 'text-gray-500 dark:text-gray-400',
  },
  medium: {
    label: 'Medium',
    icon: '◆',
    className: 'text-secondary dark:text-secondary',
  },
  high: {
    label: 'High',
    icon: '▲',
    className: 'text-error dark:text-error',
  },
};

export function PriorityIndicator({
  priority,
  className = '',
  showLabel = true,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];

  if (!config) {
    return null;
  }

  return (
    <span
      data-testid="priority-indicator"
      className={`inline-flex items-center gap-1 text-sm font-medium ${config.className} ${className}`}
    >
      <span className="text-base" aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
