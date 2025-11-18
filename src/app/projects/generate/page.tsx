import { authRedirect } from '../../auth';
import { User } from '@/models/user';
import { notFound } from 'next/navigation';
import { AIProjectGenerator } from '@/components/AIProjectGenerator';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface GenerateProjectPageProps {
  searchParams: Promise<{ teamId?: string }>;
}

export default async function GenerateProjectPage({
  searchParams,
}: GenerateProjectPageProps) {
  const session = await authRedirect();
  const userId = parseInt(session.user.id);
  const params = await searchParams;

  // Get user's teams
  const userTeams = await User.getUserTeams(userId);

  if (userTeams.length === 0) {
    notFound();
  }

  const preselectedTeamId = params.teamId || userTeams[0].team.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/projects"
              className="text-on-surface-variant hover:text-on-surface"
            >
              ← Projects
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-on-background">
            Generate Project with AI
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Describe your project and let AI create it for you with intelligent
            defaults
          </p>
        </div>

        {/* AI Generator Component */}
        <AIProjectGenerator teamId={preselectedTeamId} />
      </div>
    </div>
  );
}
