# Battle System Documentation

## Overview

The battle system provides live-streamed, AI-narrated gladiator combat with full mobile-first UI, reusable components, and comprehensive i18n support (EN/FR).

## Architecture

### Components

#### Reusable UI Components (`app/components/combat/`)

1. **CombatHealthBar** - Animated health tracking
   - Real-time health updates with smooth animations
   - Color-coded based on health percentage (green > amber > red)
   - Pulse effect for low health
   - Death state visualization

2. **CombatAction** - Individual action display
   - Type-specific icons and colors (introduction, action, injury, death, victory, system)
   - Smooth entrance animations
   - Health indicators per action
   - Special effects for critical events (death, victory)

3. **CombatIntroduction** - Gladiator introductions
   - Side-by-side gladiator cards with avatars
   - Stats preview (health, ranking, birthplace, personality, weakness)
   - Animated VS divider
   - Arena information display

4. **CombatStats** - Real-time battle statistics
   - Action counter with progress bar
   - Elapsed time tracker
   - Battle status indicator
   - Winner display (when complete)

5. **CombatStream** - Main streaming container
   - Server-Sent Events (SSE) integration
   - Auto-scrolling combat log
   - Play/Pause/Reset controls
   - Real-time health synchronization
   - Error handling and reconnection

### API Routes

#### `GET /api/combat/match/[matchId]/start`
Starts a combat match and streams actions via SSE.

**Query Parameters:**
- `locale` - Language for narration (en/fr)

**Response:** Server-Sent Events stream
- `type: "log"` - Combat action log entry
- `type: "complete"` - Battle finished
- `type: "error"` - Error occurred

**Features:**
- Validates user participation
- Updates match status to "in_progress"
- Generates AI narration for each action
- Calculates damage and health updates
- Handles victory conditions (submission, knockout, death)
- Saves all logs to database for replay

**Note:** Only the user who starts the battle can use this endpoint. If the match is already in progress, the client will automatically fall back to the watch endpoint.

#### `GET /api/combat/match/[matchId]/watch`
Allows spectators to view an ongoing or completed fight.

**Query Parameters:**
- `locale` - Language for narration (en/fr)

**Response:** Server-Sent Events stream
- `type: "log"` - Combat action log entry (existing logs sent first, then new ones via polling)
- `type: "complete"` - Battle finished
- `type: "error"` - Error occurred

**Features:**
- Validates user is a participant in the match
- Sends all existing logs from the database
- Polls for new logs every 1 second
- Works for both ongoing and completed fights
- Allows multiple spectators to watch simultaneously
- Automatically closes when match is completed

#### `GET /api/combat/match/[matchId]/config`
Retrieves combat configuration for a match.

**Response:**
```json
{
  "config": {
    "maxActions": 20,
    "actionIntervalSeconds": 4,
    "deathChancePercent": 0,
    "injuryChancePercent": 15
  },
  "arena": {
    "name": "Halicara Training Grounds",
    "city": "Halicara",
    "deathEnabled": false
  }
}
```

### Database Schema

#### `combat_matches` (Extended)
New fields:
- `maxActions` - Maximum actions in battle (default: 20)
- `actionIntervalSeconds` - Seconds between actions (default: 4)
- `deathChancePercent` - Death probability 0-100 (default: 0)
- `injuryChancePercent` - Injury probability 0-100 (default: 15)
- `winnerId` - UUID of winning gladiator
- `winnerMethod` - How victory was achieved (submission/knockout/death/forfeit/decision)
- `totalActions` - Actual number of actions executed
- `durationSeconds` - Total battle duration

#### `combat_logs` (New Table)
Stores each action for replay and analysis:
- `id` - UUID primary key
- `matchId` - Reference to combat_matches
- `actionNumber` - Sequential counter (0 = intro, 1-N = actions)
- `type` - Log type (introduction/action/injury/death/victory/system)
- `message` - AI-generated narration
- `locale` - Language (en/fr)
- `gladiator1Health` - G1 health at this moment
- `gladiator2Health` - G2 health at this moment
- `metadata` - Additional JSON data
- `createdAt` - Timestamp

### Configuration

#### Combat Configuration (`lib/combat/config.ts`)

**Default Values:**
```typescript
{
  maxActions: 20,              // 5-50 range
  actionIntervalSeconds: 4,    // 2-10 range
  deathChancePercent: 0,       // 0-100 range
  injuryChancePercent: 15      // 0-100 range
}
```

**Arena-Specific:**
- Training arenas (deathEnabled: false): 0% death, 15% injury
- Death arenas (deathEnabled: true): 5% death, 25% injury

