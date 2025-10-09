# Combat Spectator Viewing Fix

## Problem

When a user who did not start a fight tried to view it, they would get "Connection lost. Please refresh the page." error. Only the user who started the fight could see it.

### Root Cause

The SSE stream was only created when someone called `/api/combat/match/[matchId]/start`, which:
1. Checked if the match was "pending" (line 54 in start/route.ts)
2. Changed the status to "in_progress"
3. Started generating the fight

When a second user tried to access the same fight, they couldn't start a new stream because the match was already "in_progress", causing the connection to fail.

## Solution

Implemented a two-endpoint system:

### 1. **Start Endpoint** (`/api/combat/match/[matchId]/start`)
- Only the user who starts the fight uses this
- Generates AI narration and battle actions
- Saves all logs to the database
- Updates match status to "in_progress"

### 2. **Watch Endpoint** (`/api/combat/match/[matchId]/watch`) - NEW
- Allows spectators to view ongoing or completed fights
- Fetches all existing logs from the database
- Polls for new logs every 1 second
- Works for both ongoing and completed fights
- Allows multiple spectators simultaneously
- Automatically closes when match is completed

## Changes Made

### Files Created

1. **`app/api/combat/match/[matchId]/watch/route.ts`**
   - New endpoint for spectators
   - Fetches existing logs from database
   - Polls for new logs every 1 second
   - Handles both ongoing and completed fights

2. **`tests/combat-spectator.spec.ts`**
   - Tests spectator viewing of ongoing fights
   - Tests spectator viewing of completed fights
   - Tests real-time updates
   - Tests access control (non-participants blocked)

### Files Modified

1. **`app/components/combat/CombatStream.tsx`**
   - Updated `startBattle()` function
   - Tries start endpoint first
   - Falls back to watch endpoint if start fails
   - Handles ping messages from watch endpoint
   - Prevents duplicate logs

2. **`docs/BATTLE_SYSTEM.md`**
   - Added documentation for watch endpoint
   - Updated start endpoint documentation
   - Explained fallback behavior

## How It Works

### User Who Started the Fight
1. Clicks "Start Battle"
2. Connects to `/api/combat/match/[matchId]/start`
3. Receives AI-generated narration and actions
4. All logs saved to database

### Spectator (Second User)
1. Navigates to the same fight URL
2. Clicks "Start Battle"
3. Tries `/api/combat/match/[matchId]/start` → fails (match already in_progress)
4. Automatically falls back to `/api/combat/match/[matchId]/watch`
5. Receives all existing logs from database
6. Subscribes to new logs via Realtime
7. Sees the fight in real-time

## Database Changes

No database migrations are required. The watch endpoint uses polling to fetch new logs, which works with the existing database schema.

## Testing

Run the new test suite:
```bash
npx playwright test tests/combat-spectator.spec.ts
```

### Test Scenarios

1. **Spectator can view ongoing fight** - Two users watch the same fight simultaneously
2. **Spectator can view completed fight** - User views a finished fight
3. **Real-time updates** - Spectator receives new logs as they arrive
4. **Access control** - Non-participants cannot view fights

## Benefits

✅ **Multiple viewers** - Any participant can watch the fight
✅ **Real-time sync** - All viewers see the same content (1 second polling)
✅ **Replay support** - Completed fights can be viewed anytime
✅ **No migrations needed** - Works with existing database schema
✅ **Fallback mechanism** - Gracefully handles connection issues
✅ **Reliable** - Polling is more reliable than Realtime in server context

## Future Improvements

- [ ] Add spectator count display
- [ ] Add chat for spectators
- [ ] Add replay/rewind functionality
- [ ] Add spectator-only mode (non-participants can watch)
- [ ] Add fight statistics dashboard

