# Debug Guide - Match Acceptance Not Working

## Current Issue

- ✅ Realtime is enabled
- ✅ Your acceptance shows immediately
- ❌ Opponent's acceptance doesn't show
- ❌ Match doesn't start when both accept

## Debug Steps

### Step 1: Open Browser Console

Open the browser console (F12) on **both** accounts.

### Step 2: Queue Two Gladiators

Queue a gladiator from each account in the same arena.

### Step 3: When Match Appears, Check Console Logs

You should see these logs on **both** accounts:

#### Log 1: Acceptances from Realtime
```
📡 ArenaDetailClient - Acceptances from realtime: {
  matchId: "...",
  acceptancesCount: 2,  // ← Should be 2!
  acceptances: [
    { id: "...", gladiatorId: "...", status: "pending" },
    { id: "...", gladiatorId: "...", status: "pending" }
  ]
}
```

**Check:**
- Is `acceptancesCount` equal to 2?
- Are there 2 acceptances in the array?
- Do the `gladiatorId` values match your gladiators?

#### Log 2: Acceptances Updated
```
🔄 Acceptances updated: {
  total: 2,  // ← Should be 2!
  player: { id: "...", name: "...", surname: "..." },
  opponent: { id: "...", name: "...", surname: "..." },  // ← Should NOT be null!
  userAcceptance: { id: "...", gladiatorId: "...", status: "pending" },
  opponentAcceptance: { id: "...", gladiatorId: "...", status: "pending" },  // ← Should NOT be null!
  allAcceptances: [...]
}
```

**Check:**
- Is `total` equal to 2?
- Is `opponent` null or does it have data?
- Is `opponentAcceptance` null or does it have data?
- Does `player.id` match `userAcceptance.gladiatorId`?
- Does `opponent.id` match `opponentAcceptance.gladiatorId`?

### Step 4: User A Clicks Accept

On **User A's** console, you should see:

```
🔄 Acceptances updated: {
  userAcceptance: { status: "accepted" },  // ← Changed to "accepted"
  opponentAcceptance: { status: "pending" }
}

🚀 Navigation check: {
  userStatus: "accepted",
  opponentStatus: "pending",
  bothAccepted: false
}
```

On **User B's** console, you should see:

```
📡 ArenaDetailClient - Acceptances from realtime: {
  acceptances: [
    { gladiatorId: "...", status: "accepted" },  // ← User A's acceptance updated!
    { gladiatorId: "...", status: "pending" }
  ]
}

🔄 Acceptances updated: {
  userAcceptance: { status: "pending" },
  opponentAcceptance: { status: "accepted" }  // ← Should show "accepted"!
}
```

**Check:**
- Does User B see the realtime update?
- Does User B's `opponentAcceptance` change to "accepted"?

### Step 5: User B Clicks Accept

On **both** consoles, you should see:

```
🔄 Acceptances updated: {
  userAcceptance: { status: "accepted" },
  opponentAcceptance: { status: "accepted" }
}

🚀 Navigation check: {
  userStatus: "accepted",
  opponentStatus: "accepted",
  bothAccepted: true  // ← Should be true!
}

✅ Both accepted! Navigating to combat in 1.5s...

🎯 Navigating to: /en/combat/...
```

## Common Issues and Solutions

### Issue 1: `acceptancesCount: 0`

**Problem:** Acceptances are not being created in the database.

**Solution:** Check if migration 0009 was applied:
```sql
SELECT * FROM pg_policies WHERE tablename = 'combat_match_acceptances';
```

Should show a policy named "Authenticated users can insert acceptances".

### Issue 2: `opponent: null`

**Problem:** Opponent data is not being fetched.

**Solution:** Check the opponent fetching logic. Add this log to see if it's running:
```typescript
// In ArenaDetailClient.tsx, inside the fetchOpponent useEffect
console.log('🔍 Fetching opponent:', opponentId);
```

### Issue 3: `opponentAcceptance: null`

**Problem:** Opponent's gladiator ID doesn't match any acceptance.

**Solution:** Check if the gladiator IDs match:
```
player.id === userAcceptance.gladiatorId  // Should be true
opponent.id === opponentAcceptance.gladiatorId  // Should be true
```

If `opponent.id` doesn't match, the opponent data is wrong.

### Issue 4: Realtime updates not received

**Problem:** User B doesn't see User A's acceptance update.

**Solution:** 
1. Check if realtime is enabled:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Should include `combat_match_acceptances`.

2. Check browser console for WebSocket errors
3. Check if the Supabase realtime channel is subscribed

### Issue 5: Navigation doesn't happen

**Problem:** Both acceptances are "accepted" but no navigation.

**Solution:** Check the navigation log:
```
🚀 Navigation check: {
  bothAccepted: true  // ← Should be true
}
```

If `bothAccepted` is false, check the statuses:
- `userAcceptance?.status === "accepted"` should be true
- `opponentAcceptance?.status === "accepted"` should be true

## What to Share

If the issue persists, share these logs from the console:

1. **Initial state (when match appears):**
   - 📡 ArenaDetailClient - Acceptances from realtime
   - 🔄 Acceptances updated

2. **After User A accepts:**
   - User A's console: 🔄 Acceptances updated
   - User B's console: 📡 ArenaDetailClient - Acceptances from realtime

3. **After User B accepts:**
   - Both consoles: 🚀 Navigation check

This will help identify exactly where the issue is.

## Quick Test

Run this in the browser console to check the database directly:

```javascript
// Get the match ID from the URL or console logs
const matchId = "YOUR_MATCH_ID";

// Fetch acceptances
fetch(`/api/debug/acceptances?matchId=${matchId}`)
  .then(r => r.json())
  .then(data => console.log('Debug API:', data));
```

This will show:
- The match details
- All acceptances for the match
- Your user ID

Check if:
- There are 2 acceptances
- The gladiator IDs match your gladiators
- The statuses are correct

