'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProject } from '@/actions/projects';
import {
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  type ProjectStatus,
  type ProjectPriority,
} from '@/database/schema.projects';
import { enumToOptions } from '@/lib/enum-utils';
import type { SelectTeam } from '@/database/schema.teams';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ProjectFormClientProps {
  teams: SelectTeam[];
  preselectedTeamId?: string;
}

export default function ProjectFormClient({
  teams,
  preselectedTeamId,
}: ProjectFormClientProps) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(preselectedTeamId || teams[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(PROJECT_STATUS.PLANNING);
  const [priority, setPriority] = useState<ProjectPriority>(
    PROJECT_PRIORITY.MEDIUM,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createProject({
      teamId,
      title,
      description: description || null,
      status,
      priority,
      createdBy: 1, // Will be set properly by the action
    });

    if (result.success) {
      router.push(`/projects/${result.data.slug}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

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
            Create Project
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Create a new project for your team
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error-container border border-error rounded-lg p-4">
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-lg border border-outline p-6"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="team"
                className="block text-sm font-medium text-on-surface-variant mb-2"
              >
                Team
              </label>
              <Select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-on-surface-variant mb-2"
              >
                Project Title
              </label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter project title"
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
                rows={4}
                placeholder="Describe your project..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-on-surface-variant mb-2"
                >
                  Status
                </label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                >
                  {enumToOptions(PROJECT_STATUS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-on-surface-variant mb-2"
                >
                  Priority
                </label>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as ProjectPriority)
                  }
                >
                  {enumToOptions(PROJECT_PRIORITY).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <ButtonLink
                href="/projects"
                variant="secondary"
                className="text-sm"
              >
                Cancel
              </ButtonLink>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="px-6 text-sm"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
