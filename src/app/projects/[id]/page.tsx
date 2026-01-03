import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PriorityIndicator } from '@/components/PriorityIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskList } from '@/components/TaskList';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  ProjectPriority,
  ProjectStatus,
} from '@/database/schema.projects';
import { TASK_STATUS } from '@/database/schema.tasks';
import { getProjects, getProjectWithTags } from '@/models/projects';
import { getTasks } from '@/models/tasks';
import { authRedirect } from '../../auth';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  await authRedirect();
  const { id } = await params;

  // Try to get project by ID first, if not found try by slug
  let projects = await getProjects({ ids: [id] });
  if (projects.length === 0) {
    projects = await getProjects({ slugs: [id] });
  }

  if (projects.length === 0) {
    notFound();
  }

  const project = projects[0];

  // Get project with tags
  const projectWithTags = await getProjectWithTags(project.id);

  // Get project tasks
  const tasks = await getTasks({ projectIds: [project.id] });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/projects"
              className="text-on-surface-variant hover:text-on-surface"
            >
              ← Projects
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-on-background mb-3">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-on-surface-variant text-lg max-w-3xl">
                  {project.description}
                </p>
              )}
            </div>
            <ButtonLink
              href={`/projects/${project.slug}/edit`}
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              Edit Project
            </ButtonLink>
          </div>
        </div>

        {/* Status, Priority, and Tags */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <StatusBadge status={project.status as ProjectStatus} />
          <PriorityIndicator priority={project.priority as ProjectPriority} />
          {projectWithTags?.tags && projectWithTags.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {projectWithTags.tags.map((projectTag) => (
                <span
                  key={projectTag.tag.id}
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${projectTag.tag.color}30`,
                    color: projectTag.tag.color,
                  }}
                >
                  {projectTag.tag.name}
                </span>
              ))}
            </div>
          )}
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-on-background">Tasks</h2>
            <ButtonLink
              href={`/tasks/new?projectId=${project.id}`}
              variant="primary"
              className="px-4 py-2 text-sm"
            >
              Create Task
            </ButtonLink>
          </div>
          <TaskList tasks={tasks} groupBy="status" />
        </div>

        {/* Metadata */}
        <div className="mt-8 pt-8 border-t border-outline">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-on-surface-variant">Created</dt>
              <dd className="text-on-surface font-medium">
                {new Date(project.createdAt).toLocaleDateString()} at{' '}
                {new Date(project.createdAt).toLocaleTimeString()}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Last Updated</dt>
              <dd className="text-on-surface font-medium">
                {new Date(project.updatedAt).toLocaleDateString()} at{' '}
                {new Date(project.updatedAt).toLocaleTimeString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
