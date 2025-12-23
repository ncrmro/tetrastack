/**
 * Job Registry implementation
 */

import type { Job } from './job';

export interface JobRegistry {
  register(jobClass: typeof Job): JobRegistry;
  get(name: string): typeof Job | undefined;
  has(name: string): boolean;
  getNames(): string[];
}

/**
 * Create a job registry for worker dispatch
 */
export function createJobRegistry(): JobRegistry {
  const registry = new Map<string, typeof Job>();

  return {
    /**
     * Register a job type
     */
    register(jobClass: typeof Job): JobRegistry {
      const name = jobClass.name;

      if (registry.has(name)) {
        throw new Error(`Job "${name}" is already registered`);
      }

      registry.set(name, jobClass);
      return this;
    },

    /**
     * Get job class by name
     */
    get(name: string): typeof Job | undefined {
      return registry.get(name);
    },

    /**
     * Check if job type is registered
     */
    has(name: string): boolean {
      return registry.has(name);
    },

    /**
     * List all registered job names
     */
    getNames(): string[] {
      return Array.from(registry.keys());
    },
  };
}
