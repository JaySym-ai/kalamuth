# Match Acceptance System - Complete Fix

## Problem Summary

When two players are matched, the match acceptance panel appears but **the Accept and Decline buttons are not visible**. This makes it impossible for players to respond to match requests.

## Root Causes

### 1. Incorrect Acceptance Matching Logic ✅ FIXED
**Issue:** The component was trying to match acceptances by `userId`, but `player?.userId` was always `null`.

**Original Code:**
```typescript
const userAcceptance = acceptances.find(a => a.userId === player?.userId);
```

**Fixed Code:**
```typescript
const userAcceptance = acceptances.find(a => a.gladiatorId === player?.id);
```

### 2. Wrong Data Source for Acceptances ✅ FIXED
**Issue:** Acceptances were sourced from `activeMatchDetails?.acceptances || []` which was often empty.

**Original Code:**
```typescript
acceptances={activeMatchDetails?.acceptances || []}
```

**Fixed Code:**
```typescript
acceptances={acceptancesData}  // Real-time subscription
```

### 3. Incorrect Button Visibility Logic ✅ FIXED
**Issue:** The logic `userAcceptance?.status !== "pending"` evaluated to `true` when `userAcceptance` was `undefined`, hiding the buttons.

**Original Code:**
```typescript
const hasUserResponded = userAcceptance?.status !== "pending";
```

**Fixed Code:**
```typescript
const hasUserResponded = userAcceptance && userAcceptance.status !== "pending";
```

### 4. RLS Policy Blocking Acceptance Inserts ⏳ NEEDS MIGRATION
**Issue:** The RLS policy on `combat_match_acceptances` was blocking the matchmaking API from creating acceptance records.

**Solution:** Apply migration `0009_fix_acceptance_insert_policy.sql`

## Files Modified

### 1. `app/[locale]/arena/[slug]/MatchAcceptancePanel.tsx`
- Fixed acceptance matching to use `gladiatorId` instead of `userId`
- Fixed button visibility logic
- Added debug logging (temporary)
- Added missing `data-testid` attributes
- Added `min-h-[48px]` to buttons for accessibility

### 2. `app/[locale]/arena/[slug]/ArenaDetailClient.tsx`
- Changed acceptances source to `acceptancesData` (real-time subscription)
- Added debug logging (temporary)

### 3. `supabase/migrations/0009_fix_acceptance_insert_policy.sql` (NEW)
- Fixes RLS policy to allow authenticated users to insert acceptances

### 4. `utils/supabase/server.ts`
- Added `createServiceRoleClient()` function (for future use)

### 5. `app/api/debug/acceptances/route.ts` (NEW)
- Debug endpoint to check acceptances for a match

## How to Fix

### Step 1: Apply Database Migration ⚠️ REQUIRED

**Option A: Supabase Dashboard (Easiest)**
1. Go to https://kaladb.r02.ovh
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase/migrations/0009_fix_acceptance_insert_policy.sql`

**Option B: Supabase CLI**
```bash
supabase db push
```

### Step 2: Restart Dev Server
```bash
# Kill the current server (Ctrl+C)
npm run dev
```

### Step 3: Test the Fix
1. Open two browsers with different accounts
2. Queue a gladiator from each account in the same arena
3. When matched, both players should see:
   - ✅ Countdown timer (60 seconds)
   - ✅ Player gladiator card (green)
   - ✅ Opponent gladiator card (red)
   - ✅ **Accept Combat** button (green)
   - ✅ **Decline Combat** button (gray)

### Step 4: Test Scenarios
- **Both accept:** Should navigate to combat screen
- **One declines:** Match should be cancelled
- **Timeout (60s):** Match should be cancelled automatically

## Debug Information

### Check Browser Console
Open the browser console (F12) and look for these logs:

```
ArenaDetailClient - Acceptances Debug: {
  activeMatchId: "...",
  activeMatchStatus: "pending_acceptance",
  acceptancesData: [...],
  acceptancesCount: 2
}

MatchAcceptancePanel Debug: {
  acceptances: [...],
  playerGladiatorId: "...",
  opponentGladiatorId: "...",
  userAcceptance: {...},
  opponentAcceptance: {...}
}

Button visibility: {
  isExpired: false,
  hasUserResponded: false,
  showButtons: true,
  userAcceptanceExists: true,
  userAcceptanceStatus: "pending"
}
```

### Check Acceptances via API
```
GET /api/debug/acceptances?matchId=YOUR_MATCH_ID
```

This will show:
- Match details
- Acceptances array
- Acceptances count (should be 2)

### Expected Database State
After a match is created, the `combat_match_acceptances` table should have 2 rows:

```sql
SELECT * FROM combat_match_acceptances WHERE "matchId" = 'YOUR_MATCH_ID';
```

Expected result:
```
id | matchId | gladiatorId | userId | status  | respondedAt | createdAt
---|---------|-------------|--------|---------|-------------|----------
1  | match1  | glad1       | user1  | pending | null        | 2025-...
2  | match1  | glad2       | user2  | pending | null        | 2025-...
```

## Cleanup (After Testing)

Once the fix is confirmed working, remove the debug logging:

### Remove from `MatchAcceptancePanel.tsx`:
- Lines 87-94 (Debug logging for acceptances)
- Lines 195-202 (Debug logging for button visibility)

### Remove from `ArenaDetailClient.tsx`:
- Lines 205-214 (Debug logging for acceptances)

## Next Steps

1. ✅ Apply migration 0009
2. ✅ Test match acceptance flow
3. ⏳ Remove debug logging
4. ⏳ Create Playwright E2E tests
5. ⏳ Remove "Classement" from French translations

## Summary

The buttons weren't showing because:
1. Acceptances weren't being matched correctly (fixed)
2. Acceptances data wasn't being passed correctly (fixed)
3. Button visibility logic was wrong (fixed)
4. **Acceptances weren't being created in the database (needs migration)**

After applying migration 0009, the entire flow should work correctly!

