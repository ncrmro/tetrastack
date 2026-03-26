import { describe, it, expect } from 'vitest';
import { createProgressBar } from '../src/progress.js';

describe('createProgressBar', () => {
  it('should create empty progress bar at 0%', () => {
    const result = createProgressBar(0);
    expect(result).toBe('░'.repeat(20));
    expect(result.length).toBe(20);
  });

  it('should create half-filled progress bar at 50%', () => {
    const result = createProgressBar(50);
    expect(result).toBe('█'.repeat(10) + '░'.repeat(10));
    expect(result.length).toBe(20);
  });

  it('should create full progress bar at 100%', () => {
    const result = createProgressBar(100);
    expect(result).toBe('█'.repeat(20));
    expect(result.length).toBe(20);
  });

  it('should handle custom width', () => {
    const result = createProgressBar(50, 10);
    expect(result).toBe('█'.repeat(5) + '░'.repeat(5));
    expect(result.length).toBe(10);
  });

  it('should clamp negative percent to 0', () => {
    const result = createProgressBar(-10);
    expect(result).toBe('░'.repeat(20));
  });

  it('should clamp percent over 100', () => {
    const result = createProgressBar(150);
    expect(result).toBe('█'.repeat(20));
  });

  it('should handle fractional percentages', () => {
    const result = createProgressBar(25, 20);
    expect(result).toBe('█'.repeat(5) + '░'.repeat(15));
    expect(result.length).toBe(20);
  });

  it('should round correctly for odd percentages', () => {
    const result = createProgressBar(33, 10);
    // 33% of 10 = 3.3, rounds to 3
    expect(result).toBe('█'.repeat(3) + '░'.repeat(7));
  });
});
