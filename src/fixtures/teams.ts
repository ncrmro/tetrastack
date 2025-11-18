import { generateUuidV7 } from '@/lib/uuid';
import { TEAM_ROLE } from '@/database/schema.teams';
import type { SelectTeam, SelectTeamMembership } from '@/database/schema.teams';

export interface TeamFixture extends SelectTeam {
  memberships: SelectTeamMembership[];
}

export const TEAM_ENGINEERING: TeamFixture = {
  id: generateUuidV7(),
  name: 'Engineering',
  description: 'Software development and technical infrastructure team',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  memberships: [],
};

export const TEAM_PRODUCT: TeamFixture = {
  id: generateUuidV7(),
  name: 'Product',
  description: 'Product management and design team',
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-01'),
  memberships: [],
};

export const TEAM_OPERATIONS: TeamFixture = {
  id: generateUuidV7(),
  name: 'Operations',
  description: 'Business operations and customer success',
  createdAt: new Date('2024-03-10'),
  updatedAt: new Date('2024-03-10'),
  memberships: [],
};

export const teams = [TEAM_ENGINEERING, TEAM_PRODUCT, TEAM_OPERATIONS];

// Team memberships will be populated after users are created
export function createTeamMemberships(
  userIds: number[],
): SelectTeamMembership[] {
  return [
    // John Doe - Engineering Admin
    {
      teamId: TEAM_ENGINEERING.id,
      userId: userIds[0],
      role: TEAM_ROLE.ADMIN,
      joinedAt: new Date('2024-01-15'),
    },
    // Jane Doe - Engineering Member
    {
      teamId: TEAM_ENGINEERING.id,
      userId: userIds[1],
      role: TEAM_ROLE.MEMBER,
      joinedAt: new Date('2024-01-20'),
    },
    // John Doe - Product Member
    {
      teamId: TEAM_PRODUCT.id,
      userId: userIds[0],
      role: TEAM_ROLE.MEMBER,
      joinedAt: new Date('2024-02-01'),
    },
  ];
}
