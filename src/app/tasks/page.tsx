import { authRedirect } from '../auth';
import { User } from '@/models/user';
import { getTasks } from '@/models/tasks';
import {
  TASK_STATUS,
  type TaskStatus,
  type TaskPriority,
} from '@/database/schema.tasks';
import { TaskList } from '@/components/TaskList';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface TasksPageProps {
  searchParams: Promise<{ status?: string; priority?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await authRedirect();
  const userId = session.user.id;
  const params = await searchParams;

  // Get user's teams
  const userTeams = await User.getUserTeams(userId);
  const teamIds = userTeams.map((t) => t.team.id);

  // Apply filters
  const status = params.status ? [params.status as TaskStatus] : undefined;
  const priority = params.priority
    ? [params.priority as TaskPriority]
    : undefined;

  // Get tasks assigned to user
  const tasks = await getTasks({ assigneeIds: [userId], status, priority });

  // Sort by due date (overdue first), then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // Overdue tasks first
    const aOverdue =
      a.dueDate &&
      new Date(a.dueDate) < new Date() &&
      a.status !== TASK_STATUS.DONE;
    const bOverdue =
      b.dueDate &&
      new Date(b.dueDate) < new Date() &&
      b.status !== TASK_STATUS.DONE;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Then by priority
    const priorityOrder: Record<TaskPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    return (
      priorityOrder[a.priority as TaskPriority] -
      priorityOrder[b.priority as TaskPriority]
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-background">Your Tasks</h1>
          <p className="mt-2 text-on-surface-variant">
            Manage tasks assigned to you across all projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Total Tasks
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {tasks.length}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                To Do
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {tasks.filter((t) => t.status === TASK_STATUS.TODO).length}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                In Progress
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {
                  tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS)
                    .length
                }
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Completed
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {tasks.filter((t) => t.status === TASK_STATUS.DONE).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        {sortedTasks.length === 0 ? (
          <Card padded={false} className="p-12 text-center">
            <CardContent className="p-0">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-on-surface mb-2">
                  No tasks assigned
                </h3>
                <p className="text-on-surface-variant mb-6">
                  {teamIds.length === 0
                    ? 'Join a team and work on projects to get started.'
                    : 'Tasks will appear here when they are assigned to you.'}
                </p>
                {teamIds.length > 0 && (
                  <ButtonLink
                    href="/projects"
                    variant="primary"
                    className="px-6 py-3 text-base"
                  >
                    View Projects
                  </ButtonLink>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <TaskList tasks={sortedTasks} groupBy="status" />
        )}
      </div>
    </div>
  );
}
