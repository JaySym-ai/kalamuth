# Arena Queue System

## Overview
The arena queue system allows players to queue their gladiators for combat in specific arenas. The system includes:
- Ranking-based matchmaking (default 1000 ranking points per gladiator)
- One active combat per arena per server
- Real-time queue updates via Supabase subscriptions
- Mobile-first UI with smooth animations
- Full i18n support (EN + FR)

## Architecture

### Database Schema

#### Gladiators Table (Extended)
- Added `rankingPoints` (integer, default 1000) for matchmaking

#### Combat Queue Table
Tracks gladiators waiting for matches:
- `arenaSlug`: Arena identifier (e.g., 'halicara-training-grounds')
- `serverId`: Server context
- `gladiatorId`: Gladiator in queue
- `ludusId`, `userId`: Ownership
- `rankingPoints`: Snapshot at queue time for stable matching
- `status`: 'waiting', 'matched', 'cancelled'
- `queuedAt`: Timestamp
- `matchId`: Reference to match when paired

#### Combat Matches Table
Tracks matched pairs (for future combat implementation):
- `arenaSlug`, `serverId`: Arena context
- `gladiator1Id`, `gladiator2Id`: Matched pair
- `status`: 'pending', 'in_progress', 'completed', 'cancelled'
- Unique constraint ensures only 1 active match per arena/server

### API Endpoints

#### GET /api/arena/queue
Fetch current queue for an arena
- Query params: `arenaSlug`, `serverId`
- Returns: Array of queue entries, sorted by queue time

#### POST /api/arena/queue
Join the queue
- Body: `{ arenaSlug, serverId, gladiatorId }`
- Validates:
  - Gladiator ownership
  - Gladiator is alive and healthy
  - Not already in queue
- Triggers automatic matchmaking after joining

#### DELETE /api/arena/queue
Leave the queue
- Query param: `queueId`
- Only allows removing own queue entries

### Matchmaking Logic
Located in `/api/arena/queue/route.ts`:

1. Check if arena already has an active match (only 1 at a time)
2. If no active match and ≥2 gladiators waiting:
   - Sort by ranking points
   - Find pair with smallest ranking difference
   - Create match in `combat_matches` table
   - Update queue entries to 'matched' status

### UI Components

#### GladiatorSelector
- Displays user's gladiators with expand/collapse
- Shows ranking points, health, status
- Disables injured/sick/dead/already-queued gladiators
- Mobile-optimized with 48px tap targets

#### QueueStatus
- Real-time queue display
- Shows user's position prominently
- Displays all waiting gladiators
- Animated "waiting for match" indicator
- Auto-updates via Supabase realtime

#### ArenaDetailClient
- Integrates selector and queue status
- Handles join/leave queue actions
- Real-time subscription to queue changes
- Error handling and loading states

## User Flow

### Joining Queue
1. Navigate to arena page (e.g., `/en/arena/halicara-training-grounds`)
2. Click "Show Gladiators" to expand list
3. Select an available gladiator
4. Click "Join Queue"
5. Gladiator enters queue, matchmaking runs automatically
6. User sees their position and "waiting for opponent" message

### Leaving Queue
1. While in queue, "Leave Queue" button appears
2. Click to remove gladiator from queue
3. Returns to gladiator selection state

### Matchmaking
- Happens automatically when gladiator joins queue
- Finds best match based on ranking points
- Creates match when 2+ gladiators waiting and no active match
- Queue entries update to 'matched' status
- (Combat execution to be implemented later)

## i18n Keys

### ArenaDetail namespace
New keys added:
- `queueTitle`, `selectGladiator`, `selectGladiatorDesc`
- `joinQueue`, `leaveQueue`, `inQueue`
- `queuePosition`, `waitingForMatch`, `matchFound`
- `currentQueue`, `noGladiatorsInQueue`
- `gladiatorUnavailable`, `gladiatorInjured`, `gladiatorSick`, `gladiatorDead`, `gladiatorAlreadyQueued`
- `rankingPoints`, `healthStatus`, `queuedAt`
- `matchmaking`, `activeMatch`, `viewMatch`

All keys have both EN and FR translations.

## Testing

### Playwright Tests
File: `tests/arena-queue.spec.ts`

Scenarios covered:
- Display queue interface
- Select gladiator from list
- Join queue successfully
- Leave queue
- Display queue position
- Prevent queueing injured gladiators
- Display ranking points
- French locale support
- Empty queue state
- Mobile viewport usability

Run tests:
```bash
npx playwright test tests/arena-queue.spec.ts
```

## Next Steps (Not Implemented)

1. **Combat Execution**: Implement actual combat simulation when match is created
2. **Match Viewing**: Allow spectators to watch live combat
3. **Combat History**: Track past matches and results
4. **Ranking Updates**: Adjust ranking points based on combat outcomes
5. **Notifications**: Alert users when match is found
6. **Queue Time Limits**: Auto-remove stale queue entries
7. **Advanced Matchmaking**: Consider more factors (stats, win rate, etc.)

## Mobile Considerations

- All tap targets ≥48px
- Safe area insets respected
- Smooth animations with Framer Motion
- Expandable lists to avoid scrolling issues
- Real-time updates without page refresh
- Optimistic UI updates for better UX

## Performance

- Real-time subscriptions use Supabase channels (efficient)
- Queue queries indexed on arenaSlug, serverId, status
- Matchmaking runs server-side (no client computation)
- Minimal re-renders with proper React hooks
