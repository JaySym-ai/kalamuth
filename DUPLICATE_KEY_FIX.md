# Duplicate Key Error Fix - Match Acceptance

## Error

```
Error updating acceptance: {
  code: '23505',
  details: null,
  hint: null,
  message: 'duplicate key value violates unique constraint "combat_match_acceptances_matchId_gladiatorId_key"'
}
```

## Root Cause

The accept and decline endpoints were using `upsert()` which tries to insert a new record if it doesn't exist. However, the acceptance records are **already created** by the matchmaking system when a match is found.

The unique constraint `(matchId, gladiatorId)` prevents duplicate records, so when the user clicks Accept, the `upsert` tries to insert a duplicate record and fails.

## Flow

1. **Matchmaking creates match** → Creates 2 acceptance records with `status: "pending"`
2. **User clicks Accept** → Tries to `upsert` a new record → **FAILS** (duplicate key)

## Original Code (Broken)

### `app/api/combat/match/[matchId]/accept/route.ts`
```typescript
// Update or create acceptance record
const { data: acceptance, error: acceptanceError } = await supabase
  .from("combat_match_acceptances")
  .upsert({
    matchId,
    gladiatorId: participant.id,
    userId: user.id,
    status: "accepted",
    respondedAt: new Date().toISOString(),
  })
  .select("*")
  .single();
```

### `app/api/combat/match/[matchId]/decline/route.ts`
```typescript
// Update or create acceptance record
const { data: acceptance, error: acceptanceError } = await supabase
  .from("combat_match_acceptances")
  .upsert({
    matchId,
    gladiatorId: participant.id,
    userId: user.id,
    status: "declined",
    respondedAt: new Date().toISOString(),
  })
  .select("*")
  .single();
```

## Solution

Change from `upsert()` to `update()` since the records already exist.

## Fixed Code

### `app/api/combat/match/[matchId]/accept/route.ts`
```typescript
// Update the existing acceptance record
const { data: acceptance, error: acceptanceError } = await supabase
  .from("combat_match_acceptances")
  .update({
    status: "accepted",
    respondedAt: new Date().toISOString(),
  })
  .eq("matchId", matchId)
  .eq("gladiatorId", participant.id)
  .select("*")
  .single();
```

### `app/api/combat/match/[matchId]/decline/route.ts`
```typescript
// Update the existing acceptance record
const { data: acceptance, error: acceptanceError } = await supabase
  .from("combat_match_acceptances")
  .update({
    status: "declined",
    respondedAt: new Date().toISOString(),
  })
  .eq("matchId", matchId)
  .eq("gladiatorId", participant.id)
  .select("*")
  .single();
```

## Why This Works

- `update()` modifies the existing record instead of trying to insert a new one
- We filter by `matchId` and `gladiatorId` to find the exact record to update
- No more duplicate key errors!

## Files Modified

1. **`app/api/combat/match/[matchId]/accept/route.ts`**
   - Changed `upsert()` to `update()` (lines 56-71)

2. **`app/api/combat/match/[matchId]/decline/route.ts`**
   - Changed `upsert()` to `update()` (lines 51-66)

## Testing

After this fix:
1. Click **Accept Combat** → Should work without errors
2. Click **Decline Combat** → Should work without errors
3. Check browser console → No more 500 errors
4. Check network tab → POST requests should return 200

## Status

✅ **FIXED** - Accept and decline now properly update existing records

