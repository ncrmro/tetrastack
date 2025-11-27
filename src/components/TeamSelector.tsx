'use client'

import { Select } from '@/components/ui/select'
import type { SelectTeam } from '@/database/schema.teams'

interface TeamSelectorProps {
  teams: SelectTeam[]
  value: string
  onChange: (teamId: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function TeamSelector({
  teams,
  value,
  onChange,
  label = 'Team',
  required = false,
  disabled = false,
  className = '',
}: TeamSelectorProps) {
  return (
    <div className={className}>
      <label
        htmlFor="team-select"
        className="block text-sm font-medium text-on-surface mb-1"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <Select
        id="team-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled || teams.length === 0}
        className="text-sm"
      >
        <option value="">Select a team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
      {teams.length === 0 && (
        <p className="mt-1 text-sm text-on-surface-variant">
          No teams available. Create a team first.
        </p>
      )}
    </div>
  )
}
