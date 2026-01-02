'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SelectProject, updateProject } from '@/actions/projects';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_PRIORITY, PROJECT_STATUS } from '@/database/schema.projects';
import { enumToOptions } from '@/lib/enum-utils';

interface ProjectEditClientProps {
  project: SelectProject;
}

export default function ProjectEditClient({ project }: ProjectEditClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState(project.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await updateProject(project.id, {
      title,
      description: description || null,
      status,
      priority,
    });

    if (result.success) {
      setSuccessMessage('Project updated successfully');
      setTimeout(() => {
        router.push(`/projects/${result.data.slug}`);
      }, 500);
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
              href={`/projects/${project.slug}`}
              className="text-on-surface-variant hover:text-on-surface"
            >
              ← Back to Project
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-on-background">
            Edit Project
          </h1>
          <p className="mt-2 text-on-surface-variant">Update project details</p>
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-lg border border-outline p-6"
        >
          <div className="space-y-6">
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
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-on-surface-variant mb-2"
              >
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
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
                  onChange={(e) =>
                    setStatus(e.target.value as keyof typeof PROJECT_STATUS)
                  }
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
                    setPriority(e.target.value as keyof typeof PROJECT_PRIORITY)
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
                href={`/projects/${project.slug}`}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
