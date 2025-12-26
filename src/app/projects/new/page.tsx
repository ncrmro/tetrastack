import { authRedirect } from '../../auth';
import { User } from '@/models/user';
import { notFound } from 'next/navigation';
import ProjectFormClient from './ProjectFormClient';

export const dynamic = 'force-dynamic';

interface NewProjectPageProps {
  searchParams: Promise<{ teamId?: string }>;
}

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const session = await authRedirect();
  const userId = session.user.id;
  const params = await searchParams;

  // Get user's teams
  const userTeams = await User.getUserTeams(userId);

  if (userTeams.length === 0) {
    notFound();
  }

  // Pre-select team if provided
  const preselectedTeamId = params.teamId;

  return (
    <ProjectFormClient
      teams={userTeams.map((t) => t.team)}
      preselectedTeamId={preselectedTeamId}
    />
  );
}
