import { describe, it, expect } from 'vitest';
import * as output from '../src/output.js';

describe('output', () => {
  describe('color functions', () => {
    it('should add green color to success', () => {
      const result = output.success('Done');
      expect(result).toContain('Done');
      expect(result).toContain('\x1b[32m'); // green
      expect(result).toContain('\x1b[0m'); // reset
    });

    it('should add red color to error', () => {
      const result = output.error('Failed');
      expect(result).toContain('Failed');
      expect(result).toContain('\x1b[31m'); // red
      expect(result).toContain('\x1b[0m'); // reset
    });

    it('should add yellow color to warn', () => {
      const result = output.warn('Warning');
      expect(result).toContain('Warning');
      expect(result).toContain('\x1b[33m'); // yellow
      expect(result).toContain('\x1b[0m'); // reset
    });

    it('should add cyan color to info', () => {
      const result = output.info('Info');
      expect(result).toContain('Info');
      expect(result).toContain('\x1b[36m'); // cyan
      expect(result).toContain('\x1b[0m'); // reset
    });

    it('should add gray color to dim', () => {
      const result = output.dim('Subtle');
      expect(result).toContain('Subtle');
      expect(result).toContain('\x1b[90m'); // gray
      expect(result).toContain('\x1b[0m'); // reset
    });

    it('should add bold to text', () => {
      const result = output.bold('Bold');
      expect(result).toContain('Bold');
      expect(result).toContain('\x1b[1m'); // bold
      expect(result).toContain('\x1b[0m'); // reset
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(output.formatDuration(500)).toBe('500ms');
      expect(output.formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(output.formatDuration(1000)).toBe('1.0s');
      expect(output.formatDuration(1500)).toBe('1.5s');
      expect(output.formatDuration(59999)).toBe('60.0s');
    });

    it('should format minutes', () => {
      expect(output.formatDuration(60000)).toBe('1.0m');
      expect(output.formatDuration(90000)).toBe('1.5m');
      expect(output.formatDuration(120000)).toBe('2.0m');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(output.truncate('short', 10)).toBe('short');
    });

    it('should truncate long strings', () => {
      expect(output.truncate('this is a long string', 10)).toBe('this is...');
    });

    it('should handle exact length', () => {
      expect(output.truncate('exactly10!', 10)).toBe('exactly10!');
    });

    it('should handle empty string', () => {
      expect(output.truncate('', 10)).toBe('');
    });
  });

  describe('divider', () => {
    it('should create divider with default character', () => {
      const result = output.divider();
      expect(result).toBe('═'.repeat(70));
      expect(result.length).toBe(70);
    });

    it('should create divider with custom character', () => {
      const result = output.divider('-', 10);
      expect(result).toBe('----------');
      expect(result.length).toBe(10);
    });

    it('should create divider with custom width', () => {
      const result = output.divider('═', 20);
      expect(result).toBe('═'.repeat(20));
      expect(result.length).toBe(20);
    });
  });
});
