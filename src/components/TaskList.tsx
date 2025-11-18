import type { SelectTask } from '@/database/schema.tasks';
import { TASK_STATUS } from '@/database/schema.tasks';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Array<
    SelectTask & {
      assignee?: { id: number; name: string | null } | null;
      project?: { id: string; title: string; slug: string } | null;
    }
  >;
  groupBy?: 'status' | 'none';
  showProject?: boolean;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  groupBy = 'none',
  showProject = false,
  emptyMessage = 'No tasks found',
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-outline bg-surface p-8 text-center">
        <p className="text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  if (groupBy === 'status') {
    const statusGroups: Record<string, typeof tasks> = {
      [TASK_STATUS.TODO]: [],
      [TASK_STATUS.IN_PROGRESS]: [],
      [TASK_STATUS.DONE]: [],
    };

    tasks.forEach((task) => {
      if (statusGroups[task.status]) {
        statusGroups[task.status].push(task);
      }
    });

    const statusLabels = {
      [TASK_STATUS.TODO]: 'To Do',
      [TASK_STATUS.IN_PROGRESS]: 'In Progress',
      [TASK_STATUS.DONE]: 'Done',
    };

    return (
      <div className="space-y-6" data-testid="task-list">
        {Object.entries(statusGroups).map(([status, statusTasks]) => {
          if (statusTasks.length === 0) return null;

          return (
            <div key={status}>
              <h3 className="text-lg font-semibold text-on-surface mb-3">
                {statusLabels[status as keyof typeof statusLabels]} (
                {statusTasks.length})
              </h3>
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showProject={showProject}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="task-list">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} showProject={showProject} />
      ))}
    </div>
  );
}
