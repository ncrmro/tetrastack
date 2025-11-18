import { authRedirect } from '../auth';
import { User } from '@/models/user';
import { getProjects } from '@/models/projects';
import { getTasks } from '@/models/tasks';
import { ProjectCard } from '@/components/ProjectCard';
import { TaskCard } from '@/components/TaskCard';
import { TeamCard } from '@/components/TeamCard';
import { PROJECT_STATUS } from '@/database/schema.projects';
import { TASK_STATUS } from '@/database/schema.tasks';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await authRedirect();
  const userId = parseInt(session.user.id);

  // Get user's teams
  const userTeams = await User.getUserTeams(userId);
  const teamIds = userTeams.map((t) => t.team.id);

  // Get projects across all user teams (limit to recent 6)
  const allProjects = teamIds.length > 0 ? await getProjects({ teamIds }) : [];
  const recentProjects = allProjects
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6);

  // Get tasks assigned to user (limit to recent 8)
  const allTasks = await getTasks({ assigneeIds: [userId] });
  const recentTasks = allTasks
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 8);

  // Calculate stats
  const activeProjects = allProjects.filter(
    (p) => p.status === PROJECT_STATUS.ACTIVE,
  ).length;
  const pendingTasks = allTasks.filter(
    (t) => t.status === TASK_STATUS.TODO,
  ).length;
  const inProgressTasks = allTasks.filter(
    (t) => t.status === TASK_STATUS.IN_PROGRESS,
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-background">Dashboard</h1>
          <p className="mt-2 text-on-surface-variant">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Teams
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {userTeams.length}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Active Projects
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {activeProjects}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Pending Tasks
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {pendingTasks}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                In Progress
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {inProgressTasks}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Teams */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-on-background">
              Your Teams
            </h2>
            <Link
              href="/teams"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              View all →
            </Link>
          </div>
          {userTeams.length === 0 ? (
            <Card padded={false} className="p-8 text-center">
              <CardContent className="p-0">
                <p className="text-on-surface-variant mb-4">
                  You are not part of any teams yet.
                </p>
                <ButtonLink
                  href="/teams/new"
                  variant="primary"
                  className="px-4 py-2 text-sm"
                >
                  Create a Team
                </ButtonLink>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userTeams.map(({ team, role, joinedAt }) => (
                <TeamCard key={team.id} team={{ ...team, role, joinedAt }} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-on-background">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              View all →
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <Card padded={false} className="p-8 text-center">
              <CardContent className="p-0">
                <p className="text-on-surface-variant mb-4">No projects yet.</p>
                <div className="flex gap-4 justify-center">
                  <ButtonLink
                    href="/projects/new"
                    variant="primary"
                    className="px-4 py-2 text-sm"
                  >
                    Create Project
                  </ButtonLink>
                  <ButtonLink
                    href="/projects/generate"
                    variant="secondary"
                    className="px-4 py-2 text-sm"
                  >
                    Generate with AI
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Your Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-on-background">
              Your Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <Card padded={false} className="p-8 text-center">
              <CardContent className="p-0">
                <p className="text-on-surface-variant">
                  No tasks assigned to you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
