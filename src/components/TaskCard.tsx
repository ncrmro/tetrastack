import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type SelectTask,
  TASK_STATUS,
  type TaskPriority,
  type TaskStatus,
} from '@/database/schema.tasks'
import { PriorityIndicator } from './PriorityIndicator'
import { StatusBadge } from './StatusBadge'

interface TaskCardProps {
  task: SelectTask & {
    assignee?: { id: number; name: string | null } | null
    project?: { id: string; title: string; slug: string } | null
  }
  showProject?: boolean
  className?: string
}

export function TaskCard({
  task,
  showProject = false,
  className = '',
}: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TASK_STATUS.DONE

  return (
    <Link
      href={`/tasks/${task.id}`}
      data-testid="task-card"
      className={`block ${className}`}
    >
      <Card
        padded={false}
        rounded="lg"
        className="p-4 transition-colors hover:bg-surface-variant/50"
      >
        <CardHeader className="mb-3 p-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle as="h4" className="font-medium truncate">
                {task.title}
              </CardTitle>
              {task.description && (
                <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <PriorityIndicator
              priority={task.priority as TaskPriority}
              showLabel={false}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status as TaskStatus} />

            {task.assignee && (
              <span className="text-xs text-on-surface-variant">
                {task.assignee.name || `User #${task.assignee.id}`}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`text-xs ${isOverdue ? 'text-error font-medium' : 'text-on-surface-variant'}`}
              >
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {showProject && task.project && (
            <div className="mt-2 text-xs text-on-surface-variant">
              Project: {task.project.title}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
