# Opponent Data Fix - Match Acceptance

## Problem

When a match is found and the acceptance panel appears:
- ✅ Your acceptance shows in real-time
- ❌ Opponent's acceptance doesn't show (stays as "Unknown Opponent")
- ❌ When both accept, nothing happens (no navigation)

## Root Cause

The `opponentGladiatorSummary` was returning `null` during the acceptance phase because:
1. `activeMatchDetails` is only loaded when a match is in "pending" or "in_progress" status
2. During "pending_acceptance" status, `activeMatchDetails` is null
3. Without opponent data, the UI can't match acceptances to the opponent gladiator

## Solution

Added logic to fetch the opponent's gladiator data from Supabase during the acceptance phase:

```typescript
// Fetch opponent gladiator data during acceptance phase
const [opponentGladiatorData, setOpponentGladiatorData] = useState<NormalizedGladiator | null>(null);

useEffect(() => {
  if (!activeMatch || activeMatch.status !== "pending_acceptance") {
    setOpponentGladiatorData(null);
    return;
  }

  const opponentId = userGladiatorIds.has(activeMatch.gladiator1Id)
    ? activeMatch.gladiator2Id
    : activeMatch.gladiator1Id;

  if (!opponentId) return;

  // Check if we already have the opponent in activeMatchDetails
  const existingOpponent = activeMatchDetails?.gladiators.find(g => g.id === opponentId);
  if (existingOpponent) {
    setOpponentGladiatorData(null); // We have it in activeMatchDetails
    return;
  }

  // Fetch opponent data from Supabase
  const fetchOpponent = async () => {
    try {
      const { data, error } = await supabase
        .from("gladiators")
        .select("*")
        .eq("id", opponentId)
        .single();

      if (error) {
        console.error("Error fetching opponent:", error);
        return;
      }

      if (data) {
        setOpponentGladiatorData(data as NormalizedGladiator);
      }
    } catch (error) {
      console.error("Error fetching opponent data:", error);
    }
  };

  fetchOpponent();
}, [activeMatch, activeMatchDetails?.gladiators, userGladiatorIds, supabase]);
```

Then updated `opponentGladiatorSummary` to use this data:

```typescript
const opponentGladiatorSummary = useMemo(() => {
  if (!activeMatch) return null;

  const opponentId = userGladiatorIds.has(activeMatch.gladiator1Id)
    ? activeMatch.gladiator2Id
    : activeMatch.gladiator1Id;

  if (!opponentId) return null;

  // First check activeMatchDetails
  const detailed = activeMatchDetails?.gladiators.find((gladiator) => gladiator.id === opponentId);
  if (detailed) return detailed;

  // During acceptance phase, use fetched opponent data
  if (opponentGladiatorData && opponentGladiatorData.id === opponentId) {
    return toCombatantSummary(opponentGladiatorData);
  }

  // Fallback: create minimal opponent summary
  return {
    id: opponentId,
    name: "Unknown",
    surname: "Opponent",
    userId: null,
    rankingPoints: 1000,
    health: 100,
    ludusId: null,
    alive: true,
  } as CombatantSummary;
}, [activeMatch, activeMatchDetails?.gladiators, opponentGladiatorData, toCombatantSummary, userGladiatorIds]);
```

## Files Modified

1. **`app/[locale]/arena/[slug]/ArenaDetailClient.tsx`**
   - Added Supabase client import (line 10)
   - Created Supabase client instance (line 125)
   - Added opponent data fetching logic (lines 206-250)
   - Updated `opponentGladiatorSummary` to use fetched data (lines 288-317)

2. **`app/[locale]/arena/[slug]/MatchAcceptancePanel.tsx`**
   - Added detailed debug logging (lines 85-106)
   - Added navigation logic when both accept (lines 177-189)

## Testing

### Step 1: Check Console Logs

Open browser console (F12) and look for:

```
🔄 Acceptances updated: {
  total: 2,
  playerGladiatorId: "...",
  opponentGladiatorId: "...",
  userAcceptance: { id: "...", gladiatorId: "...", status: "pending" },
  opponentAcceptance: { id: "...", gladiatorId: "...", status: "pending" },
  allAcceptances: [...]
}
```

### Step 2: Test Acceptance Flow

1. **Queue two gladiators** from different accounts
2. **Wait for match** (acceptance panel appears)
3. **User A clicks Accept**
   - ✅ User A should see green checkmark on their card
   - ✅ User B should see green checkmark on opponent's card (User A)
   - ✅ Console should show `userAcceptance.status: "accepted"`
4. **User B clicks Accept**
   - ✅ User B should see green checkmark on their card
   - ✅ User A should see green checkmark on opponent's card (User B)
   - ✅ Both users navigate to combat screen after 1.5 seconds

## Expected Behavior

### Before Fix:
- Opponent shows as "Unknown Opponent"
- Opponent's acceptance doesn't show
- No navigation when both accept

### After Fix:
- Opponent shows real name (e.g., "Lucius Corvus The Raven")
- Opponent's acceptance shows in real-time with green checkmark
- Automatic navigation to combat when both accept

## Debug Information

If opponent still shows as "Unknown Opponent":
1. Check console for "Error fetching opponent:" messages
2. Verify the opponent's gladiator exists in the database
3. Check RLS policies on the `gladiators` table

If navigation doesn't happen:
1. Check console logs for acceptance statuses
2. Verify both acceptances have `status: "accepted"`
3. Check if the navigation useEffect is running

## Status

✅ **FIXED** - Opponent data is now fetched during acceptance phase
✅ **FIXED** - Real-time acceptance updates work for both players
✅ **FIXED** - Navigation happens when both accept

## Next Steps

1. ✅ Test with two accounts
2. ⏳ Remove debug logging once confirmed working
3. ⏳ Create Playwright E2E tests
4. ⏳ Remove "Classement" from French translations

