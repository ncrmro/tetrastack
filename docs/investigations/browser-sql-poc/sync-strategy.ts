/**
 * Data Synchronization Strategy
 *
 * This document outlines strategies for syncing data between
 * browser SQLite database and server database.
 *
 * NOTE: This is a proof-of-concept/example file, not production code.
 * Linting rules are relaxed for demonstration purposes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-anonymous-default-export */

/**
 * Sync Strategy 1: Last-Write-Wins (Simple)
 *
 * Pros:
 * - Simple to implement
 * - No conflict resolution needed
 * - Works well for single-user scenarios
 *
 * Cons:
 * - Data loss possible
 * - No multi-device support
 * - Poor for collaborative editing
 */
export interface LastWriteWinsSync {
  /**
   * Sync local changes to server
   */
  pushChanges(): Promise<void>;

  /**
   * Pull server changes to local
   */
  pullChanges(): Promise<void>;

  /**
   * Full bidirectional sync
   */
  sync(): Promise<void>;
}

/**
 * Sync Strategy 2: Timestamp-Based (Better)
 *
 * Each record has updated_at timestamp
 * Sync based on which is newer
 *
 * Pros:
 * - Simple conflict resolution
 * - Multi-device support
 * - Minimal data loss
 *
 * Cons:
 * - Clock sync issues
 * - Still loses some concurrent edits
 */
export interface TimestampSync {
  /**
   * Sync with conflict resolution
   */
  sync(options: {
    /**
     * Last sync timestamp
     */
    lastSync?: number;

    /**
     * Conflict resolution strategy
     */
    onConflict?: 'server' | 'client' | 'newest';
  }): Promise<SyncResult>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

/**
 * Sync Strategy 3: CRDT-Based (Advanced)
 *
 * Conflict-free Replicated Data Types
 * Automatically merges changes
 *
 * Pros:
 * - True multi-user support
 * - Automatic conflict resolution
 * - No data loss
 *
 * Cons:
 * - Complex implementation
 * - Requires schema changes
 * - Performance overhead
 *
 * @see https://crdt.tech/
 */
export interface CRDTSync {
  /**
   * Merge changes automatically
   */
  merge(): Promise<void>;

  /**
   * Subscribe to real-time changes
   */
  subscribe(callback: (change: Change) => void): () => void;
}

export interface Change {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  id: number;
  data: Record<string, any>;
  timestamp: number;
  userId: string;
}

/**
 * Example Implementation: Simple Timestamp Sync
 */
export class SimpleTimestampSync implements TimestampSync {
  constructor(
    private browserDB: any, // Browser database client
    private serverAPI: any, // Server API client
  ) {}

  async sync(
    options: {
      lastSync?: number;
      onConflict?: 'server' | 'client' | 'newest';
    } = {},
  ): Promise<SyncResult> {
    const { lastSync = 0, onConflict = 'newest' } = options;

    const result: SyncResult = {
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // 1. Get local changes since last sync
      const localChanges = await this.getLocalChanges(lastSync);

      // 2. Push local changes to server
      for (const change of localChanges) {
        try {
          await this.serverAPI.applyChange(change);
          result.pushed++;
        } catch (error) {
          result.errors.push(`Failed to push change: ${error}`);
        }
      }

      // 3. Get server changes since last sync
      const serverChanges = await this.serverAPI.getChanges(lastSync);

      // 4. Apply server changes to local database
      for (const change of serverChanges) {
        try {
          // Check for conflicts
          const localVersion = await this.getLocalVersion(
            change.table,
            change.id,
          );

          if (localVersion && localVersion.updated_at > change.updated_at) {
            // Conflict detected
            result.conflicts++;

            if (onConflict === 'client') {
              continue; // Keep local version
            } else if (onConflict === 'server') {
              await this.applyChange(change); // Use server version
            } else {
              // Use newest
              if (localVersion.updated_at < change.updated_at) {
                await this.applyChange(change);
              }
            }
          } else {
            await this.applyChange(change);
            result.pulled++;
          }
        } catch (error) {
          result.errors.push(`Failed to apply change: ${error}`);
        }
      }

      // 5. Update last sync timestamp
      await this.updateLastSync(Date.now());

      return result;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      return result;
    }
  }

  private async getLocalChanges(since: number): Promise<Change[]> {
    // Query local database for changes since timestamp
    // This requires tracking changes in a sync log table
    return [];
  }

