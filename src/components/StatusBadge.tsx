import type { ProjectStatus } from '@/database/schema.projects'
import { PROJECT_STATUS } from '@/database/schema.projects'
import type { TaskStatus } from '@/database/schema.tasks'
import { TASK_STATUS } from '@/database/schema.tasks'

type Status = ProjectStatus | TaskStatus

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<
  Status,
  {
    label: string
    className: string
  }
> = {
  // Project statuses
  [PROJECT_STATUS.PLANNING]: {
    label: 'Planning',
    className: 'bg-secondary-container text-on-secondary-container',
  },
  [PROJECT_STATUS.ACTIVE]: {
    label: 'Active',
    className: 'bg-primary-container text-on-primary-container',
  },
  [PROJECT_STATUS.COMPLETED]: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  },
  [PROJECT_STATUS.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  // Task statuses
  [TASK_STATUS.TODO]: {
    label: 'To Do',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'bg-primary-container text-on-primary-container',
  },
  [TASK_STATUS.DONE]: {
    label: 'Done',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (!config) {
    return null
  }

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
