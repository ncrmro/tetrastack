import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDocker } from '../src/docker.js';

describe('isDocker', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.IS_DOCKER;
    delete process.env.DOCKER_CONTAINER;
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it('should return false by default', () => {
    // Assuming /.dockerenv doesn't exist in test environment
    expect(isDocker()).toBe(false);
  });

  it('should return true with IS_DOCKER env var', () => {
    process.env.IS_DOCKER = 'true';
    expect(isDocker()).toBe(true);
  });

  it('should return true with DOCKER_CONTAINER env var', () => {
    process.env.DOCKER_CONTAINER = 'true';
    expect(isDocker()).toBe(true);
  });

  it('should return false with IS_DOCKER set to false', () => {
    process.env.IS_DOCKER = 'false';
    expect(isDocker()).toBe(false);
  });
});
