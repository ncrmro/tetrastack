import type { SelectTag } from '@/database/schema.tags'
import { generateUuidV7 } from '@/lib/uuid'
import { TEAM_ENGINEERING, TEAM_PRODUCT } from './teams'

export const TAG_FRONTEND: SelectTag = {
  id: generateUuidV7(),
  name: 'Frontend',
  color: '#3b82f6', // blue
  teamId: TEAM_ENGINEERING.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

export const TAG_BACKEND: SelectTag = {
  id: generateUuidV7(),
  name: 'Backend',
  color: '#10b981', // green
  teamId: TEAM_ENGINEERING.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

export const TAG_INFRASTRUCTURE: SelectTag = {
  id: generateUuidV7(),
  name: 'Infrastructure',
  color: '#f59e0b', // amber
  teamId: TEAM_ENGINEERING.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

export const TAG_UX: SelectTag = {
  id: generateUuidV7(),
  name: 'UX',
  color: '#ec4899', // pink
  teamId: TEAM_PRODUCT.id,
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-01'),
}

export const TAG_RESEARCH: SelectTag = {
  id: generateUuidV7(),
  name: 'Research',
  color: '#8b5cf6', // purple
  teamId: TEAM_PRODUCT.id,
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-01'),
}

export const TAG_URGENT: SelectTag = {
  id: generateUuidV7(),
  name: 'Urgent',
  color: '#ef4444', // red
  teamId: TEAM_ENGINEERING.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

export const TAG_NICE_TO_HAVE: SelectTag = {
  id: generateUuidV7(),
  name: 'Nice to Have',
  color: '#6b7280', // gray
  teamId: TEAM_ENGINEERING.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

export const tags = [
  TAG_FRONTEND,
  TAG_BACKEND,
  TAG_INFRASTRUCTURE,
  TAG_UX,
  TAG_RESEARCH,
  TAG_URGENT,
  TAG_NICE_TO_HAVE,
]
