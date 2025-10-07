# Fix: Remove Gladiators from Queue After Combat

## Problem
When a combat match completes, both gladiators remain in the `combat_queue` table with status "matched". This prevents them from joining new queues because of the unique constraint on `gladiatorId`.

## Root Cause
The combat completion logic in `app/api/combat/match/[matchId]/start/route.ts` was updating the match status to "completed" but never cleaning up the corresponding queue entries.

## Solution
Added queue cleanup logic that removes both gladiators from the queue when the match completes.

### Code Changes

**File:** `app/api/combat/match/[matchId]/start/route.ts`

**Before:**
```typescript
// Update match with winner
await supabase
  .from("combat_matches")
  .update({
    status: "completed",
    completedAt: new Date().toISOString(),
    winnerId: battleState.winnerId,
    winnerMethod: battleState.winnerMethod,
    totalActions: battleState.actionNumber,
  })
  .eq("id", matchId);

sendEvent({ type: "complete", winnerId: battleState.winnerId, winnerMethod: battleState.winnerMethod });
```

**After:**
```typescript
// Update match with winner
await supabase
  .from("combat_matches")
  .update({
    status: "completed",
    completedAt: new Date().toISOString(),
    winnerId: battleState.winnerId,
    winnerMethod: battleState.winnerMethod,
    totalActions: battleState.actionNumber,
  })
  .eq("id", matchId);

// Remove both gladiators from the queue
await supabase
  .from("combat_queue")
  .delete()
  .in("gladiatorId", [match.gladiator1Id, match.gladiator2Id]);

sendEvent({ type: "complete", winnerId: battleState.winnerId, winnerMethod: battleState.winnerMethod });
```

## Impact

### Before Fix
1. ✅ Gladiators join queue
2. ✅ Match is created
3. ✅ Combat completes
4. ❌ Gladiators stuck in queue with status "matched"
5. ❌ Cannot join new queues (unique constraint violation)

### After Fix
1. ✅ Gladiators join queue
2. ✅ Match is created
3. ✅ Combat completes
4. ✅ Both gladiators removed from queue
5. ✅ Can immediately join new queues

## Testing

### Manual Test
1. Start dev server: `npm run dev`
2. Navigate to an arena
3. Join queue with a gladiator
4. Wait for matchmaking (or join with another gladiator)
5. Complete the combat match
6. Verify both gladiators are removed from queue
7. Try joining queue again with the same gladiator - should work!

### Database Verification
```sql
-- Check queue entries for specific gladiators
SELECT * FROM combat_queue 
WHERE "gladiatorId" IN ('gladiator-id-1', 'gladiator-id-2');

-- Should return 0 rows after combat completes
```

## Related Files
- `app/api/combat/match/[matchId]/start/route.ts` - Combat streaming endpoint (MODIFIED)
- `app/api/arena/queue/route.ts` - Queue management (unchanged)
- `supabase/migrations/0004_arena_queue_system.sql` - Queue table schema

## Notes
- The cleanup happens immediately after the match status is updated to "completed"
- Uses `.in("gladiatorId", [...])` to delete both entries in a single query
- No error handling needed - if deletion fails, it won't affect the match result
- The unique constraint on `gladiatorId` ensures no duplicate queue entries exist