### AI Narration

#### Models Used
- **Storytelling/Narration:** `google/gemini-2.5-flash-lite`

#### Generation Functions

1. **generateIntroduction()**
   - Creates dramatic 2-3 sentence introduction
   - Includes gladiator names, origins, personalities
   - Theatrical arena announcement style

2. **generateAction()**
   - Generates 1-2 sentences per action
   - Considers all gladiator traits:
     - Stats (strength, agility, dexterity, speed, etc.)
     - Current health and injuries
     - Personality and weaknesses
     - Physical condition
   - Realistic combat descriptions
   - Adapts to arena rules (death allowed/forbidden)

3. **generateVictory()**
   - Epic 1-2 sentence victory announcement
   - Includes winner name and victory method
   - Celebratory tone

### Internationalization

#### Translation Keys (`messages/{locale}/battle.json`)

**Combat Namespace:**
```json
{
  "Combat": {
    "title": "Arena Combat",
    "backToArena": "Back to Arena",
    "startBattle": "Start Battle",
    "pauseBattle": "Pause",
    "resumeBattle": "Resume",
    "resetBattle": "Reset",
    "combatLog": "Combat Log",
    "live": "LIVE",
    "versus": "VS",
    "arena": "Arena",
    "health": "Health",
    "ranking": "Ranking",
    "action": "Action",
    "elapsed": "Elapsed",
    "status": "Status",
    "statusInProgress": "In Progress",
    "statusComplete": "Complete",
    "winner": "Winner",
    "methods": {
      "submission": "Submission",
      "knockout": "Knockout",
      "death": "Death",
      "forfeit": "Forfeit"
    }
  }
}
```

## User Flow

1. **Queue for Combat**
   - User selects gladiator in arena page
   - Joins queue via `POST /api/arena/queue`
   - Matchmaking finds opponent with similar ranking

2. **Match Created**
   - System creates `combat_matches` entry with status "pending"
   - Both users see "Active Match" panel
   - "Start Combat" button appears

3. **Navigate to Combat**
   - Click "Start Combat" button
   - Redirects to `/[locale]/combat/[matchId]`
   - Shows gladiator introductions

4. **Start Battle**
   - Click "Start Battle" button
   - Establishes SSE connection to `/api/combat/match/[matchId]/start`
   - Introduction narration appears

5. **Live Combat Stream**
   - Actions stream every 3-5 seconds (configurable)
   - Health bars update in real-time
   - Combat log auto-scrolls
   - Stats update (action count, elapsed time)

6. **Battle Conclusion**
   - Victory message announces winner
   - Match status updates to "completed"
   - Winner and method recorded
   - All logs saved for replay

## Customization

### Adjustable Parameters

**Per Arena:**
- `deathEnabled` - Allow gladiator death
- Affects `deathChancePercent` and `injuryChancePercent`

**Per Match (Future):**
- `maxActions` - Battle length (5-50)
- `actionIntervalSeconds` - Pacing (2-10s)
- `deathChancePercent` - Death risk (0-100%)
- `injuryChancePercent` - Injury risk (0-100%)

### Extending the System

**Add New Action Types:**
1. Add type to `CombatLogType` in `types/combat.ts`
2. Add config to `typeConfig` in `CombatAction.tsx`
3. Update AI prompts to generate new type

**Add New Victory Methods:**
1. Add method to `WinnerMethod` in `types/combat.ts`
2. Update victory logic in streaming API
3. Add translation keys

**Customize Damage Calculation:**
Edit `calculateDamage()` in `/api/combat/match/[matchId]/start/route.ts`

## Testing

### Manual Testing Checklist
- [ ] Queue two gladiators from different users
- [ ] Verify match creation
- [ ] Navigate to combat page
- [ ] Start battle and verify streaming
- [ ] Check health updates
- [ ] Verify victory conditions
- [ ] Test in both EN and FR locales
- [ ] Test on mobile viewport
- [ ] Verify all logs saved to database

### Playwright Tests (TODO)
See task: "Test combat system end-to-end"

## Performance Considerations

- SSE connection per active battle
- Database writes per action (can be batched)
- LLM API calls per action (3-5s interval reduces load)
- Auto-scroll performance with many logs
- Mobile animation performance

## Future Enhancements

- [ ] Replay system using saved logs
- [ ] Spectator mode for other users
- [ ] Tournament brackets
- [ ] Betting system
- [ ] Advanced damage calculations based on stats
- [ ] Critical hits and special moves
- [ ] Environmental effects
- [ ] Crowd reactions
- [ ] Post-battle rewards and ranking updates
