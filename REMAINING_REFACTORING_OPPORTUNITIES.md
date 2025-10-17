# Remaining Refactoring Opportunities

## Summary

After completing Phases 1-4 (702 lines eliminated), I've identified **additional refactoring opportunities** that could further improve the codebase.

---

## 🔴 HIGH PRIORITY - Remaining API Routes with Old Auth Pattern

### **Pattern Found**
Several API routes still use the old authentication pattern instead of `requireAuthAPI()`:

```typescript
// Old pattern (5 lines):
const supabase = createClient(await cookies());
const { data: auth } = await supabase.auth.getUser();
const user = auth.user;
if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

### **Routes That Need Refactoring**

1. **Quest APIs (4 routes):**
   - ✅ `app/api/quests/generate/route.ts` - ALREADY DONE
   - ✅ `app/api/quests/complete/route.ts` - ALREADY DONE
   - ❌ `app/api/quests/accept/route.ts` - **NEEDS REFACTORING**
   - ❌ `app/api/quests/cancel/route.ts` - **NEEDS REFACTORING**
   - ❌ `app/api/quests/reroll/route.ts` - **NEEDS REFACTORING**

2. **Tavern APIs (2 routes):**
   - ✅ `app/api/tavern/generate/route.ts` - ALREADY DONE
   - ✅ `app/api/tavern/recruit/route.ts` - ALREADY DONE
   - ✅ `app/api/tavern/reroll/route.ts` - ALREADY DONE
   - ❌ `app/api/tavern/next/route.ts` - **NEEDS REFACTORING**
   - ❌ `app/api/tavern/chat/route.ts` - **NEEDS REFACTORING**

3. **Gladiator APIs (1 route):**
   - ❌ `app/api/gladiator/chat/route.ts` - **NEEDS REFACTORING**

4. **User APIs (1 route):**
   - ❌ `app/api/user/favorite-server/route.ts` (GET & POST) - **NEEDS REFACTORING**

### **Impact**
- **Routes to refactor:** 8 routes (9 endpoints)
- **Lines per endpoint:** ~4 lines
- **Total lines to eliminate:** ~36 lines

### **Recommended Action**
Refactor these 8 routes to use `requireAuthAPI()` for consistency.

---

## 🟡 MEDIUM PRIORITY - Request Body Parsing Pattern

### **Pattern Found**
Many API routes have duplicate request body parsing logic:

```typescript
const body = await req.json().catch(() => ({}));
const fieldA = typeof body?.fieldA === 'string' ? body.fieldA.trim() : null;
const fieldB = typeof body?.fieldB === 'string' ? body.fieldB.trim() : null;
const locale = typeof body?.locale === 'string' ? body.locale : 'en';

if (!fieldA || !fieldB) {
  return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
}
```

### **Occurrences**
- 15+ API routes have this pattern
- Each route has 5-10 lines of similar parsing logic

### **Impact**
- **Duplicate lines:** ~7 lines × 15 files = **105 lines**

### **Recommended Solution**

Create `lib/api/request.ts`:

```typescript
import { NextResponse } from "next/server";

/**
 * Parse and validate request body fields
 */
export async function parseRequestBody<T extends Record<string, unknown>>(
  req: Request,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array';
      required?: boolean;
      default?: T[K];
    };
  }
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json().catch(() => ({}));
    const result: Partial<T> = {};
    const missing: string[] = [];

    for (const [key, config] of Object.entries(schema)) {
      const value = body?.[key];
      
      if (config.type === 'string') {
        const parsed = typeof value === 'string' ? value.trim() : null;
        if (!parsed && config.required) {
          missing.push(key);
        } else {
          result[key as keyof T] = (parsed || config.default || null) as T[keyof T];
        }
      }
      // ... handle other types
    }

    if (missing.length > 0) {
      return {
        data: null,
        error: NextResponse.json(
          { error: "missing_fields", fields: missing },
          { status: 400 }
        ),
      };
    }

    return { data: result as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "invalid_request_body" },
        { status: 400 }
      ),
    };
  }
}
```

**Usage:**
```typescript
const { data, error } = await parseRequestBody(req, {
  ludusId: { type: 'string', required: true },
  locale: { type: 'string', default: 'en' },
});