  private async getLocalVersion(
    table: string,
    id: number,
  ): Promise<any | null> {
    // Get current version of record from local DB
    return null;
  }

  private async applyChange(change: Change): Promise<void> {
    // Apply change to local database
  }

  private async updateLastSync(timestamp: number): Promise<void> {
    // Save last sync timestamp
  }
}

/**
 * Sync Strategy 4: libsql Embedded Replicas (Recommended)
 *
 * Use libsql's built-in sync capabilities
 *
 * @see https://docs.turso.tech/features/embedded-replicas
 *
 * @example
 * ```typescript
 * import { createClient } from '@libsql/client/web';
 *
 * const client = createClient({
 *   url: 'file:local.db',
 *   syncUrl: process.env.TURSO_DATABASE_URL,
 *   authToken: process.env.TURSO_AUTH_TOKEN,
 *   syncInterval: 60000, // Sync every minute
 * });
 *
 * // Writes go to local DB first
 * await client.execute('INSERT INTO users ...');
 *
 * // Background sync to Turso
 * // Automatic conflict resolution
 * ```
 *
 * Pros:
 * - Built-in sync
 * - Automatic conflict resolution
 * - Production-ready
 * - Same libsql ecosystem
 *
 * Cons:
 * - Requires Turso account
 * - Network overhead
 * - Not free for all use cases
 */

/**
 * Schema Requirements for Sync
 *
 * To enable syncing, tables should include:
 */
export const syncSchemaExample = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Sync metadata
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    deleted_at INTEGER, -- For soft deletes
    sync_version INTEGER DEFAULT 0, -- For conflict resolution
    
    -- For multi-device sync
    device_id TEXT,
    user_id TEXT
  );

  -- Trigger to update updated_at
  CREATE TRIGGER users_updated_at 
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = strftime('%s', 'now')
    WHERE id = NEW.id;
  END;

  -- Sync log table (track all changes)
  CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    operation TEXT NOT NULL, -- 'insert', 'update', 'delete'
    data TEXT, -- JSON of changed data
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    synced INTEGER DEFAULT 0
  );
`;

/**
 * Best Practices for Sync
 */
export const syncBestPractices = {
  /**
   * 1. Design for Offline-First
   * - All data operations work locally first
   * - Sync in background
   * - Handle sync failures gracefully
   */
  offlineFirst: true,

  /**
   * 2. Use Optimistic UI
   * - Show changes immediately
   * - Update UI before server confirms
   * - Rollback on error
   */
  optimisticUI: true,

  /**
   * 3. Batch Sync Operations
   * - Don't sync every change immediately
   * - Batch multiple changes together
   * - Reduce network requests
   */
  batchSync: true,

  /**
   * 4. Handle Conflicts Transparently
   * - Don't show technical errors to users
   * - Auto-resolve when possible
   * - Prompt user only for important conflicts
   */
  transparentConflicts: true,

  /**
   * 5. Monitor Sync Status
   * - Show sync indicator in UI
   * - Alert user to sync failures
   * - Provide manual sync option
   */
  monitorStatus: true,

  /**
   * 6. Test Offline Scenarios
   * - Test with no network
   * - Test with slow network
   * - Test with intermittent network
   */
  testOffline: true,
};

/**
 * Sync UI Components (Examples)
 */
export const syncUIExamples = {
  /**
   * Sync Status Indicator
   */
  statusIndicator: `
    <div className="sync-status">
      {syncing ? (
        <span>⟳ Syncing...</span>
      ) : lastSync ? (
        <span>✓ Synced {formatTimeAgo(lastSync)}</span>
      ) : (
        <span>⚠️ Not synced</span>
      )}
    </div>
  `,

  /**
   * Manual Sync Button
   */
  manualSyncButton: `
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync Now'}
    </button>
  `,

  /**
   * Conflict Resolution Dialog
   */
  conflictDialog: `
    <dialog open={hasConflict}>
      <h2>Sync Conflict</h2>
      <p>This item was changed on another device.</p>
      <div className="flex gap-2">
        <button onClick={() => resolveConflict('server')}>
          Use Server Version
        </button>
        <button onClick={() => resolveConflict('client')}>
          Keep My Changes
        </button>
      </div>
    </dialog>
  `,
};

export default {
  SimpleTimestampSync,
  syncSchemaExample,
  syncBestPractices,
  syncUIExamples,
};
