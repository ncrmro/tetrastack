# Investigation: Drizzle ORM with libsql and Browser SQL

**Date:** November 2025  
**Status:** Complete  
**Author:** AI Assistant (Copilot)

## Executive Summary

This investigation explores using Drizzle ORM with libsql and browser-based SQLite (WASM) to enable offline-first capabilities and client-side database operations in web applications.

**Key Findings:**

- ✅ libsql supports browser environments via `@libsql/client/web`
- ✅ SQLite WASM with OPFS provides robust browser persistence
- ⚠️ Drizzle ORM browser support requires custom adapter/driver
- ✅ Multiple persistence backends available (IndexedDB, OPFS, in-memory)
- ✅ Can reuse existing Drizzle schemas for browser clients

## Background

### Current Architecture

Tetrastack currently uses:

- **Production:** Turso (libsql over HTTP) with authentication
- **Development:** LibSQL server via Docker or file-based SQLite
- **Testing:** In-memory SQLite
- **ORM:** Drizzle ORM with libsql driver

### Investigation Goals

1. Evaluate browser-based SQLite options for offline-first apps
2. Understand Drizzle ORM compatibility with browser SQL
3. Identify best persistence mechanisms (IndexedDB vs OPFS)
4. Create proof-of-concept implementation
5. Document limitations and browser compatibility

## Research Findings

### 1. Browser SQLite Options (2024-2025)

#### Option A: Official SQLite WASM

- **Source:** https://sqlite.org/wasm/
- **Persistence:** OPFS (recommended), IndexedDB, or in-memory
- **Performance:** Best-in-class, especially with OPFS
- **Browser Support:** Chrome/Edge (excellent), Firefox/Safari (improving)
- **Pros:** Official, actively maintained, excellent OPFS support
- **Cons:** Synchronous API only works in Web Workers

#### Option B: sql.js

- **Source:** https://github.com/sql-js/sql.js
- **Persistence:** Manual (export/import), IndexedDB via wrapper
- **Performance:** Good for smaller databases
- **Browser Support:** Universal
- **Pros:** Easy to use, well-documented, broad compatibility
- **Cons:** Larger bundle size, manual persistence management

#### Option C: wa-sqlite

- **Source:** https://github.com/rhashimoto/wa-sqlite
- **Persistence:** IndexedDB, OPFS via VFS adapters
- **Performance:** Excellent with OPFS
- **Browser Support:** Good, improving
- **Pros:** Multiple VFS options, good performance
- **Cons:** Smaller ecosystem than sql.js

#### Option D: @libsql/client WASM

- **Source:** Part of libsql ecosystem
- **Persistence:** Via client configuration
- **Performance:** Comparable to other WASM options
- **Browser Support:** Modern browsers
- **Pros:** Same ecosystem as server/Turso, sync capabilities
- **Cons:** Documentation still evolving

### 2. Persistence Mechanisms

#### IndexedDB

- **Availability:** All modern browsers
- **Performance:** Slower than OPFS (async overhead)
- **Use Case:** Fallback option, broad compatibility
- **Limitations:** Async API adds complexity, slower writes
- **Storage Quota:** Generous (typically >1GB)

#### OPFS (Origin Private File System)

- **Availability:** Chrome 86+, Edge 86+, Firefox 111+, Safari 15.2+
- **Performance:** Near-native file system performance
- **Use Case:** Primary option for production apps
- **Limitations:** Requires secure context (HTTPS), Worker-based
- **Storage Quota:** Larger than IndexedDB
- **Recommendation:** ✅ **Preferred for 2024-2025**

#### In-Memory

- **Availability:** Universal
- **Performance:** Fastest (no I/O)
- **Use Case:** Temporary data, sessions
- **Limitations:** Data lost on page reload

### 3. Drizzle ORM Browser Compatibility

#### Current Status (November 2025)

Drizzle ORM does **not** ship official browser-compatible drivers for SQLite WASM. However, integration is possible through:

1. **Custom Driver Approach**
   - Use Drizzle's query builder to generate SQL
   - Execute SQL manually against WASM SQLite
   - Parse results back to TypeScript types

2. **Community Adapters**
   - `drizzle-orm-crsqlite-wasm` (CR-SQLite example)
   - Community discussions: https://github.com/drizzle-team/drizzle-orm/discussions/243

3. **Schema Reuse**
   - ✅ Drizzle schemas are portable
   - ✅ Can generate migrations for browser DB
   - ⚠️ Drizzle Kit (CLI) doesn't run in browser
   - Solution: Generate migrations server-side, apply client-side

#### Integration Patterns

**Pattern 1: Query Builder Only**

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { QueryBuilder, eq } from 'drizzle-orm';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
});

// Generate SQL with Drizzle
const qb = new QueryBuilder();
const query = qb
  .select()
  .from(users)
  .where(eq(users.email, 'test@example.com'));