if (error) return error;

// data.ludusId and data.locale are now typed and validated
```

---

## 🟡 MEDIUM PRIORITY - Time Formatting Functions

### **Pattern Found**
Multiple components have duplicate time formatting logic:

```typescript
// Pattern 1: Format seconds as MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Pattern 2: Format queue time (relative)
const formatQueueTime = (queuedAt: string) => {
  const now = new Date();
  const queued = new Date(queuedAt);
  const diffMs = now.getTime() - queued.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  // ... more logic
};

// Pattern 3: Format timestamp
function formatTime(value: string | undefined) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
```

### **Occurrences**
- `app/components/combat/CombatStats.tsx`
- `app/[locale]/arena/[slug]/MatchAcceptancePanel.tsx`
- `app/[locale]/arena/[slug]/QueueStatus.tsx`
- `app/[locale]/arena/[slug]/ActiveMatchPanel.tsx`
- `app/[locale]/quests/components/QuestOngoingComponent.tsx`

### **Impact**
- **Duplicate lines:** ~10 lines × 5 files = **50 lines**

### **Recommended Solution**

Create `lib/utils/time.ts`:

```typescript
/**
 * Format seconds as MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format relative time (e.g., "5 mins ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const then = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
}

/**
 * Format timestamp as HH:MM
 */
export function formatTimestamp(value: string | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
```

---

## 🟢 LOW PRIORITY - Nested Try-Catch in Debug Endpoint

### **Pattern Found**
`app/api/debug/acceptances/route.ts` has nested try-catch blocks:

```typescript
export async function GET(req: Request) {
  try {
    const { supabase } = await requireAuthAPI();
    // ... code
    try {
      // Inner try-catch
      // ... more code
    } catch (error) {
      // Inner error handling
    }
  } catch (error) {
    // Outer error handling
  }
}
```

### **Impact**
- **1 file** with nested try-catch
- Minor code smell, but not critical

### **Recommended Action**
Flatten the try-catch structure for better readability.

---

## Summary of Remaining Opportunities

| Priority | Pattern | Files | Lines | Recommended Action |
|----------|---------|-------|-------|-------------------|
| 🔴 HIGH | Old Auth Pattern | 8 routes | 36 | **Refactor** - Use `requireAuthAPI()` |
| 🟡 MEDIUM | Request Body Parsing | 15+ | 105 | **Consider** - Create parsing helper |
| 🟡 MEDIUM | Time Formatting | 5 | 50 | **Consider** - Create time utils |
| 🟢 LOW | Nested Try-Catch | 1 | 5 | **Optional** - Flatten structure |

---

## Recommended Next Steps

### Phase 6: Complete Auth Refactoring
1. Refactor remaining 8 API routes to use `requireAuthAPI()`
2. **Estimated impact:** Eliminate 36 lines, achieve 100% auth consistency

### Phase 7: Request Body Parsing (Optional)
1. Create `lib/api/request.ts` with parsing helpers
2. Refactor 15+ API routes to use helpers
3. **Estimated impact:** Eliminate 105 lines, standardize validation

### Phase 8: Time Utilities (Optional)
1. Create `lib/utils/time.ts` with formatting functions
2. Refactor 5 components to use utilities
3. **Estimated impact:** Eliminate 50 lines, centralize time logic

---

## Total Potential Impact

- **Already eliminated:** 702 lines ✅
- **Phase 6 (Complete Auth):** 36 lines
- **Phase 7 (Request Parsing):** 105 lines (optional)
- **Phase 8 (Time Utils):** 50 lines (optional)
- **Grand Total:** Up to **893 lines** of duplicate code could be eliminated

---

## Conclusion

The codebase has already been significantly improved with 702 lines eliminated. The remaining opportunities are:

1. **High Priority:** Complete auth refactoring (36 lines) - Should be done for consistency
2. **Medium Priority:** Request parsing (105 lines) and time utils (50 lines) - Nice to have
3. **Low Priority:** Minor code smells - Can be addressed as needed

**Recommendation:** Complete Phase 6 (auth refactoring) to achieve 100% consistency across all API routes.

