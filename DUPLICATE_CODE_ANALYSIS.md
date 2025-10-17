# Duplicate Code Analysis - Remaining Patterns

## Summary

After the recent refactoring that eliminated 485+ lines of duplicate code, I've identified **additional duplicate patterns** that could be refactored for even cleaner code.

---

## 1. ✅ ALREADY FIXED - Server Isolation & Data Transformation
- **Status:** ✅ Complete
- **Lines eliminated:** 485 lines
- **Pages refactored:** 9 pages
- **See:** `CODE_CLEANUP_REFACTORING.md`

---

## 2. 🔴 HIGH PRIORITY - Authentication Pattern

### **Pattern Found**
Almost every page and API route has this duplicated pattern:

```typescript
const supabase = createClient(await cookies());
const { data } = await supabase.auth.getUser();
const user = data.user;
if (!user) redirect(`/${locale}/auth`);
```

### **Occurrences**
- **Pages:** 15+ pages (dashboard, gladiators, quests, tavern, shop, inventory, ludus, arena, etc.)
- **API Routes:** 20+ routes

### **Impact**
- **Duplicate lines:** ~6 lines × 35 files = **210 lines**
- **Maintenance risk:** Auth logic changes require updating 35+ files

### **Recommended Solution**

Create `lib/auth/server.ts`:

```typescript
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Require authentication for a page
 * Returns the authenticated user or redirects to auth page
 */
export async function requireAuth(locale: string) {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  
  if (!user) {
    redirect(`/${locale}/auth`);
  }
  
  return { user, supabase };
}

/**
 * Require authentication for an API route
 * Returns the authenticated user or throws an error
 */
export async function requireAuthAPI() {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  
  if (!user) {
    throw new Error("unauthorized");
  }
  
  return { user, supabase };
}
```

**Usage:**
```typescript
// Before (6 lines):
const supabase = createClient(await cookies());
const { data } = await supabase.auth.getUser();
const user = data.user;
if (!user) redirect(`/${locale}/auth`);

// After (1 line):
const { user, supabase } = await requireAuth(locale);
```

---

## 3. 🟡 MEDIUM PRIORITY - Gladiator Fetching Pattern

### **Pattern Found**
Multiple pages fetch gladiators with the same query pattern:

```typescript
const { data: glads } = await supabase
  .from("gladiators")
  .select("id, name, surname, avatarUrl, birthCity, health, current_health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, ludusId, serverId, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive, rankingPoints")
  .eq("ludusId", ludusId);

if (glads) {
  gladiators = glads.map(doc =>
    normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
  );
}
```

### **Occurrences**
- `app/[locale]/gladiators/page.tsx`
- `app/[locale]/tavern/page.tsx`
- `app/[locale]/initial-gladiators/page.tsx`
- `app/[locale]/arena/[slug]/page.tsx`
- `app/[locale]/gladiator/[id]/page.tsx`

### **Impact**
- **Duplicate lines:** ~10 lines × 5 files = **50 lines**
- **Field list duplicated:** Long select string repeated 5 times

### **Recommended Solution**

Add to `lib/gladiator/repository.ts`:

```typescript
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { normalizeGladiator, type NormalizedGladiator } from "./normalize";

const GLADIATOR_SELECT_FIELDS = "id, name, surname, avatarUrl, birthCity, health, current_health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, ludusId, serverId, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive, rankingPoints";

/**
 * Fetch all gladiators for a ludus
 */
export async function getGladiatorsByLudus(
  ludusId: string,
  locale: string
): Promise<NormalizedGladiator[]> {
  const supabase = createClient(await cookies());
  
  const { data: glads } = await supabase
    .from("gladiators")
    .select(GLADIATOR_SELECT_FIELDS)
    .eq("ludusId", ludusId);

  if (!glads) return [];

  return glads.map(doc =>
    normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
  );
}

/**
 * Fetch a single gladiator by ID
 */
export async function getGladiatorById(
  id: string,
  locale: string
): Promise<NormalizedGladiator | null> {
  const supabase = createClient(await cookies());
  
  const { data: gladiatorData, error } = await supabase
    .from("gladiators")
    .select(GLADIATOR_SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error || !gladiatorData) return null;

  return normalizeGladiator(gladiatorData.id, gladiatorData, locale);
}
```

---

## 4. 🟡 MEDIUM PRIORITY - API Error Handling Pattern

