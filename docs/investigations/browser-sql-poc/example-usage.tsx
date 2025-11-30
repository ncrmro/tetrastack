/**
 * Example React Component using Browser Database
 *
 * This demonstrates how to use the browser database in a React component
 * for offline-first functionality.
 *
 * NOTE: This is a proof-of-concept/example file, not production code.
 * Linting rules are relaxed for demonstration purposes.
 */

/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { useState, useEffect } from 'react';
import {
  createBrowserDB,
  BrowserDBAdapter,
  generateMigrations,
} from './browser-db';
import type { BrowserDBClient } from './browser-db';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: number;
}

export function BrowserDatabaseExample() {
  const [db, setDb] = useState<BrowserDBClient | null>(null);
  const [adapter, setAdapter] = useState<BrowserDBAdapter | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database
  useEffect(() => {
    async function initDB() {
      try {
        const client = await createBrowserDB({
          dbName: 'example-app',
          persistent: true,
          initSQL: generateMigrations(),
        });

        const dbAdapter = new BrowserDBAdapter(client);

        setDb(client);
        setAdapter(dbAdapter);

        // Load initial data
        const loadedUsers = await dbAdapter.select<User>('users');
        setUsers(loadedUsers);

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize database');
        setLoading(false);
      }
    }

    initDB();

    return () => {
      // Cleanup
      if (db) {
        db.close();
      }
    };
  }, []);

  // Add new user
  const addUser = async (name: string, email: string) => {
    if (!adapter) return;

    try {
      const newUser = await adapter.insert<User>('users', {
        name,
        email,
      });

      setUsers([...users, newUser]);
    } catch (err) {
      console.error('Failed to add user:', err);
      setError('Failed to add user');
    }
  };

  // Update user
  const updateUser = async (id: number, data: Partial<User>) => {
    if (!adapter) return;

    try {
      const updated = await adapter.update<User>('users', { id }, data);

      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, ...updated[0] } : user,
        ),
      );
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Failed to update user');
    }
  };

  // Delete user
  const deleteUser = async (id: number) => {
    if (!adapter) return;

    try {
      await adapter.delete('users', { id });
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

  // Export database
  const exportDatabase = () => {
    if (!db) return;

    const data = db.export();
    // @ts-expect-error - Type compatibility issue in POC example
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database-export.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import database
  const importDatabase = async (file: File) => {
    if (!db || !adapter) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      await db.import(data);

      // Reload users
      const loadedUsers = await adapter.select<User>('users');
      setUsers(loadedUsers);
    } catch (err) {
      console.error('Failed to import database:', err);
      setError('Failed to import database');
    }
  };

  if (loading) {
    return <div className="p-4">Loading database...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Browser Database Example</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={exportDatabase}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export Database
        </button>
        <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
          Import Database
          <input
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importDatabase(file);
            }}
            className="hidden"
          />
        </label>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Add User</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            addUser(name, email);
            e.currentTarget.reset();
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            placeholder="Name"
            required
            className="px-3 py-2 border rounded flex-1"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="px-3 py-2 border rounded flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Users ({users.length})</h2>

        {users.length === 0 ? (
          <p className="text-gray-500">No users yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    ID: {user.id} | Created:{' '}
                    {new Date(user.created_at * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newName = prompt('New name:', user.name);
                      if (newName) updateUser(user.id, { name: newName });
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${user.name}?`)) {
                        deleteUser(user.id);
                      }
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">💡 Tips</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Data is stored in IndexedDB (persists across page reloads)</li>
          <li>Works offline - try disconnecting your network</li>
          <li>Export/import to backup or transfer data</li>
          <li>Open DevTools → Application → IndexedDB to inspect storage</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Hook for using browser database
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { db, loading, error } = useBrowserDB({
 *     dbName: 'myapp',
 *     initSQL: generateMigrations(),
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   // Use db...
 * }
 * ```
 */
export function useBrowserDB(options: {
  dbName: string;
  initSQL?: string[];
  persistent?: boolean;
}) {
  const [db, setDb] = useState<BrowserDBClient | null>(null);
  const [adapter, setAdapter] = useState<BrowserDBAdapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const client = await createBrowserDB({
          dbName: options.dbName,
          persistent: options.persistent ?? true,
          initSQL: options.initSQL ?? [],
        });

        const dbAdapter = new BrowserDBAdapter(client);

        setDb(client);
        setAdapter(dbAdapter);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    init();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, [options.dbName]);

  return { db, adapter, loading, error };
}
