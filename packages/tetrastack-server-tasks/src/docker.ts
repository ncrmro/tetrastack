import { existsSync } from 'node:fs';

/**
 * Detect if running inside a Docker container
 */
export function isDocker(): boolean {
  // Check for Docker environment file
  if (existsSync('/.dockerenv')) {
    return true;
  }

  // Check for Docker-related environment variables
  if (process.env.IS_DOCKER === 'true') {
    return true;
  }

  if (process.env.DOCKER_CONTAINER === 'true') {
    return true;
  }

  return false;
}
