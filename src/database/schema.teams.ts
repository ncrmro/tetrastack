import {
  integer,
  sqliteTable,
  text,
  primaryKey,
  check,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './schema.auth';
import { generateUuidV7 } from '@/lib/uuid';

/**
 * Team role enum - defines membership roles and access control levels
 */
export const TEAM_ROLE = {
  MEMBER: 'member',
  ADMIN: 'admin',
} as const;
export type TeamRole = (typeof TEAM_ROLE)[keyof typeof TEAM_ROLE];

export const teams = sqliteTable(
  'teams',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUuidV7()),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [check('name_not_empty', sql`length(${table.name}) > 0`)],
);

export const teamMemberships = sqliteTable(
  'team_memberships',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', {
      enum: Object.values(TEAM_ROLE) as [string, ...string[]],
    })
      .notNull()
      .default(TEAM_ROLE.MEMBER),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.teamId, table.userId],
    }),
  }),
);

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  memberships: many(teamMemberships),
}));

export const teamMembershipsRelations = relations(
  teamMemberships,
  ({ one }) => ({
    team: one(teams, {
      fields: [teamMemberships.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [teamMemberships.userId],
      references: [users.id],
    }),
  }),
);

// Schema generation and types
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { createAutoInsertSchema } from '@/lib/db/schema-helpers';
import { z } from 'zod';

/**
 * Base team schema for insertions (auto-generated from Drizzle table)
 * Auto-omits: id, createdAt, updatedAt
 */
export const insertTeamSchema = createAutoInsertSchema(teams);

/**
 * Complete team schema including all fields (auto-generated from Drizzle table)
 */
export const selectTeamSchema = createSelectSchema(teams);

/**
 * Team membership schema for insertions (auto-generated from Drizzle table)
 */
export const insertTeamMembershipSchema = createInsertSchema(
  teamMemberships,
).omit({
  joinedAt: true, // Auto-generated
});

/**
 * Complete team membership schema including all fields (auto-generated from Drizzle table)
 */
export const selectTeamMembershipSchema = createSelectSchema(teamMemberships);

// Export types for TypeScript usage
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type SelectTeam = z.infer<typeof selectTeamSchema>;
export type InsertTeamMembership = z.infer<typeof insertTeamMembershipSchema>;
export type SelectTeamMembership = z.infer<typeof selectTeamMembershipSchema>;
