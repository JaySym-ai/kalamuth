# Tavern Page Intermittent Error Fix

## Issue Description

Users were intermittently seeing an error page when navigating to `/fr/tavern` with the message:
- **French**: "Une erreur s'est produite. Veuillez réessayer." with button "Retour au Tableau de Bord"
- **English**: "An error occurred. Please try again." with button "Back to Dashboard"

## Root Causes Identified

### 1. **Wrong Column Name in SELECT Query** ⚠️ **PRIMARY ISSUE**
- The `GLADIATOR_SELECT_FIELDS` constant was using `current_health` (snake_case)
- The actual database column is `currentHealth` (camelCase)
- Supabase was returning an empty error object `{}` when trying to select a non-existent column
- This caused the query to fail silently and return an empty array

### 2. **Missing Error Boundary**
- No `error.tsx` file existed in `app/[locale]/` to catch rendering errors
- When server-side errors occurred, Next.js would show a default error page
- The error message was coming from the TavernClient component's fallback UI

### 3. **Insufficient Error Handling in Repository Functions**
- `getTavernGladiatorsByLudus()` didn't check for database errors
- Only checked if `data` was null, but ignored the `error` field from Supabase
- No try-catch around the `normalizeGladiator()` calls which could throw errors

### 4. **Redirect Error Handling**
- Next.js `redirect()` throws a special error with digest `NEXT_REDIRECT`
- The catch block was catching these redirect errors and re-redirecting
- This could cause infinite redirect loops or unexpected behavior

### 5. **Non-Null Assertion Operator**
- Used `ludusData!` which could cause runtime errors if data was actually null
- TypeScript couldn't catch this potential null reference

## Fixes Applied

### 1. Fixed Column Name in SELECT Query ⭐ **CRITICAL FIX**

**Before:**
```typescript
export const GLADIATOR_SELECT_FIELDS =
  "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, current_health, stats, ...";
```

**After:**
```typescript
export const GLADIATOR_SELECT_FIELDS =
  "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, currentHealth, stats, ...";
```

**Benefits:**
- Matches the actual database column name
- Prevents Supabase query errors
- Allows tavern gladiators to load successfully

**Note:** The `normalizeGladiator` function already handles both `currentHealth` and `current_health` for backward compatibility (line 117 in `lib/gladiator/normalize.ts`).

### 2. Created Error Boundary (`app/[locale]/error.tsx`)

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Provides a user-friendly error page with:
  // - Localized error messages (EN/FR)
  // - "Try Again" button to reset the error
  // - "Back to Dashboard" button for navigation
  // - Error details in development mode
}
```

**Benefits:**
- Catches all unhandled errors in the locale route segment
- Provides consistent, branded error UI
- Allows users to recover without losing their session
- Shows error details in development for debugging

### 3. Improved Repository Error Handling

**Before:**
```typescript
const { data: glads } = await supabase
  .from("tavern_gladiators")
  .select(GLADIATOR_SELECT_FIELDS)
  .eq("ludusId", ludusId)
  .order("createdAt", { ascending: false });

if (!glads) return [];

return glads.map(doc =>
  normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
);
```

**After:**
```typescript
const { data: glads, error } = await supabase
  .from("tavern_gladiators")
  .select(GLADIATOR_SELECT_FIELDS)
  .eq("ludusId", ludusId)
  .order("createdAt", { ascending: false });

if (error) {
  console.error("Error fetching tavern gladiators:", error);
  return [];
}

if (!glads) return [];

try {
  return glads.map(doc =>
    normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
  );
} catch (normalizationError) {
  console.error("Error normalizing tavern gladiators:", normalizationError);
  return [];
}
```

**Benefits:**
- Catches database query errors (like the column name mismatch)
- Catches normalization errors
- Returns empty array instead of crashing
- Logs errors for debugging
- Applied to all repository functions: `getGladiatorsByLudus`, `getTavernGladiatorsByLudus`, `getInitialGladiatorsByLudus`

### 4. Better Redirect Error Handling

**Before:**
```typescript
try {
  ludusData = await getCurrentUserLudusTransformed(user.id);
  
  if (!ludusData) {
    redirect(`/${locale}/server-selection`);
  }

  tavernGladiators = await getTavernGladiatorsByLudus(ludusData.id, locale);
} catch (error) {
  debug_error("Error loading tavern data:", error);
  redirect(`/${locale}/server-selection`);
}
```

**After:**
```typescript
try {
  ludusData = await getCurrentUserLudusTransformed(user.id);
  
  if (!ludusData) {
    debug_error("No ludus found for user, redirecting to server selection");
    redirect(`/${locale}/server-selection`);
  }

  tavernGladiators = await getTavernGladiatorsByLudus(ludusData.id, locale);
  
  if (tavernGladiators.length === 0) {
    debug_error("No tavern gladiators found for ludus:", ludusData.id);
  }
} catch (error) {
  // Check if this is a Next.js redirect error (which is expected)
  const redirectError = error as { digest?: string };
  if (redirectError?.digest?.startsWith("NEXT_REDIRECT")) {
    throw error; // Re-throw redirect errors
  }
  
  debug_error("Error loading tavern data:", error);
  redirect(`/${locale}/server-selection`);
}
```

**Benefits:**
- Doesn't catch and re-redirect Next.js redirect errors
- Logs when no gladiators are found (normal case, but good to track)
- More descriptive error messages

### 5. Removed Non-Null Assertion

**Before:**
```typescript
<TavernClient
  ludus={ludusData!}
  tavernGladiators={tavernGladiators}
  locale={locale}
  translations={{...}}
/>
```

**After:**
```typescript
// This should never happen due to the redirect above, but TypeScript safety
if (!ludusData) {
  redirect(`/${locale}/server-selection`);
}

<TavernClient
  ludus={ludusData}
  tavernGladiators={tavernGladiators}
  locale={locale}
  translations={{...}}
/>
```

**Benefits:**
- Type-safe without assertions
- Explicit null check before rendering
- Clear comment explaining the safety check

## Testing Recommendations

### Manual Testing
1. Navigate to `/fr/tavern` multiple times
2. Refresh the page several times
3. Test with slow network (throttle in DevTools)
4. Test with no tavern gladiators
5. Test with database errors (disconnect network briefly)

### Automated Testing (Playwright)
```typescript
test('tavern page handles errors gracefully', async ({ page }) => {
  // Test error boundary
  await page.route('**/rest/v1/tavern_gladiators*', route => 
    route.abort('failed')
  );
  
  await page.goto('/fr/tavern');
  
  // Should show error page, not crash
  await expect(page.getByText('Une erreur s\'est produite')).toBeVisible();
  await expect(page.getByText('Retour au Tableau de Bord')).toBeVisible();
});
```

## Monitoring

Add these to your monitoring/logging:
1. Track frequency of error boundary triggers
2. Log database query errors from repository functions
3. Monitor redirect loops (multiple redirects in short time)
4. Track empty tavern gladiator arrays (might indicate generation issues)

## Related Files Modified

- ✅ `app/[locale]/error.tsx` - Created error boundary
- ✅ `app/[locale]/tavern/page.tsx` - Improved error handling
- ✅ `lib/gladiator/repository.ts` - Added error checking to all functions

## Prevention

To prevent similar issues in the future:

1. **Always create error.tsx** for route segments
2. **Always check both `data` and `error`** from Supabase queries
3. **Always wrap normalization/transformation** in try-catch
4. **Never use non-null assertions** (`!`) in production code
5. **Always re-throw Next.js redirect errors** (check for `NEXT_REDIRECT` digest)
6. **Log empty results** to distinguish between errors and valid empty states

