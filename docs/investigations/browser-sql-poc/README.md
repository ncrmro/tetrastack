# Browser SQL Proof of Concept

This directory contains proof-of-concept code demonstrating how to use SQLite in the browser with Drizzle ORM schemas.

## Files

- `browser-db.ts` - Browser database client implementation
- `example-usage.tsx` - React component showing usage
- `migrations.ts` - Migration management for browser DB
- `sync-strategy.ts` - Optional sync with server DB

## Quick Start

```bash
# Install sql.js (if implementing this POC)
npm install sql.js

# Or use official SQLite WASM
npm install @sqlite.org/sqlite-wasm
```

## Implementation Options

### Option 1: sql.js (Simpler)

- ✅ Easier setup
- ✅ Good documentation
- ⚠️ Larger bundle (~500KB)
- ⚠️ Manual persistence

### Option 2: SQLite WASM (Recommended)

- ✅ Official implementation
- ✅ OPFS support (better performance)
- ✅ Smaller bundle (~400KB)
- ⚠️ More complex setup
- ⚠️ Requires Web Worker for best performance

## Architecture

```
Browser App
├── UI Components (React)
│   ├── Read from browser DB
│   └── Write to browser DB
├── Browser DB Client
│   ├── SQLite WASM/sql.js
│   ├── OPFS/IndexedDB persistence
│   └── Drizzle schema compatibility
└── Sync Manager (Optional)
    ├── Detect changes
    ├── Sync with server
    └── Resolve conflicts
```

## Usage Pattern

```typescript
import { createBrowserDB } from './browser-db';
import { users } from '@/database/schema';

// Initialize
const db = await createBrowserDB();

// Query with Drizzle-like syntax
const userList = await db.select(users);

// Insert
await db.insert(users, {
  name: 'John',
  email: 'john@example.com',
});

// Update
await db.update(
  users,
  { id: 1 },
  {
    name: 'Jane',
  },
);
```

## Limitations

1. **Not Full Drizzle ORM:** This is a lightweight adapter
2. **No Automatic Migrations:** Migrations must be applied manually
3. **No Relationships:** Complex joins need raw SQL
4. **Bundle Size:** Adds ~400-500KB to app bundle
5. **Browser Support:** OPFS requires modern browsers

## When to Use

✅ **Good for:**

- Offline-first apps
- Client-side caching
- Temporary data storage
- PWAs
- Reducing server load

❌ **Not good for:**

- Primary data storage
- Large datasets (>100MB)
- Sensitive data (without encryption)
- Real-time collaboration

## Next Steps

1. Choose implementation (sql.js vs SQLite WASM)
2. Implement browser-db.ts
3. Add to app as feature flag
4. Test offline functionality
5. Add sync if needed
