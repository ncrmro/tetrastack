import { notFound } from 'next/navigation'
import { getTeamMemberships, getTeams } from '@/models/teams'
import { authRedirect } from '../../../auth'
import TeamSettingsClient from './TeamSettingsClient'

export const dynamic = 'force-dynamic'

interface TeamSettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamSettingsPage({
  params,
}: TeamSettingsPageProps) {
  const session = await authRedirect()
  const userId = parseInt(session.user.id, 10)
  const { id } = await params

  // Get team details
  const teams = await getTeams({ ids: [id] })
  if (teams.length === 0) {
    notFound()
  }
  const team = teams[0]

  // Get team memberships
  const memberships = await getTeamMemberships({ teamIds: [id] })

  // Check if current user is an admin
  const currentUserMembership = memberships.find((m) => m.userId === userId)
  if (!currentUserMembership || currentUserMembership.role !== 'admin') {
    notFound()
  }

  return (
    <TeamSettingsClient
      team={team}
      memberships={memberships}
      currentUserId={userId}
    />
  )
}
