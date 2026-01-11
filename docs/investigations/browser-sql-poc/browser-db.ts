/**
 * Browser Database Client - Proof of Concept
 *
 * This demonstrates how to use SQLite in the browser with sql.js
 * and make it compatible with Drizzle ORM schemas.
 *
 * Implementation options:
 * 1. sql.js (shown here) - simpler, larger bundle
 * 2. SQLite WASM - official, OPFS support, requires Worker
 *
 * NOTE: This is a proof-of-concept/example file, not production code.
 * Linting rules are relaxed for demonstration purposes.
 *
 * @see https://github.com/sql-js/sql.js
 * @see https://sqlite.org/wasm/
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-expect-error - This is a proof-of-concept file requiring sql.js dependency (not installed)
import initSqlJs, { Database } from 'sql.js';

// Type definitions for compatibility
interface QueryResult<T = any> {
  rows: T[];
  rowsAffected: number;
}

interface BrowserDBClient {
  execute<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  executeBatch(statements: string[]): Promise<void>;
  export(): Uint8Array;
  import(data: Uint8Array): Promise<void>;
  close(): void;
}

/**
 * Configuration for browser database
 */
interface BrowserDBConfig {
  /**
   * Database name for persistence
   */
  dbName?: string;

  /**
   * Whether to use IndexedDB for persistence
   */
  persistent?: boolean;

  /**
   * Initial SQL to run (migrations)
   */
  initSQL?: string[];

  /**
   * Path to sql-wasm.wasm file
   * Default: '/sql-wasm.wasm' (must be in public folder)
   */
  wasmPath?: string;
}

/**
 * Create a browser-based SQLite database client
 *
 * @example
 * ```typescript
 * const db = await createBrowserDB({
 *   dbName: 'myapp',
 *   persistent: true,
 *   initSQL: [
 *     'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)',
 *   ],
 * });
 *
 * const result = await db.execute('SELECT * FROM users');
 * console.log(result.rows);
 * ```
 */
export async function createBrowserDB(
  config: BrowserDBConfig = {},
): Promise<BrowserDBClient> {
  const {
    dbName = 'app.db',
    persistent = false,
    initSQL = [],
    wasmPath = '/sql-wasm.wasm',
  } = config;

  // Initialize sql.js
  const SQL = await initSqlJs({
    // @ts-expect-error - file parameter not used in this example
    locateFile: (file) => wasmPath,
  });

  let db: Database;

  // Load existing database from IndexedDB if persistent
  if (persistent && typeof window !== 'undefined') {
    const savedDb = await loadFromIndexedDB(dbName);
    if (savedDb) {
      db = new SQL.Database(savedDb);
    } else {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Run initialization SQL (migrations)
  for (const sql of initSQL) {
    db.run(sql);
  }

  // Save to IndexedDB after initialization
  if (persistent) {
    await saveToIndexedDB(dbName, db.export());
  }

  // Create client interface
  const client: BrowserDBClient = {
    async execute<T = any>(
      sql: string,
      params: any[] = [],
    ): Promise<QueryResult<T>> {
      try {
        const result = db.exec(sql, params);

        if (result.length === 0) {
          // No results (INSERT, UPDATE, DELETE)
          return {
            rows: [],
            rowsAffected: db.getRowsModified(),
          };
        }

        // Convert sql.js result format to standard format
        const { columns, values } = result[0];
        // @ts-expect-error - row and col have implicit any type in this POC
        const rows = values.map((row) => {
          const obj: any = {};
          // @ts-expect-error - col and i have implicit any type in this POC
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj as T;
        });

        // Save to IndexedDB if persistent
        if (persistent) {
          await saveToIndexedDB(dbName, db.export());
        }

        return {
          rows,
          rowsAffected: rows.length,
        };
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    },

    async executeBatch(statements: string[]): Promise<void> {
      for (const sql of statements) {
        db.run(sql);
      }

      if (persistent) {
        await saveToIndexedDB(dbName, db.export());
      }
    },

    export(): Uint8Array {
      return db.export();
    },

    async import(data: Uint8Array): Promise<void> {
      db.close();
      db = new SQL.Database(data);

      if (persistent) {
        await saveToIndexedDB(dbName, data);
      }
    },

    close(): void {
      db.close();
    },
  };

  return client;
}

/**
 * Save database to IndexedDB for persistence
 */
async function saveToIndexedDB(
  dbName: string,
  data: Uint8Array,
): Promise<void> {
  if (typeof window === 'undefined') return;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SQLiteStorage', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['databases'], 'readwrite');
      const store = transaction.objectStore('databases');
      const putRequest = store.put(data, dbName);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('databases')) {
        db.createObjectStore('databases');
      }
    };
  });
}

/**
 * Load database from IndexedDB
 */
async function loadFromIndexedDB(dbName: string): Promise<Uint8Array | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SQLiteStorage', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('databases')) {
        resolve(null);
        return;
      }

      const transaction = db.transaction(['databases'], 'readonly');
      const store = transaction.objectStore('databases');
      const getRequest = store.get(dbName);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('databases')) {
        db.createObjectStore('databases');
      }
    };
  });
}

/**
 * Helper to generate migrations from Drizzle schema
 * This would typically be done server-side and the SQL imported
 */
export function generateMigrations(): string[] {
  // In a real implementation, you would:
  // 1. Use drizzle-kit to generate migrations
  // 2. Bundle the SQL with your app
  // 3. Apply them here

  return [
    // Example migration
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`,
    `CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
  ];
}

/**
 * Drizzle-compatible query builder wrapper (simplified)
 * This demonstrates how you could make Drizzle schemas work with browser DB
 */
export class BrowserDBAdapter {
  constructor(private client: BrowserDBClient) {}

  /**
   * Select rows from a table
   */
  async select<T = any>(
    tableName: string,
    options: {
      where?: Record<string, any>;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (options.where) {
      const conditions = Object.entries(options.where).map(([key]) => {
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
      params.push(...Object.values(options.where));
    }

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    const result = await this.client.execute<T>(sql, params);
    return result.rows;
  }

  /**
   * Insert a row into a table
   */
  async insert<T = any>(
    tableName: string,
    data: Record<string, any>,
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const result = await this.client.execute<T>(sql, values);
    return result.rows[0];
  }

  /**
   * Update rows in a table
   */
  async update<T = any>(
    tableName: string,
    where: Record<string, any>,
    data: Record<string, any>,
  ): Promise<T[]> {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');

    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(' AND ');

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const params = [...Object.values(data), ...Object.values(where)];

    const result = await this.client.execute<T>(sql, params);
    return result.rows;
  }

  /**
   * Delete rows from a table
   */
  async delete(tableName: string, where: Record<string, any>): Promise<number> {
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(' AND ');

    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    const params = Object.values(where);

    const result = await this.client.execute(sql, params);
    return result.rowsAffected;
  }
}

// Export types
export type { BrowserDBClient, BrowserDBConfig, QueryResult };
