import { describe, it, expect } from 'vitest';
import { slugify, generateUniqueSlug } from '@tetrastack/backend/utils';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/database/schema.projects';

describe('Project Utilities', () => {
  describe('Project slug generation', () => {
    it('generates URL-safe slugs for project names', () => {
      expect(slugify('Website Redesign Project')).toBe(
        'website-redesign-project',
      );
      expect(slugify('Q1 2024 Marketing Campaign')).toBe(
        'q1-2024-marketing-campaign',
      );
      expect(slugify('API Integration & Testing')).toBe(
        'api-integration-and-testing',
      );
    });

    it('handles project names with special characters', () => {
      expect(slugify('Project: Client Deliverables')).toBe(
        'project-client-deliverables',
      );
      expect(slugify('Bug Fixes (Critical)')).toBe('bug-fixes-critical');
      expect(slugify('UX/UI Improvements')).toBe('uxui-improvements');
    });

    it('generates unique slugs for duplicate project names', () => {
      const existing = new Set(['website-redesign', 'website-redesign-2']);
      expect(generateUniqueSlug('website-redesign', existing)).toBe(
        'website-redesign-3',
      );
    });

    it('handles empty project names gracefully', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('Project status validation', () => {
    it('validates all project statuses', () => {
      const validStatuses = Object.values(PROJECT_STATUS);

      expect(validStatuses).toContain(PROJECT_STATUS.PLANNING);
      expect(validStatuses).toContain(PROJECT_STATUS.ACTIVE);
      expect(validStatuses).toContain(PROJECT_STATUS.COMPLETED);
      expect(validStatuses).toContain(PROJECT_STATUS.ARCHIVED);
      expect(validStatuses).toHaveLength(4);
    });

    it('identifies valid project statuses', () => {
      const isValidStatus = (status: string) =>
        Object.values(PROJECT_STATUS).includes(status as any);

      expect(isValidStatus('planning')).toBe(true);
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('archived')).toBe(true);
      expect(isValidStatus('invalid-status')).toBe(false);
      expect(isValidStatus('')).toBe(false);
    });
  });

  describe('Project priority validation', () => {
    it('validates all project priorities', () => {
      const validPriorities = Object.values(PROJECT_PRIORITY);

      expect(validPriorities).toContain(PROJECT_PRIORITY.LOW);
      expect(validPriorities).toContain(PROJECT_PRIORITY.MEDIUM);
      expect(validPriorities).toContain(PROJECT_PRIORITY.HIGH);
      expect(validPriorities).toHaveLength(3);
    });

    it('identifies valid project priorities', () => {
      const isValidPriority = (priority: string) =>
        Object.values(PROJECT_PRIORITY).includes(priority as any);

      expect(isValidPriority('low')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('invalid-priority')).toBe(false);
      expect(isValidPriority('')).toBe(false);
    });
  });

  describe('Project validation rules', () => {
    it('validates project title requirements', () => {
      const isValidTitle = (title: string) =>
        title.length > 0 && title.length <= 200;

      expect(isValidTitle('Valid Project')).toBe(true);
      expect(isValidTitle('A'.repeat(200))).toBe(true);
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle('A'.repeat(201))).toBe(false);
    });

    it('validates project description length', () => {
      const isValidDescription = (description: string | null) =>
        description === null || description.length <= 2000;

      expect(isValidDescription(null)).toBe(true);
      expect(isValidDescription('Valid description')).toBe(true);
      expect(isValidDescription('A'.repeat(2000))).toBe(true);
      expect(isValidDescription('A'.repeat(2001))).toBe(false);
    });
  });
});
