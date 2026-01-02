'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  removeTeamMember,
  type SelectTeam,
  type SelectTeamMembership,
  updateTeam,
} from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type MembershipWithUser = SelectTeamMembership & {
  user: {
    id: number;
    name: string | null;
    email: string | null;
  };
};

interface TeamSettingsClientProps {
  team: SelectTeam;
  memberships: MembershipWithUser[];
  currentUserId: number;
}

export default function TeamSettingsClient({
  team,
  memberships: initialMemberships,
  currentUserId,
}: TeamSettingsClientProps) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await updateTeam(team.id, {
      name,
      description: description || null,
    });

    if (result.success) {
      setSuccessMessage('Team updated successfully');
      setTimeout(() => {
        router.refresh();
      }, 500);
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleRemoveMember = async (userId: number) => {
    if (userId === currentUserId) {
      setError('You cannot remove yourself from the team');
      return;
    }

    if (
      !confirm('Are you sure you want to remove this member from the team?')
    ) {
      return;
    }

    setRemovingUserId(userId);
    setError(null);

    const result = await removeTeamMember(team.id, userId);

    if (result.success) {
      setMemberships((prev) => prev.filter((m) => m.userId !== userId));
      setSuccessMessage('Member removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.error);
    }

    setRemovingUserId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/teams/${team.id}`}
              className="text-on-surface-variant hover:text-on-surface"
            >
              ← Back to Team
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-on-background">
            Team Settings
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Manage team information and members
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-error-container border border-error rounded-lg p-4">
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-primary-container border border-primary rounded-lg p-4">
            <p className="text-sm text-on-primary-container">
              {successMessage}
            </p>
          </div>
        )}

        {/* Team Information Form */}
        <div className="bg-surface rounded-lg border border-outline p-6 mb-8">
          <h2 className="text-xl font-bold text-on-surface mb-6">
            Team Information
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-on-surface-variant mb-2"
              >
                Team Name
              </label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-on-surface-variant mb-2"
              >
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="px-6 text-sm"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Team Members */}
        <div className="bg-surface rounded-lg border border-outline p-6">
          <h2 className="text-xl font-bold text-on-surface mb-6">
            Team Members
          </h2>
          <div className="divide-y divide-outline">
            {memberships.map((membership) => (
              <div
                key={membership.userId}
                className="py-4 flex items-center justify-between"
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
                      {membership.userId === currentUserId && (
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
                  {membership.userId !== currentUserId && (
                    <Button
                      onClick={() => handleRemoveMember(membership.userId)}
                      disabled={removingUserId === membership.userId}
                      variant="secondary"
                      className="text-sm text-error hover:text-error/80"
                    >
                      {removingUserId === membership.userId
                        ? 'Removing...'
                        : 'Remove'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
