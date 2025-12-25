import { describe, it, expect } from 'vitest';
import { TASK_STATUS, TASK_PRIORITY } from '@/database/schema.tasks';

describe('Task Utilities', () => {
  describe('Task status validation', () => {
    it('validates all task statuses', () => {
      const validStatuses = Object.values(TASK_STATUS);

      expect(validStatuses).toContain(TASK_STATUS.TODO);
      expect(validStatuses).toContain(TASK_STATUS.IN_PROGRESS);
      expect(validStatuses).toContain(TASK_STATUS.DONE);
      expect(validStatuses).toHaveLength(3);
    });

    it('identifies valid task statuses', () => {
      const isValidStatus = (status: string) =>
        Object.values(TASK_STATUS).includes(status as any);

      expect(isValidStatus('todo')).toBe(true);
      expect(isValidStatus('in_progress')).toBe(true);
      expect(isValidStatus('done')).toBe(true);
      expect(isValidStatus('invalid-status')).toBe(false);
      expect(isValidStatus('')).toBe(false);
    });
  });

  describe('Task priority validation', () => {
    it('validates all task priorities', () => {
      const validPriorities = Object.values(TASK_PRIORITY);

      expect(validPriorities).toContain(TASK_PRIORITY.LOW);
      expect(validPriorities).toContain(TASK_PRIORITY.MEDIUM);
      expect(validPriorities).toContain(TASK_PRIORITY.HIGH);
      expect(validPriorities).toHaveLength(3);
    });

    it('identifies valid task priorities', () => {
      const isValidPriority = (priority: string) =>
        Object.values(TASK_PRIORITY).includes(priority as any);

      expect(isValidPriority('low')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('invalid-priority')).toBe(false);
      expect(isValidPriority('')).toBe(false);
    });
  });

  describe('Task status transitions', () => {
    it('allows logical status transitions', () => {
      // Valid transitions from TODO
      const fromTodo = [
        TASK_STATUS.TODO,
        TASK_STATUS.IN_PROGRESS,
        TASK_STATUS.DONE,
      ];
      fromTodo.forEach((status) => {
        expect(Object.values(TASK_STATUS)).toContain(status);
      });

      // Valid transitions from IN_PROGRESS
      const fromInProgress = [
        TASK_STATUS.IN_PROGRESS,
        TASK_STATUS.DONE,
        TASK_STATUS.TODO,
      ];
      fromInProgress.forEach((status) => {
        expect(Object.values(TASK_STATUS)).toContain(status);
      });

      // Valid transitions from DONE
      const fromDone = [
        TASK_STATUS.DONE,
        TASK_STATUS.TODO,
        TASK_STATUS.IN_PROGRESS,
      ];
      fromDone.forEach((status) => {
        expect(Object.values(TASK_STATUS)).toContain(status);
      });
    });
  });

  describe('Due date validation', () => {
    it('validates due dates are in the future', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const isValidFutureDate = (date: Date) => date > now;

      expect(isValidFutureDate(tomorrow)).toBe(true);
      expect(isValidFutureDate(yesterday)).toBe(false);
    });

    it('detects overdue tasks', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const isOverdue = (dueDate: Date | null, status: string) => {
        if (!dueDate || status === TASK_STATUS.DONE) return false;
        return dueDate < now;
      };

      expect(isOverdue(yesterday, TASK_STATUS.TODO)).toBe(true);
      expect(isOverdue(yesterday, TASK_STATUS.IN_PROGRESS)).toBe(true);
      expect(isOverdue(yesterday, TASK_STATUS.DONE)).toBe(false);
      expect(isOverdue(tomorrow, TASK_STATUS.TODO)).toBe(false);
      expect(isOverdue(null, TASK_STATUS.TODO)).toBe(false);
    });

    it('calculates days until due date', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const daysUntilDue = (dueDate: Date) => {
        const diff = dueDate.getTime() - now.getTime();
        return Math.ceil(diff / (24 * 60 * 60 * 1000));
      };

      expect(daysUntilDue(tomorrow)).toBe(1);
      expect(daysUntilDue(nextWeek)).toBe(7);
    });
  });

  describe('Task validation rules', () => {
    it('validates task title requirements', () => {
      const isValidTitle = (title: string) =>
        title.length > 0 && title.length <= 200;

      expect(isValidTitle('Valid Task')).toBe(true);
      expect(isValidTitle('A'.repeat(200))).toBe(true);
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle('A'.repeat(201))).toBe(false);
    });

    it('validates task description length', () => {
      const isValidDescription = (description: string | null) =>
        description === null || description.length <= 2000;

      expect(isValidDescription(null)).toBe(true);
      expect(isValidDescription('Valid description')).toBe(true);
      expect(isValidDescription('A'.repeat(2000))).toBe(true);
      expect(isValidDescription('A'.repeat(2001))).toBe(false);
    });
  });
});
