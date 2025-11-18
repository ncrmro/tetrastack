/**
 * Integration tests for tags model functions
 * Tests database persistence and query operations for team-scoped tags
 */

import { describe, it, expect } from 'vitest';
import { db } from '@/database';
import { tags } from '@/database/schema.tags';
import { getTags, insertTags, updateTags, deleteTags } from '@/models/tags';
import { eq } from 'drizzle-orm';
import { tagFactory, teamFactory } from '../factories';

describe('getTags', () => {
  it('should get tags by IDs using WHERE IN', async () => {
    const tag1 = await tagFactory.create();
    const tag2 = await tagFactory.create();
    const tag3 = await tagFactory.create();

    const result = await getTags({ ids: [tag1.id, tag2.id] });

    expect(result).toHaveLength(2);
    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(tag1.id);
    expect(resultIds).toContain(tag2.id);
    expect(resultIds).not.toContain(tag3.id);
  });

  it('should get tags by team IDs', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();
    const tag1 = await tagFactory.create({ teamId: team1.id });
    const tag2 = await tagFactory.create({ teamId: team2.id });

    const result = await getTags({ teamIds: [team1.id] });

    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(tag1.id);
    expect(resultIds).not.toContain(tag2.id);
  });

  it('should get tags by names', async () => {
    await tagFactory.create({ name: 'frontend' });
    await tagFactory.create({ name: 'backend' });
    await tagFactory.create({ name: 'infrastructure' });

    const result = await getTags({ names: ['frontend', 'backend'] });

    expect(result.length).toBeGreaterThanOrEqual(2);
    const names = result.map((t) => t.name);
    expect(names).toContain('frontend');
    expect(names).toContain('backend');
  });

  it('should combine multiple filters', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();

    const targetTag = await tagFactory.create({
      teamId: team1.id,
      name: 'frontend',
    });
    await tagFactory.create({ teamId: team1.id, name: 'backend' });
    await tagFactory.create({ teamId: team2.id, name: 'frontend' }); // Different team

    const result = await getTags({
      teamIds: [team1.id],
      names: ['frontend'],
    });

    expect(result.some((t) => t.id === targetTag.id)).toBe(true);
  });
});

describe('insertTags', () => {
  it('should create a tag with all fields', async () => {
    const team = await teamFactory.create();

    const [result] = await insertTags([
      {
        name: 'urgent',
        color: '#ef4444',
        teamId: team.id,
      },
    ]);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('urgent');
    expect(result.color).toBe('#ef4444');
    expect(result.teamId).toBe(team.id);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should create tag using factory defaults', async () => {
    const result = await tagFactory.create();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create tag using factory traits', async () => {
    const frontend = await tagFactory.frontend().create();
    const backend = await tagFactory.backend().create();
    const urgent = await tagFactory.urgent().create();
    const infrastructure = await tagFactory.infrastructure().create();

    expect(frontend.name).toBe('frontend');
    expect(backend.name).toBe('backend');
    expect(urgent.name).toBe('urgent');
    expect(infrastructure.name).toBe('infrastructure');
  });

  it('should support different team-scoped tags with same name', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();

    const [tag1] = await insertTags([
      {
        name: 'frontend',
        color: '#3b82f6',
        teamId: team1.id,
      },
    ]);
    const [tag2] = await insertTags([
      {
        name: 'frontend',
        color: '#10b981',
        teamId: team2.id,
      },
    ]);

    expect(tag1.name).toBe(tag2.name);
    expect(tag1.teamId).not.toBe(tag2.teamId);
    expect(tag1.id).not.toBe(tag2.id);
  });
});

describe('updateTags', () => {
  it('should update tag fields', async () => {
    const tag = await tagFactory.create();

    const [result] = await updateTags([eq(tags.id, tag.id)], {
      name: 'updated-tag',
      color: '#8b5cf6',
    });

    expect(result.id).toBe(tag.id);
    expect(result.name).toBe('updated-tag');
    expect(result.color).toBe('#8b5cf6');
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const tag = await tagFactory.create({
      name: 'original',
      color: '#3b82f6',
    });

    const [result] = await updateTags([eq(tags.id, tag.id)], {
      name: 'updated',
    });

    expect(result.name).toBe('updated');
    expect(result.color).toBe('#3b82f6');
  });
});

describe('deleteTags', () => {
  it('should delete tag from database', async () => {
    const tag = await tagFactory.create();

    await deleteTags([eq(tags.id, tag.id)]);

    const found = await db.query.tags.findFirst({
      where: eq(tags.id, tag.id),
    });

    expect(found).toBeUndefined();
  });

  it('should only delete specified tag', async () => {
    const team = await teamFactory.create();

    const tag1 = await tagFactory.create({ teamId: team.id });
    const tag2 = await tagFactory.create({ teamId: team.id });

    await deleteTags([eq(tags.id, tag1.id)]);

    const remainingTags = await getTags({ teamIds: [team.id] });

    expect(remainingTags.some((t) => t.id === tag1.id)).toBe(false);
    expect(remainingTags.some((t) => t.id === tag2.id)).toBe(true);
  });
});

describe('Tag colors', () => {
  it('should support common tag colors', async () => {
    const team = await teamFactory.create();

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
    ];

    for (const color of colors) {
      const [tag] = await insertTags([
        {
          name: `tag-${color}`,
          color,
          teamId: team.id,
        },
      ]);

      expect(tag.color).toBe(color);
      expect(tag.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Edge cases', () => {
  it('should handle empty name validation at database level', async () => {
    const team = await teamFactory.create();

    await expect(
      insertTags([{ name: '', color: '#3b82f6', teamId: team.id }]),
    ).rejects.toThrow();
  });

  it('should handle tag name normalization', async () => {
    const team = await teamFactory.create();

    const [tag] = await insertTags([
      {
        name: '  Frontend  ',
        color: '#3b82f6',
        teamId: team.id,
      },
    ]);

    // Note: Database doesn't auto-normalize, this is for UI layer
    // This test documents current behavior
    expect(tag.name).toBe('  Frontend  ');
  });

  it('should support long tag names', async () => {
    const team = await teamFactory.create();
    const longName = 'a'.repeat(50);

    const [result] = await insertTags([
      {
        name: longName,
        color: '#3b82f6',
        teamId: team.id,
      },
    ]);

    expect(result.name.length).toBe(50);
  });
});
