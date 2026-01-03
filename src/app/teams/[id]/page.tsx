import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProjectCard } from '@/components/ProjectCard';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PROJECT_STATUS } from '@/database/schema.projects';
import { getProjects } from '@/models/projects';
import { getTeamMemberships, getTeams } from '@/models/teams';
import { authRedirect } from '../../auth';

export const dynamic = 'force-dynamic';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await authRedirect();
  const userId = parseInt(session.user.id, 10);
  const { id } = await params;

  // Get team details
  const teams = await getTeams({ ids: [id] });
  if (teams.length === 0) {
    notFound();
  }
  const team = teams[0];

  // Get team memberships
  const memberships = await getTeamMemberships({ teamIds: [id] });

  // Check if current user is a member
  const currentUserMembership = memberships.find((m) => m.userId === userId);
  if (!currentUserMembership) {
    notFound();
  }

  // Get team projects
  const projects = await getProjects({ teamIds: [id] });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/teams"
                className="text-on-surface-variant hover:text-on-surface"
              >
                ← Teams
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-on-background">
              {team.name}
            </h1>
            {team.description && (
              <p className="mt-2 text-on-surface-variant max-w-3xl">
                {team.description}
              </p>
            )}
          </div>
          {currentUserMembership.role === 'admin' && (
            <ButtonLink
              href={`/teams/${id}/settings`}
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              Settings
            </ButtonLink>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Members
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {memberships.length}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Projects
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {projects.length}
              </div>
            </CardContent>
          </Card>
          <Card padded={false} className="p-6">
            <CardContent className="p-0">
              <div className="text-sm font-medium text-on-surface-variant">
                Active Projects
              </div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {
                  projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE)
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-on-background mb-4">
            Team Members
          </h2>
          <div className="bg-surface rounded-lg border border-outline overflow-hidden">
            <div className="divide-y divide-outline">
              {memberships.map((membership) => (
                <div
                  key={membership.userId}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                      <span className="text-on-primary-container font-medium">
                        {membership.user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-on-surface">
                        {membership.user?.name || `User #${membership.userId}`}
                        {membership.userId === userId && (
                          <span className="ml-2 text-xs text-on-surface-variant">
                            (You)
                          </span>
                        )}
                      </div>
                      {membership.user?.email && (
                        <div className="text-sm text-on-surface-variant">
                          {membership.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-primary-container px-2.5 py-0.5 text-xs font-medium text-on-primary-container">
                      {membership.role}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Joined{' '}
                      {new Date(membership.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-on-background">Projects</h2>
            <ButtonLink
              href={`/projects/new?teamId=${id}`}
              variant="primary"
              className="px-4 py-2 text-sm"
            >
              Create Project
            </ButtonLink>
          </div>
          {projects.length === 0 ? (
            <Card padded={false} className="p-8 text-center">
              <CardContent className="p-0">
                <p className="text-on-surface-variant mb-4">No projects yet.</p>
                <div className="flex gap-4 justify-center">
                  <ButtonLink
                    href={`/projects/new?teamId=${id}`}
                    variant="primary"
                    className="px-4 py-2 text-sm"
                  >
                    Create Project
                  </ButtonLink>
                  <ButtonLink
                    href={`/projects/generate?teamId=${id}`}
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
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