const { sql, params } = query.toSQL();

// Execute with your WASM SQLite client
const result = await sqliteWasm.exec(sql, params);
```

**Pattern 2: Custom Driver Wrapper**

```typescript
// Create adapter that implements Drizzle's driver interface
class BrowserSQLiteDriver {
  constructor(private wasmDb: SqliteDB) {}

  async execute(sql: string, params: any[]) {
    const result = await this.wasmDb.exec(sql, params);
    return this.parseResult(result);
  }

  // Implement other driver methods...
}

const db = drizzle(new BrowserSQLiteDriver(wasmDb), { schema });
```

**Pattern 3: Hybrid Approach**

- Server-side: Full Drizzle ORM with libsql
- Browser-side: Drizzle schemas + query builder + WASM executor
- Sync mechanism: libsql embedded replicas or custom sync

### 4. libsql Browser Capabilities

The `@libsql/client` package provides multiple entry points:

```typescript
// Server/Node.js (current usage)
import { createClient } from '@libsql/client/node';

// Browser/Edge Workers (web standard APIs only)
import { createClient } from '@libsql/client/web';

// Universal (auto-detects environment)
import { createClient } from '@libsql/client';
```

**Browser Web Client Features:**

- ✅ HTTP/HTTPS connections to Turso
- ✅ WebSocket connections (wss://)
- ❌ File-based databases (no `file:` protocol)
- ✅ Embedded replicas (with sync)

**Embedded Replicas (Offline-First)**

```typescript
import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'file:local.db', // Local WASM database
  syncUrl: process.env.TURSO_URL, // Remote sync endpoint
  authToken: process.env.TURSO_TOKEN,
  syncInterval: 60000, // Sync every minute
});
```

This enables:

- Offline-first applications
- Local read/write performance
- Automatic background sync to Turso
- Conflict resolution

## Recommended Approach

### For Tetrastack Integration

**Phase 1: Foundation** ✅ (Recommended)

1. Create browser database utility module
2. Implement OPFS-backed SQLite WASM
3. Reuse existing Drizzle schemas
4. Build minimal query executor

**Phase 2: Enhanced Integration**

1. Create custom Drizzle driver for browser
2. Implement schema migration system
3. Add data sync capabilities (server ↔ browser)

**Phase 3: Advanced Features**

1. Implement libsql embedded replicas
2. Add conflict resolution
3. Build offline-first UI components
4. Add service worker integration

### Implementation Strategy

```typescript
// src/lib/db/browser-client.ts
import initSqlite from '@sqlite.org/sqlite-wasm';
import * as schema from '@/database/schema';

export async function createBrowserDB() {
  // Initialize SQLite WASM with OPFS
  const sqlite3 = await initSqlite({
    vfs: 'opfs', // Use OPFS for persistence
  });

  const db = new sqlite3.oo1.DB('/myapp.db', 'cw');

  // Run migrations (pre-generated from Drizzle)
  await runMigrations(db);

  return {
    db,
    schema,
    execute: async (sql: string, params: any[]) => {
      // Execute and return results
    },
  };
}
```

### Testing Strategy

```typescript
// tests/unit/browser-db.test.ts
import { describe, it, expect } from 'vitest';
import { createBrowserDB } from '@/lib/db/browser-client';

