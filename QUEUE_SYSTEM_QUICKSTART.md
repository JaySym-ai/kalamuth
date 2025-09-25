# Arena Queue System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Apply Database Migration

**IMPORTANT**: You must apply the migration before the queue system will work.

#### Using Supabase Dashboard (Easiest):
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open `supabase/migrations/0004_arena_queue_system.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click **Run**

#### Verify Migration:
Run this in SQL Editor to confirm:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'gladiators' AND column_name = 'rankingPoints';
```
Should return one row.

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test the Queue System

1. **Login**: Navigate to `http://localhost:3000/en/auth`
   - Use test account: `testplay@kalamuth.com`

2. **Go to Arena**: 
   - From dashboard, click on an arena card
   - Or navigate directly to: `http://localhost:3000/en/arena/halicara-training-grounds`

3. **Select Gladiator**:
   - Click "Show Gladiators" button
   - Click on a healthy gladiator (not injured/sick)
   - Selected gladiator appears in highlighted card

4. **Join Queue**:
   - Click "Join Queue" button
   - Gladiator enters queue
   - See your position: "Position in Queue #1"
   - "Waiting for opponent..." message appears

5. **View Queue**:
   - Scroll down to "Current Queue" section
   - See all gladiators waiting
   - Your gladiator is highlighted

6. **Leave Queue**:
   - Click "Leave Queue" button
   - Returns to gladiator selection

## 🎮 How It Works

### Matchmaking
- **Automatic**: Runs every time a gladiator joins queue
- **Algorithm**: Pairs gladiators with closest ranking points
- **Constraint**: Only 1 active match per arena per server
- **Queue**: Other gladiators wait in line

### Ranking Points
- **Default**: 1000 points for all new gladiators
- **Purpose**: Match gladiators of similar skill
- **Future**: Will adjust based on combat results

### Real-Time Updates
- Queue updates instantly via Supabase subscriptions
- No page refresh needed
- See other players join/leave in real-time

## 📱 Mobile Testing

Test on mobile viewports:
```bash
# iPhone 13 Pro
390 × 844

# Android (Pixel 5)
360 × 800
```

Verify:
- ✓ All buttons ≥48px tap target
- ✓ No horizontal scroll
- ✓ Smooth animations
- ✓ Safe area insets respected

## 🧪 Running Tests

```bash
# Run all arena queue tests
npx playwright test tests/arena-queue.spec.ts

# Run with UI
npx playwright test tests/arena-queue.spec.ts --ui

# Run specific test
npx playwright test tests/arena-queue.spec.ts -g "can join the queue"
```

## 🐛 Troubleshooting

### "Failed to join queue" Error
- **Cause**: Migration not applied
- **Fix**: Apply `0004_arena_queue_system.sql` migration

### Gladiator Not Appearing in Selector
- **Cause**: Gladiator is injured, sick, or already in queue
- **Fix**: Check gladiator health status in dashboard

### Queue Not Updating
- **Cause**: Supabase realtime not configured
- **Fix**: Check Supabase project settings → Database → Replication
  - Enable replication for `combat_queue` table

### "Gladiator is not on this server" Error
- **Cause**: Server mismatch
- **Fix**: Ensure gladiator's `serverId` matches arena's server

## 🔍 Debugging

### Check Queue State
```sql
-- View all queue entries
SELECT * FROM combat_queue ORDER BY "queuedAt";

-- View active matches
SELECT * FROM combat_matches WHERE status IN ('pending', 'in_progress');

-- Check gladiator ranking points
SELECT id, name, surname, "rankingPoints" FROM gladiators;
```

### Clear Queue (Development)
```sql
-- Remove all queue entries
DELETE FROM combat_queue;

-- Remove all matches
DELETE FROM combat_matches;
```

## 📊 API Testing

### Join Queue
```bash
curl -X POST http://localhost:3000/api/arena/queue \
  -H "Content-Type: application/json" \
  -d '{
    "arenaSlug": "halicara-training-grounds",
    "serverId": "alpha-1",
    "gladiatorId": "your-gladiator-id"
  }'
```

### Get Queue
```bash
curl "http://localhost:3000/api/arena/queue?arenaSlug=halicara-training-grounds&serverId=alpha-1"
```

### Leave Queue
```bash
curl -X DELETE "http://localhost:3000/api/arena/queue?queueId=your-queue-id"
```

## ✅ Definition of Done Checklist

- [x] No hardcoded user-visible strings (all use i18n)
- [x] UI verified on mobile viewports (390×844, 360×800)
- [x] Tap targets ≥48px
- [x] Safe area insets respected
- [x] EN & FR strings exist and render
- [x] Playwright specs added and scenarios covered
- [x] Accessibility: labels, focus states, color contrast
- [x] Real-time updates working
- [x] API-driven matchmaking
- [x] One combat per arena enforced

## 🎯 Next Steps

The queue system is complete. Next implementations:
1. Combat simulation engine
2. Live combat viewing
3. Combat results and ranking updates
4. Combat history tracking
5. Spectator mode
