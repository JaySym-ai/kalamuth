# Timeout Queue Removal Fix

## Problem

When the match acceptance timeout expires (60 seconds), both gladiators should be removed from the queue, but they were being re-queued instead.

## Root Cause

The timeout endpoint (`/api/combat/match/[matchId]/timeout`) had logic to re-queue gladiators who accepted, but it should remove **both** gladiators from the queue regardless of their acceptance status.

### Original Logic (Incorrect):
```typescript
// Re-queue gladiators who are still waiting (those who accepted)
if (acceptances) {
  const acceptedGladiators = acceptances
    .filter(a => a.status === "accepted")
    .map(a => a.gladiatorId);

  if (acceptedGladiators.length > 0) {
    // Reset them to waiting status
    await supabase
      .from("combat_queue")
      .update({ 
        status: "waiting",
        matchId: null
      })
      .in("id", queueEntries.map(e => e.id));
  }
}
```

This logic:
- ❌ Re-queued gladiators who accepted
- ❌ Left gladiators who didn't respond in the queue
- ❌ Didn't remove anyone from the queue

## Solution

Changed the logic to **remove both gladiators** from the queue when timeout occurs:

```typescript
// Remove both gladiators from the queue
// When timeout happens, both players should be removed from queue
const gladiatorIds = [match.gladiator1Id, match.gladiator2Id];

const { error: queueDeleteError } = await supabase
  .from("combat_queue")
  .delete()
  .in("gladiatorId", gladiatorIds)
  .eq("matchId", matchId);

if (queueDeleteError) {
  console.error("Error removing gladiators from queue:", queueDeleteError);
}
```

## Expected Behavior

### Before Fix:
1. Match found → Both gladiators matched
2. 60 seconds pass without both accepting
3. Match cancelled
4. ❌ Gladiators who accepted: re-queued
5. ❌ Gladiators who didn't respond: stayed in queue

### After Fix:
1. Match found → Both gladiators matched
2. 60 seconds pass without both accepting
3. Match cancelled
4. ✅ **Both gladiators removed from queue**
5. ✅ Players can manually re-queue if they want

## Files Modified

1. **`app/api/combat/match/[matchId]/timeout/route.ts`**
   - Changed re-queue logic to delete logic (lines 57-79)
   - Now removes both gladiators from queue on timeout

2. **`app/[locale]/arena/[slug]/MatchAcceptancePanel.tsx`**
   - Moved `checkTimeout` callback before the useEffect that uses it (lines 49-61)
   - Fixed dependency array to include `checkTimeout`

## Testing

### Step 1: Queue Two Gladiators

Queue a gladiator from each account in the same arena.

### Step 2: Wait for Match

When the match appears, the acceptance panel should show with a 60-second countdown.

### Step 3: Let It Timeout

**Don't click Accept or Decline.** Just wait for the countdown to reach 00:00.

### Step 4: Verify Removal

After timeout:
- ✅ Match should be cancelled
- ✅ Error message should appear: "Acceptance timeout"
- ✅ **Both gladiators should be removed from the queue**
- ✅ Queue status should show "Not in queue"

### Step 5: Check Database

Run this query to verify:
```sql
SELECT * FROM combat_queue 
WHERE "gladiatorId" IN ('gladiator1_id', 'gladiator2_id');
```

Should return **0 rows** (both removed).

## Alternative Scenarios

### Scenario 1: One Player Accepts, Other Doesn't

1. User A clicks Accept
2. User B doesn't respond
3. Timeout occurs
4. ✅ Both removed from queue

### Scenario 2: Neither Player Accepts

1. Neither user clicks Accept
2. Timeout occurs
3. ✅ Both removed from queue

### Scenario 3: Both Players Accept

1. User A clicks Accept
2. User B clicks Accept
3. ✅ Navigate to combat (no timeout)

## Why This Design?

**Rationale for removing both players:**

1. **Fairness:** If one player doesn't respond, the other shouldn't be stuck waiting
2. **User Control:** Players can manually re-queue if they want to fight
3. **Simplicity:** Clear behavior - timeout = removed from queue
4. **Prevents Spam:** Prevents players from staying in queue indefinitely

**Alternative considered (re-queue accepted players):**
- ❌ Unfair to player who accepted (they're stuck waiting)
- ❌ Complex logic (what if they get matched again and timeout again?)
- ❌ Could lead to infinite loops

## Status

✅ **FIXED** - Both gladiators are now removed from queue on timeout

## Next Steps

1. ✅ Test timeout scenario
2. ⏳ Remove debug logging once confirmed working
3. ⏳ Create Playwright E2E tests for timeout scenario
4. ⏳ Add user notification when removed from queue due to timeout