### **Pattern Found**
API routes have similar error handling:

```typescript
try {
  // ... logic
} catch (error) {
  debug_error("Error message:", error);
  return NextResponse.json({ error: "error_code" }, { status: 500 });
}
```

### **Occurrences**
- 20+ API routes

### **Impact**
- **Duplicate lines:** ~5 lines × 20 files = **100 lines**

### **Recommended Solution**

Create `lib/api/errors.ts`:

```typescript
import { NextResponse } from "next/server";
import { debug_error } from "@/utils/debug";

export function handleAPIError(error: unknown, context: string) {
  debug_error(`${context}:`, error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: "internal_error" },
    { status: 500 }
  );
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function notFoundResponse(resource: string) {
  return NextResponse.json({ error: `${resource}_not_found` }, { status: 404 });
}
```

---

## 5. 🟢 LOW PRIORITY - Translation Object Construction

### **Pattern Found**
Pages construct large translation objects:

```typescript
translations={{
  title: t("title"),
  subtitle: t("subtitle"),
  backToDashboard: t("backToDashboard"),
  // ... 20+ more lines
}}
```

### **Occurrences**
- 10+ pages

### **Impact**
- **Duplicate lines:** ~30 lines × 10 files = **300 lines**
- **Verbose:** Makes components harder to read

### **Recommended Solution**

This is actually **acceptable duplication** because:
1. Each page needs different translations
2. It's explicit and type-safe
3. Refactoring would add complexity without much benefit

**Recommendation:** Keep as-is unless it becomes a maintenance burden.

---

## 6. 🟢 LOW PRIORITY - Supabase Client Creation

### **Pattern Found**
```typescript
const supabase = createClient(await cookies());
```

### **Occurrences**
- 40+ files

### **Impact**
- **Duplicate lines:** 1 line × 40 files = **40 lines**
- **Low impact:** Only 1 line, already very concise

### **Recommended Solution**

Could be combined with auth helper (see #2 above). Otherwise, keep as-is.

---

## Summary of Remaining Duplications

| Priority | Pattern | Files | Lines | Recommended Action |
|----------|---------|-------|-------|-------------------|
| 🔴 HIGH | Authentication | 35+ | 210 | **Refactor** - Create `requireAuth()` helpers |
| 🟡 MEDIUM | Gladiator Fetching | 5 | 50 | **Refactor** - Create repository functions |
| 🟡 MEDIUM | API Error Handling | 20+ | 100 | **Refactor** - Create error helpers |
| 🟢 LOW | Translation Objects | 10+ | 300 | **Keep** - Acceptable duplication |
| 🟢 LOW | Supabase Client | 40+ | 40 | **Keep** - Already concise |

---

## Recommended Next Steps

### Phase 3: Authentication Refactoring
1. Create `lib/auth/server.ts` with `requireAuth()` and `requireAuthAPI()`
2. Refactor all pages to use `requireAuth(locale)`
3. Refactor all API routes to use `requireAuthAPI()`
4. **Estimated impact:** Eliminate 210 lines, improve consistency

### Phase 4: Gladiator Repository
1. Create `lib/gladiator/repository.ts`
2. Add `getGladiatorsByLudus()` and `getGladiatorById()`
3. Refactor 5 pages to use new functions
4. **Estimated impact:** Eliminate 50 lines, centralize field selection

### Phase 5: API Error Handling
1. Create `lib/api/errors.ts` with error helpers
2. Refactor 20+ API routes to use helpers
3. **Estimated impact:** Eliminate 100 lines, standardize error responses

---

## Total Potential Impact

- **Already eliminated:** 485 lines ✅
- **Phase 3 (Auth):** 210 lines
- **Phase 4 (Gladiators):** 50 lines
- **Phase 5 (API Errors):** 100 lines
- **Grand Total:** **845 lines of duplicate code** could be eliminated

---

## Conclusion

The codebase has already been significantly improved with 485 lines eliminated. The remaining duplications are:

1. **High Priority:** Authentication pattern (210 lines) - Should be refactored
2. **Medium Priority:** Gladiator fetching (50 lines) and API errors (100 lines) - Nice to have
3. **Low Priority:** Translation objects and client creation - Acceptable as-is

**Recommendation:** Proceed with Phase 3 (Authentication refactoring) for maximum impact with minimal risk.

