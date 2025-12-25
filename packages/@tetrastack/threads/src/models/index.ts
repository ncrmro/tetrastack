/**
 * Model layer exports for @tetrastack/threads.
 * Uses the many-first design pattern.
 */

import { createThreadsModel } from './threads';
import { createItemsModel } from './items';
import { createEdgesModel } from './edges';
import { createStreamsModel } from './streams';
import type { DrizzleDb } from './factory';

// Factory utilities
export { createModelFactory, takeFirst } from './factory';
export type { DrizzleDb, ModelSelect, ModelInsert } from './factory';

// Thread model
export { createThreadsModel } from './threads';
export type { ThreadsModel, Thread, NewThread } from './threads';

// Item model
export { createItemsModel } from './items';
export type { ItemsModel, Item, NewItem } from './items';

// Edge model
export { createEdgesModel } from './edges';
export type { EdgesModel, Edge, NewEdge } from './edges';

// Stream model
export { createStreamsModel } from './streams';
export type { StreamsModel, Stream, NewStream } from './streams';

/**
 * Create all thread-related models bound to a database instance.
 *
 * @example
 * ```typescript
 * import { drizzle } from 'drizzle-orm/better-sqlite3';
 * import { createThreadModels } from '@tetrastack/threads/models';
 *
 * const db = drizzle(sqlite);
 * const models = createThreadModels(db);
 *
 * // Now you can use all models
 * const [thread] = await models.threads.insert([{ projectId: 'proj_123' }]);
 * const [item] = await models.items.insert([{
 *   threadId: thread.id,
 *   role: 'user',
 *   parts: [{ type: 'text', text: 'Hello!' }],
 *   requestId: 'req_123',
 * }]);
 * ```
 */
export function createThreadModels(db: DrizzleDb) {
  return {
    threads: createThreadsModel(db),
    items: createItemsModel(db),
    edges: createEdgesModel(db),
    streams: createStreamsModel(db),
  };
}

export type ThreadModels = ReturnType<typeof createThreadModels>;
