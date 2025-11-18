'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/database/schema.projects';
import { enumToOptions } from '@/lib/enum-utils';
import { Select } from '@/components/ui/select';

interface Team {
  id: string;
  name: string;
}

interface ProjectFiltersProps {
  userTeams: Team[];
}

export function ProjectFilters({ userTeams }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          Status
        </label>
        <Select
          value={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {enumToOptions(PROJECT_STATUS).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          Priority
        </label>
        <Select
          value={searchParams.get('priority') || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="px-3 py-1.5 text-sm"
        >
          <option value="">All Priorities</option>
          {enumToOptions(PROJECT_PRIORITY).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      {userTeams.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Team
          </label>
          <Select
            value={searchParams.get('team') || ''}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            className="px-3 py-1.5 text-sm"
          >
            <option value="">All Teams</option>
            {userTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
