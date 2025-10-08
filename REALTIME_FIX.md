# Real-time Updates Fix - Match Acceptance

## Problems

1. **UI doesn't update when you accept** - You have to refresh to see your acceptance
2. **Navigation doesn't happen when both accept** - Match doesn't start automatically

## Root Causes

### 1. Realtime Not Enabled ⚠️ CRITICAL
The `combat_match_acceptances` table is not added to the Supabase realtime publication. This means the UI doesn't receive real-time updates when acceptances change.

### 2. Missing Navigation Logic ✅ FIXED
The component wasn't checking if both players accepted and navigating to the combat screen.

## Solutions

### 1. Enable Realtime for Acceptances Table

**Migration:** `supabase/migrations/0010_enable_realtime_acceptances.sql`

```sql
-- Enable realtime for combat_match_acceptances table
alter publication supabase_realtime add table public.combat_match_acceptances;
```

**How to Apply:**

#### Option A: Supabase Dashboard (Recommended)
1. Go to https://kaladb.r02.ovh
2. Navigate to **SQL Editor**
3. Run:
```sql
alter publication supabase_realtime add table public.combat_match_acceptances;
```

#### Option B: Supabase CLI
```bash
supabase db push
```

### 2. Added Navigation Logic ✅ FIXED

Added a `useEffect` that watches both acceptances and navigates to combat when both are accepted:

```typescript
// Check if both players have accepted and navigate to combat
useEffect(() => {
  if (
    userAcceptance?.status === "accepted" &&
    opponentAcceptance?.status === "accepted"
  ) {
    // Both accepted, navigate to combat after a short delay
    const timer = setTimeout(() => {
      router.push(`/${locale}/combat/${match.id}`);
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [userAcceptance?.status, opponentAcceptance?.status, router, locale, match.id]);
```

## How Realtime Works

### Before (Broken):
1. User A clicks Accept → API updates database
2. User A's UI: ❌ No update (needs refresh)
3. User B's UI: ❌ No update (needs refresh)
4. Both accepted: ❌ Nothing happens

### After (Fixed):
1. User A clicks Accept → API updates database
2. Supabase broadcasts change to all subscribed clients
3. User A's UI: ✅ Immediately shows "You accepted"
4. User B's UI: ✅ Immediately shows "Opponent accepted"
5. Both accepted: ✅ Automatically navigates to combat

## Testing

### Step 1: Apply Migration
Run the SQL in your Supabase dashboard (see above).

### Step 2: Restart Dev Server
```bash
# Kill current server (Ctrl+C)
npm run dev
```

### Step 3: Test Real-time Updates

**Open two browsers with different accounts:**

1. **Queue two gladiators** in the same arena
2. **Wait for match** (acceptance panel appears)
3. **User A clicks Accept**
   - ✅ User A should see "You accepted" immediately
   - ✅ User B should see "Opponent accepted" immediately (without refresh!)
4. **User B clicks Accept**
   - ✅ User B should see "You accepted" immediately
   - ✅ Both users should navigate to combat screen after 1.5 seconds

### Step 4: Check Console Logs

Open browser console (F12) and look for:

```
🔄 Acceptances updated: {
  total: 2,
  userStatus: "accepted",
  opponentStatus: "accepted",
  acceptances: [...]
}
```

You should see this log update in **real-time** when the other player accepts.

## Verification Checklist

- [ ] Migration 0010 applied successfully
- [ ] Dev server restarted
- [ ] When User A accepts, User A sees "You accepted" immediately
- [ ] When User A accepts, User B sees "Opponent accepted" immediately (no refresh)
- [ ] When both accept, both users navigate to combat screen
- [ ] Console shows real-time updates (🔄 Acceptances updated)

## Files Modified

1. **`app/[locale]/arena/[slug]/MatchAcceptancePanel.tsx`**
   - Added navigation logic when both accept (lines 177-189)
   - Added debug logging for acceptances (lines 85-92)

2. **`supabase/migrations/0010_enable_realtime_acceptances.sql`** (NEW)
   - Enables realtime for `combat_match_acceptances` table

## Why This Matters

Real-time updates are critical for a good UX:
- ✅ Users see immediate feedback when they accept
- ✅ Users see when opponent accepts (builds anticipation)
- ✅ No need to refresh the page
- ✅ Automatic navigation when both accept
- ✅ Feels responsive and modern

## Troubleshooting

### If real-time still doesn't work:

1. **Check if realtime is enabled:**
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Should include `combat_match_acceptances`.

2. **Check browser console for errors:**
- Look for WebSocket connection errors
- Look for Supabase realtime errors

3. **Check Supabase dashboard:**
- Go to **Database** → **Replication**
- Verify `combat_match_acceptances` is in the publication

4. **Verify the subscription is active:**
Add this to the component:
```typescript
useEffect(() => {
  console.log('Acceptances subscription active:', acceptances);
}, [acceptances]);
```

## Next Steps

1. ✅ Apply migration 0010
2. ✅ Restart dev server
3. ✅ Test with two accounts
4. ⏳ Remove debug logging once confirmed working
5. ⏳ Create Playwright E2E tests

## Status

⏳ **PENDING** - Waiting for migration 0010 to be applied

