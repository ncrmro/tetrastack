import { ProjectCard } from '@/components/ProjectCard'
import { ProjectFilters } from '@/components/ProjectFilters'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProjectPriority, ProjectStatus } from '@/database/schema.projects'
import { getProjects } from '@/models/projects'
import { User } from '@/models/user'
import { authRedirect } from '../auth'

export const dynamic = 'force-dynamic'

interface ProjectsPageProps {
  searchParams: Promise<{ team?: string; status?: string; priority?: string }>
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const session = await authRedirect()
  const userId = parseInt(session.user.id, 10)
  const params = await searchParams

  // Get user's teams
  const userTeams = await User.getUserTeams(userId)
  const allTeamIds = userTeams.map((t) => t.team.id)

  // Apply filters
  const teamIds = params.team ? [params.team] : allTeamIds
  const status = params.status ? [params.status as ProjectStatus] : undefined
  const priority = params.priority
    ? [params.priority as ProjectPriority]
    : undefined

  // Get projects
  const projects =
    allTeamIds.length > 0
      ? await getProjects({ teamIds, status, priority })
      : []

  // Sort by updated date
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-background">Projects</h1>
            <p className="mt-2 text-on-surface-variant">
              Manage and organize your team projects
            </p>
          </div>
          <div className="flex gap-3">
            <ButtonLink
              href="/projects/generate"
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              Generate with AI
            </ButtonLink>
            <ButtonLink
              href="/projects/new"
              variant="primary"
              className="px-4 py-2 text-sm"
            >
              Create Project
            </ButtonLink>
          </div>
        </div>

        {/* Filters */}
        <ProjectFilters
          userTeams={userTeams.map(({ team }) => ({
            id: team.id,
            name: team.name,
          }))}
        />

        {/* Projects Grid */}
        {sortedProjects.length === 0 ? (
          <Card padded={false} className="p-12 text-center">
            <CardContent className="p-0">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-on-surface mb-2">
                  No projects found
                </h3>
                <p className="text-on-surface-variant mb-6">
                  {allTeamIds.length === 0
                    ? 'Join a team to start working on projects.'
                    : 'Get started by creating your first project or use AI to generate one.'}
                </p>
                {allTeamIds.length > 0 && (
                  <div className="flex gap-4 justify-center">
                    <ButtonLink
                      href="/projects/new"
                      variant="primary"
                      className="px-6 py-3 text-base"
                    >
                      Create Project
                    </ButtonLink>
                    <ButtonLink
                      href="/projects/generate"
                      variant="secondary"
                      className="px-6 py-3 text-base"
                    >
                      Generate with AI
                    </ButtonLink>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
