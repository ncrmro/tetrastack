import { TeamCard } from '@/components/TeamCard'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PROJECT_STATUS } from '@/database/schema.projects'
import { getProjects } from '@/models/projects'
import { getTeamMemberships } from '@/models/teams'
import { User } from '@/models/user'
import { authRedirect } from '../auth'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const session = await authRedirect()
  const userId = parseInt(session.user.id, 10)

  // Get user's teams
  const userTeams = await User.getUserTeams(userId)

  // Get member counts and project counts for each team
  const teamsWithCounts = await Promise.all(
    userTeams.map(async ({ team, role, joinedAt }) => {
      const memberships = await getTeamMemberships({ teamIds: [team.id] })
      const projects = await getProjects({ teamIds: [team.id] })

      return {
        ...team,
        role,
        joinedAt,
        memberCount: memberships.length,
        projectCount: projects.length,
        activeProjectCount: projects.filter(
          (p) => p.status === PROJECT_STATUS.ACTIVE,
        ).length,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-background">Teams</h1>
            <p className="mt-2 text-on-surface-variant">
              Manage your teams and collaborations
            </p>
          </div>
          <ButtonLink
            href="/teams/new"
            variant="primary"
            className="px-4 py-2 text-sm"
          >
            Create Team
          </ButtonLink>
        </div>

        {/* Teams Grid */}
        {teamsWithCounts.length === 0 ? (
          <Card padded={false} className="p-12 text-center">
            <CardContent className="p-0">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-on-surface mb-2">
                  No teams yet
                </h3>
                <p className="text-on-surface-variant mb-6">
                  Create a team to start collaborating on projects with others.
                </p>
                <ButtonLink
                  href="/teams/new"
                  variant="primary"
                  className="px-6 py-3 text-base"
                >
                  Create Your First Team
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamsWithCounts.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
