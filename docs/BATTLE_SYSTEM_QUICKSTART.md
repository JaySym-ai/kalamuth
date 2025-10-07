# Battle System Quick Start Guide

## Prerequisites

- ✅ Supabase project configured
- ✅ OpenRouter API key set in `.env.local`
- ✅ Two test user accounts (for matchmaking)
- ✅ At least one server with gladiators

## Step 1: Run Database Migration

```bash
# Apply the combat system migration
npx supabase migration up

# Or if using Supabase CLI
supabase db push
```

This will:
- Add combat configuration fields to `combat_matches` table
- Create `combat_logs` table
- Set up RLS policies
- Create necessary indexes

## Step 2: Verify Environment Variables

Ensure your `.env.local` has:

```bash
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 3: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## Step 4: Test the Battle System

### A. Queue Two Gladiators

**User 1:**
1. Navigate to an arena (e.g., `/en/arena/halicara-training-grounds`)
2. Select a gladiator
3. Click "Join Queue"
4. Wait for matchmaking

**User 2 (different browser/incognito):**
1. Navigate to the same arena
2. Select a different gladiator
3. Click "Join Queue"
4. Match should be created automatically

### B. Start Combat

**Either User:**
1. See "Active Match" panel appear
2. Click "Start Combat" button
3. Redirected to `/[locale]/combat/[matchId]`
4. See gladiator introductions

### C. Watch the Battle

1. Click "Start Battle" button
2. Watch live streaming combat:
   - Introduction narration appears
   - Actions stream every 4 seconds
   - Health bars update in real-time
   - Combat log auto-scrolls
   - Stats update (action count, elapsed time)
3. Battle concludes with victory announcement

### D. Verify Database Logs

```sql
-- Check combat logs
SELECT * FROM combat_logs 
WHERE "matchId" = 'your-match-id'
ORDER BY "actionNumber";

-- Check match result
SELECT * FROM combat_matches 
WHERE id = 'your-match-id';
```

## Testing Different Scenarios

### Training Arena (No Death)
- Arena: Halicara Training Grounds
- Death chance: 0%
- Injury chance: 15%
- Victory methods: submission, knockout

### Death Arena
- Arena: Velusia Grand Colosseum
- Death chance: 5%
- Injury chance: 25%
- Victory methods: submission, knockout, death

### Test in French
1. Navigate to `/fr/arena/halicara-training-grounds`
2. Follow same steps
3. Verify French narration

## Troubleshooting

### Issue: "Match not found"
**Solution:** Ensure both gladiators are from different users and different ludi

### Issue: "Connection lost"
**Solution:** 
- Check server logs for errors
- Verify OpenRouter API key
- Check network tab for SSE connection

### Issue: No narration appearing
**Solution:**
- Check OpenRouter API key is valid
- Check server logs for LLM errors
- Verify model name is correct

### Issue: Health not updating
**Solution:**
- Check browser console for errors
- Verify SSE connection is active
- Check combat_logs table for health values

## Manual Testing Checklist

- [ ] Queue two gladiators successfully
- [ ] Match created automatically
- [ ] Navigate to combat page
- [ ] Gladiator introductions display correctly
- [ ] Start battle button works
- [ ] Introduction narration appears
- [ ] Actions stream every 4 seconds
- [ ] Health bars update smoothly
- [ ] Combat log auto-scrolls
- [ ] Stats update in real-time
- [ ] Battle concludes with victory
- [ ] Winner announced correctly
- [ ] Logs saved to database
- [ ] Test in French locale
- [ ] Test on mobile viewport (390×844)
- [ ] Test pause/resume (UI only)
- [ ] Test reset button

## Performance Testing

### Check SSE Connection
Open browser DevTools → Network tab → Filter by "EventStream"
- Should see connection to `/api/combat/match/[matchId]/start`
- Should see data events streaming

### Check Database Writes
Monitor Supabase dashboard during battle:
- ~20 inserts to `combat_logs` per battle
- 2 updates to `combat_matches` (start + complete)

### Check LLM API Calls
Monitor OpenRouter dashboard:
- ~22 API calls per battle (intro + 20 actions + victory)
- Calls spaced by 4 seconds

## Next Steps

After manual testing:
1. Create Playwright tests (see task list)
2. Test edge cases (disconnection, errors)
3. Performance testing with multiple concurrent battles
4. Load testing with many users

## Configuration Tweaks

### Faster Battles (Testing)
Edit `lib/combat/config.ts`:
```typescript
export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  maxActions: 10,              // Reduced from 20
  actionIntervalSeconds: 2,    // Reduced from 4
  deathChancePercent: 0,
  injuryChancePercent: 15,
};
```

### Slower, More Dramatic Battles
```typescript
export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  maxActions: 30,              // Increased from 20
  actionIntervalSeconds: 6,    // Increased from 4
  deathChancePercent: 0,
  injuryChancePercent: 15,
};
```

## Support

For issues or questions:
1. Check `docs/BATTLE_SYSTEM.md` for detailed documentation
2. Review server logs for errors
3. Check Supabase logs for database issues
4. Verify OpenRouter API usage and limits

## Success Criteria

✅ Two users can queue and match
✅ Combat page loads with introductions
✅ Battle streams smoothly
✅ Health updates in real-time
✅ Victory is announced
✅ All logs saved to database
✅ Works in both EN and FR
✅ Mobile-responsive
✅ No console errors

When all criteria are met, the battle system is ready for production! 🎉

