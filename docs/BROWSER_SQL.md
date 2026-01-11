# Browser SQL with Drizzle ORM and libsql

This investigation explores using SQLite in the browser with Drizzle ORM schemas and libsql for offline-first applications.

## Quick Links

- 📄 **[Full Investigation Report](./investigations/BROWSER_SQL_INVESTIGATION.md)** - Comprehensive research findings
- 💻 **[Proof of Concept Code](./investigations/browser-sql-poc/)** - Example implementations
- 🔗 **[Official SQLite WASM](https://sqlite.org/wasm/)** - SQLite WebAssembly
- 🔗 **[libsql Documentation](https://docs.turso.tech/sdk/ts)** - libsql TypeScript SDK
- 🔗 **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM

## TL;DR

### What is it?

Running a full SQLite database in the browser using WebAssembly (WASM) to enable offline-first web applications with client-side data persistence.

### Why would you use it?

✅ **Good for:**

- Offline-first Progressive Web Apps (PWAs)
- Client-side caching to reduce server load
- Fast local data processing
- Temporary session data
- Reducing API calls and improving performance

❌ **Not good for:**

- Primary data storage (use server database)
- Sensitive data without encryption
- Large datasets (>100MB)
- Real-time multi-user collaboration without sync

### Current Status (November 2025)

- ✅ **SQLite WASM** - Production-ready with OPFS support
- ✅ **libsql browser client** - Available via `@libsql/client/web`
- ⚠️ **Drizzle ORM** - No official browser driver, requires custom adapter
- ✅ **Persistence** - Multiple options (OPFS, IndexedDB, in-memory)

### Browser Support

| Feature              | Chrome | Edge   | Firefox | Safari   |
| -------------------- | ------ | ------ | ------- | -------- |
| SQLite WASM          | ✅ 86+ | ✅ 86+ | ✅ 100+ | ✅ 15.2+ |
| OPFS (recommended)   | ✅ 86+ | ✅ 86+ | ✅ 111+ | ⚠️ 15.2+ |
| IndexedDB (fallback) | ✅ All | ✅ All | ✅ All  | ✅ All   |

## Implementation Options

### Option 1: sql.js (Simplest)

```bash
npm install sql.js
```

- ✅ Easy to use, well-documented
- ✅ Broad browser compatibility
- ⚠️ ~500KB bundle size
- ⚠️ Manual persistence management

### Option 2: Official SQLite WASM (Recommended)

```bash
# Download from sqlite.org/wasm/
```

- ✅ Official, actively maintained
- ✅ OPFS support (best performance)
- ✅ ~400KB bundle size
- ⚠️ Requires Web Worker for sync access

### Option 3: libsql Embedded Replicas (Advanced)

```typescript
import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'file:local.db',
  syncUrl: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
  syncInterval: 60000, // Sync every minute
});
```

- ✅ Built-in sync with Turso
- ✅ Automatic conflict resolution
- ✅ Same libsql ecosystem as server
- ⚠️ Requires Turso account

## Quick Start Example

See the [proof-of-concept code](./investigations/browser-sql-poc/) for complete examples.

```typescript
// 1. Create browser database
const db = await createBrowserDB({
  dbName: 'myapp',
  persistent: true,
  initSQL: ['CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)'],
});

// 2. Query data
const result = await db.execute('SELECT * FROM users');
console.log(result.rows);

// 3. Insert data
await db.execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
```

## Key Considerations

### Bundle Size

- sql.js: ~500KB (gzipped)
- SQLite WASM: ~400KB (gzipped)
- Impact: Adds 400-500KB to your app bundle

### Performance

- **OPFS**: Near-native performance (10-100x faster than IndexedDB)
- **IndexedDB**: Slower due to async overhead
- **In-Memory**: Fastest but no persistence

### Data Sync

- **Manual sync**: Implement your own sync logic
- **libsql replicas**: Automatic background sync
- **Conflict resolution**: Required for multi-device support

### Security

- OPFS is origin-private (secure by default)
- HTTPS required for OPFS
- Consider encryption for sensitive data
- Always validate/sanitize user input

## Architecture Patterns

### Pattern 1: Cache Layer

```
User → Browser DB (cache) → Server DB (source of truth)
```

- Use browser DB to cache frequently accessed data
- Periodically sync from server
- Simple conflict resolution (server wins)

### Pattern 2: Offline-First

```
User → Browser DB (primary) ⟷ Sync ⟷ Server DB (backup)
```

- All operations work offline
- Background sync when online
- Conflict resolution required

### Pattern 3: Hybrid

```
User → Browser DB (offline) + Server DB (online)
```

- Use server DB when online
- Fall back to browser DB when offline
- Sync on reconnection

## Integration with Tetrastack

### Current Architecture

Tetrastack uses:

- **Production**: Turso (libsql over HTTP)
- **Development**: LibSQL server or file-based SQLite
- **Testing**: In-memory SQLite
- **ORM**: Drizzle ORM

### Adding Browser SQL

1. **Phase 1**: Add as optional feature for caching
2. **Phase 2**: Implement offline workflows
3. **Phase 3**: Add real-time sync capabilities

### Drizzle Schema Reuse

Your existing Drizzle schemas can be reused! Generate migrations server-side and apply them in the browser:

```typescript
// Reuse existing schema
import * as schema from '@/database/schema';

// Generate SQL from migrations
const migrations = loadMigrations();

// Apply to browser DB
await browserDB.executeBatch(migrations);
```

## Next Steps

1. **Evaluate use case** - Is offline-first needed?
2. **Choose implementation** - sql.js vs SQLite WASM vs libsql
3. **Design sync strategy** - How will data sync with server?
4. **Prototype** - Use POC code as starting point
5. **Test** - Verify offline functionality works
6. **Deploy** - Add to app as feature flag

## Resources

- [Full Investigation Report](./investigations/BROWSER_SQL_INVESTIGATION.md)
- [Proof of Concept Code](./investigations/browser-sql-poc/)
- [SQLite WASM Documentation](https://sqlite.org/wasm/)
- [libsql SDK Documentation](https://docs.turso.tech/sdk/ts)
- [OPFS Guide (Chrome)](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system/)
- [Browser SQLite Persistence State](https://www.powersync.com/blog/sqlite-persistence-on-the-web)

---

**Last Updated**: November 2025  
**Status**: Investigation Complete  
**Recommendation**: Viable for offline-first features; evaluate based on use case
