import { describe, it, expect } from 'vitest';
import { parseParams } from '../src/params.js';

describe('parseParams', () => {
  it('should parse simple key=value', () => {
    const result = parseParams(['name=John']);
    expect(result).toEqual({ name: 'John' });
  });

  it('should parse nested keys', () => {
    const result = parseParams(['user.email=john@example.com']);
    expect(result).toEqual({ user: { email: 'john@example.com' } });
  });

  it('should parse multiple nested levels', () => {
    const result = parseParams(['config.db.host=localhost']);
    expect(result).toEqual({ config: { db: { host: 'localhost' } } });
  });

  it('should coerce boolean true', () => {
    const result = parseParams(['enabled=true']);
    expect(result).toEqual({ enabled: true });
  });

  it('should coerce boolean false', () => {
    const result = parseParams(['enabled=false']);
    expect(result).toEqual({ enabled: false });
  });

  it('should coerce null', () => {
    const result = parseParams(['value=null']);
    expect(result).toEqual({ value: null });
  });

  it('should coerce numbers', () => {
    const result = parseParams(['count=42', 'price=19.99']);
    expect(result).toEqual({ count: 42, price: 19.99 });
  });

  it('should keep strings as strings', () => {
    const result = parseParams(['name=John Doe']);
    expect(result).toEqual({ name: 'John Doe' });
  });

  it('should handle multiple params', () => {
    const result = parseParams(['name=John', 'age=30', 'active=true']);
    expect(result).toEqual({ name: 'John', age: 30, active: true });
  });

  it('should handle values containing equals', () => {
    const result = parseParams(['equation=a=b+c']);
    expect(result).toEqual({ equation: 'a=b+c' });
  });

  it('should handle empty value', () => {
    const result = parseParams(['value=']);
    expect(result).toEqual({ value: '' });
  });

  it('should throw on invalid format (no equals)', () => {
    expect(() => parseParams(['invalid'])).toThrow('Invalid param format');
  });

  it('should merge nested objects', () => {
    const result = parseParams(['user.name=John', 'user.age=30']);
    expect(result).toEqual({ user: { name: 'John', age: 30 } });
  });
});
