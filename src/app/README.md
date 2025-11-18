# App Directory

## Import Rules

**ALL React components must import database, model and agent types from actions only:**

### ✅ CORRECT

```typescript
import { createItem, updateItem, type SelectItem } from '@/actions/items';
```

### ❌ INCORRECT

```typescript
import { SelectItem } from '@/lib/db/schema.items.types'; // ❌
import { processItem } from '@/models/items'; // ❌
import { generateItem } from '@/agents/item-agents'; // ❌
```

## Server Components First

**Default to server components. Only use client components when you need:**

- Event handlers (onClick, onChange)
- Browser APIs (window, localStorage)
- React hooks (useState, useEffect)
- Real-time updates

### Server Component (Default)

```typescript
import { getItems, type SelectItem } from '@/actions/items';

export default async function ItemList() {
  const items = await getItems();
  return <div>{/* Render items */}</div>;
}
```

### Client Component (When Needed)

```typescript
'use client';

import { createItem, type InsertItem } from '@/actions/items';

export function ItemForm() {
  const handleSubmit = async (data: InsertItem) => {
    await createItem(data);
  };
  // Interactive form...
}
```

## Key Principles

1. **Server Components First** - Default choice unless interactivity needed
2. **Import from Actions Only** - Never bypass to access database/models/agents
3. **Type Safety** - Use re-exported types from actions