describe('Browser Database', () => {
  it('should initialize WASM SQLite', async () => {
    const db = await createBrowserDB();
    expect(db).toBeDefined();
  });

  it('should execute queries', async () => {
    const db = await createBrowserDB();
    const result = await db.execute('SELECT 1 as value', []);
    expect(result[0].value).toBe(1);
  });
});
```

## Browser Compatibility Matrix

| Feature           | Chrome | Edge   | Firefox | Safari   | Notes                  |
| ----------------- | ------ | ------ | ------- | -------- | ---------------------- |
| SQLite WASM       | ✅ 86+ | ✅ 86+ | ✅ 100+ | ✅ 15.2+ | Universal support      |
| OPFS (Sync)       | ✅ 86+ | ✅ 86+ | ✅ 111+ | ⚠️ 15.2+ | Safari: limited Worker |
| OPFS (Async)      | ✅ 86+ | ✅ 86+ | ✅ 111+ | ✅ 15.2+ | Broader support        |
| IndexedDB         | ✅ All | ✅ All | ✅ All  | ✅ All   | Fallback option        |
| Web Workers       | ✅ All | ✅ All | ✅ All  | ✅ All   | Required for OPFS sync |
| libsql Web Client | ✅ All | ✅ All | ✅ All  | ✅ All   | HTTP/WS only           |
| Embedded Replicas | ✅ 86+ | ✅ 86+ | ⚠️ 111+ | ⚠️ 15.2+ | Needs OPFS             |

**Recommendation:** Target Chrome/Edge as primary, provide IndexedDB fallback for Firefox/Safari if needed.

## Performance Considerations

### Bundle Size Impact

| Library        | Size (min+gzip) | Notes                         |
| -------------- | --------------- | ----------------------------- |
| sql.js         | ~500KB          | Includes SQLite WASM          |
| SQLite WASM    | ~400KB          | Official, optimized           |
| wa-sqlite      | ~200KB          | Smaller, modular              |
| @libsql/client | ~100KB          | Client only (no WASM bundled) |

### Runtime Performance

- **OPFS:** Near-native performance (10-100x faster than IndexedDB for writes)
- **IndexedDB:** Slower due to async overhead, good for reads
- **In-Memory:** Fastest, but no persistence

### Best Practices

1. **Lazy Load:** Load SQLite WASM only when needed
2. **Web Worker:** Run database in Worker for OPFS sync access
3. **Caching:** Cache frequently accessed data in memory
4. **Batching:** Use batch operations for better performance
5. **Indexes:** Create proper indexes for query performance

## Security Considerations

1. **Origin Isolation:** OPFS is origin-private (secure by default)
2. **Data Encryption:** Consider encrypting sensitive data at rest
3. **HTTPS Required:** OPFS requires secure context
4. **Storage Quotas:** Monitor and handle quota exceeded errors
5. **Input Validation:** Always validate/sanitize user input for SQL

## Migration Path

### For Existing Tetrastack Apps

1. **Phase 1:** Add browser DB as optional feature
   - Keep server-side DB as primary
   - Use browser DB for caching/offline
   - No schema changes required

2. **Phase 2:** Enable offline-first workflows
   - Implement sync logic
   - Add conflict resolution
   - Handle network failures gracefully

3. **Phase 3:** Advanced features
   - Real-time sync with Turso
   - Multi-device synchronization
   - Collaborative features

## Limitations and Trade-offs

### Current Limitations

1. **No Native Drizzle Driver:** Requires custom adapter or manual SQL
2. **Migration Management:** Drizzle Kit doesn't run in browser
3. **Bundle Size:** WASM SQLite adds ~400-500KB to bundle
4. **Browser Support:** OPFS not fully mature in all browsers
5. **Worker Requirement:** Best performance requires Web Workers

### Trade-offs

| Aspect           | Server DB  | Browser DB | Hybrid           |
| ---------------- | ---------- | ---------- | ---------------- |
| Performance      | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐⭐⭐       |
| Offline Support  | ❌         | ✅         | ✅               |
| Consistency      | ✅         | ⚠️         | ⚠️ (sync needed) |
| Security         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐         |
| Scalability      | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐         |
| Setup Complexity | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐       |

## Conclusions

### Key Takeaways

1. **Browser SQLite is Production-Ready** (with OPFS in modern browsers)
2. **Drizzle Schemas are Portable** (can reuse existing schemas)
3. **Custom Integration Needed** (no official Drizzle browser driver yet)
4. **OPFS is the Future** (best performance, growing browser support)
5. **Hybrid Approach Best** (server primary + browser cache/offline)

### Recommended Next Steps

For Tetrastack:

1. ✅ **Create proof-of-concept** (see `/docs/investigations/browser-sql-poc/`)
2. ✅ **Document implementation patterns** (this document)
3. ⏭️ **Build reusable browser DB utility** (if needed by features)
4. ⏭️ **Add to documentation** (guide for app developers)
5. ⏭️ **Consider official feature** (if offline-first is roadmap priority)

### When to Use Browser SQL

**Good Use Cases:**

- ✅ Offline-first applications
- ✅ Client-side caching/performance
- ✅ Local data processing
- ✅ Temporary session data
- ✅ Read-heavy operations with local cache
- ✅ Progressive Web Apps (PWAs)

**Not Recommended For:**

- ❌ Primary data storage (use server)
- ❌ Sensitive/PII data without encryption
- ❌ Large datasets (>100MB)
- ❌ Write-heavy operations
- ❌ Multi-user collaboration (without sync)

## References

### Official Documentation

- [SQLite WASM Official](https://sqlite.org/wasm/)
- [libsql Client Documentation](https://docs.turso.tech/sdk/ts)
- [Drizzle ORM SQLite](https://orm.drizzle.team/docs/get-started-sqlite)
- [OPFS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)

### Community Resources

- [Drizzle WASM Discussion](https://github.com/drizzle-team/drizzle-orm/discussions/243)
- [Browser SQL Persistence State (2025)](https://www.powersync.com/blog/sqlite-persistence-on-the-web)
- [SQLite WASM with OPFS Guide](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/)

### Related Projects

- [sql.js](https://github.com/sql-js/sql.js)
- [wa-sqlite](https://github.com/rhashimoto/wa-sqlite)
- [drizzle-orm-crsqlite-wasm](https://www.npmjs.com/package/drizzle-orm-crsqlite-wasm)

---

**Last Updated:** November 2025  
**Next Review:** When Drizzle adds official browser driver support
