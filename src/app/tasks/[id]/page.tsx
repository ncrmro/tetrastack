import { authRedirect } from '../../auth';
import { getTasks, getTaskWithComments } from '@/models/tasks';
import { getProjects } from '@/models/projects';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityIndicator } from '@/components/PriorityIndicator';
import { CommentThread } from '@/components/CommentThread';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  TASK_STATUS,
  type TaskStatus,
  type TaskPriority,
} from '@/database/schema.tasks';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const session = await authRedirect();
  const userId = session.user.id;
  const { id } = await params;

  // Get task details
  const tasks = await getTasks({ ids: [id] });
  if (tasks.length === 0) {
    notFound();
  }
  const task = tasks[0];

  // Get task with comments
  const taskWithComments = await getTaskWithComments(task.id);

  // Get project details
  const projects = await getProjects({ ids: [task.projectId] });
  const project = projects[0];

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TASK_STATUS.DONE;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/tasks"
              className="text-on-surface-variant hover:text-on-surface"
            >
              ← Your Tasks
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-on-background mb-3">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-on-surface-variant text-lg max-w-3xl whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Card padded={false} className="mb-8 p-6">
          <CardContent className="p-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-2">
                  Status
                </div>
                <StatusBadge status={task.status as TaskStatus} />
              </div>
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-2">
                  Priority
                </div>
                <PriorityIndicator priority={task.priority as TaskPriority} />
              </div>
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-2">
                  Project
                </div>
                {project && (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {project.title}
                  </Link>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-2">
                  Due Date
                </div>
                {task.dueDate ? (
                  <div
                    className={
                      isOverdue ? 'text-error font-medium' : 'text-on-surface'
                    }
                  >
                    {new Date(task.dueDate).toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </div>
                ) : (
                  <div className="text-on-surface-variant">Not set</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-outline grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-1">
                  Created
                </div>
                <div className="text-sm text-on-surface">
                  {new Date(task.createdAt).toLocaleDateString()} at{' '}
                  {new Date(task.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-on-surface-variant mb-1">
                  Last Updated
                </div>
                <div className="text-sm text-on-surface">
                  {new Date(task.updatedAt).toLocaleDateString()} at{' '}
                  {new Date(task.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div>
          <h2 className="text-2xl font-bold text-on-background mb-4">
            Comments{' '}
            {taskWithComments?.comments &&
              `(${taskWithComments.comments.length})`}
          </h2>
          <CommentThread
            taskId={task.id}
            comments={taskWithComments?.comments || []}
            currentUserId={userId}
          />
        </div>
      </div>
    </div>
  );
}
