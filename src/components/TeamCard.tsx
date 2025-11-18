import Link from 'next/link';
import type { SelectTeam } from '@/database/schema.teams';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TeamCardProps {
  team: SelectTeam & {
    role: string;
    joinedAt: Date | string;
    memberCount?: number;
    projectCount?: number;
    activeProjectCount?: number;
  };
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`} data-testid="team-card" className="block">
      <Card
        padded={false}
        rounded="lg"
        className="p-6 transition-colors hover:bg-surface-variant/50"
      >
        <CardHeader className="mb-4 p-0">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{team.name}</CardTitle>
            <span className="inline-flex items-center rounded-full bg-primary-container px-2.5 py-0.5 text-xs font-medium text-on-primary-container">
              {team.role}
            </span>
          </div>
        </CardHeader>

        {team.description && (
          <CardContent className="mb-4 p-0">
            <p className="text-sm text-on-surface-variant line-clamp-2">
              {team.description}
            </p>
          </CardContent>
        )}

        {(team.memberCount !== undefined ||
          team.activeProjectCount !== undefined) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline">
            {team.memberCount !== undefined && (
              <div>
                <div className="text-2xl font-bold text-on-surface">
                  {team.memberCount}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {team.memberCount === 1 ? 'Member' : 'Members'}
                </div>
              </div>
            )}
            {team.activeProjectCount !== undefined && (
              <div>
                <div className="text-2xl font-bold text-on-surface">
                  {team.activeProjectCount}
                </div>
                <div className="text-xs text-on-surface-variant">
                  Active{' '}
                  {team.activeProjectCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-on-surface-variant">
          Joined {new Date(team.joinedAt).toLocaleDateString()}
        </div>
      </Card>
    </Link>
  );
}
