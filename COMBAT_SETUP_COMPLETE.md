# Combat System Setup - Complete Guide

## Current Issue

You're getting the error:
```
Combat page - Could not load both gladiators: 1
```

This is because the database needs two migrations to be run.

## Solution: Run Both Migrations

```bash
npx supabase db push
```

This will apply both required migrations:
1. **0005_combat_system.sql** - Adds combat tables and fields
2. **0006_gladiator_combat_visibility.sql** - Fixes RLS to allow viewing opponent gladiators

## What Each Migration Does

### Migration 0005: Combat System
Creates the core combat infrastructure:
- Extends `combat_matches` table with combat configuration
- Creates `combat_logs` table for battle history
- Adds indexes for performance
- Sets up RLS policies

### Migration 0006: Gladiator Visibility
Fixes the RLS policy to allow combat:
- **Old policy**: Users can only see their own gladiators
- **New policy**: Users can see their own gladiators + opponent gladiators in their matches
- **Security**: Still prevents viewing random gladiators from other users

## After Running Migrations

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Test the complete flow**:
   
   **Step 1: Queue First Gladiator**
   - Navigate to arena: `http://localhost:3000/fr/arena/halicara-training-grounds`
   - Select a gladiator
   - Click "Rejoindre la File" (Join Queue)
   
   **Step 2: Queue Second Gladiator (Different User)**
   - Open incognito/different browser
   - Login as different user
   - Navigate to same arena
   - Select a gladiator
   - Click "Rejoindre la File"
   - Match will be created automatically!
   
   **Step 3: Start Combat**
   - You'll see "Active Match" panel
   - Click "Entrer dans l'Arène" (Start Combat)
   - Combat page loads with both gladiators ✅
   
   **Step 4: Watch the Battle**
   - Click "Lancer le combat" (Start Battle)
   - Watch live AI-narrated combat stream
   - Actions appear every 4 seconds
   - Health bars update in real-time
   - Battle concludes with victory announcement

## Verify Migrations Applied

Check if migrations were successful:

```sql
-- Check combat_matches has new fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'combat_matches' 
  AND column_name IN ('maxActions', 'winnerId', 'deathChancePercent');

-- Check combat_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'combat_logs';

-- Check new RLS policy exists
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'gladiators' 
  AND policyname = 'gladiators_select_in_combat';
```

All three queries should return results.

## Troubleshooting

### Issue: "Could not load both gladiators: 1"
**Cause**: Migration 0006 not applied (RLS blocking opponent)
**Solution**: Run `npx supabase db push`

### Issue: "Match not found"
**Cause**: Migration 0005 not applied (combat_matches missing fields)
**Solution**: Run `npx supabase db push`

### Issue: "Connection lost" during battle
**Cause**: OpenRouter API key missing or invalid
**Solution**: Check `.env.local` has `OPENROUTER_API_KEY=your_key_here`

### Issue: No narration appearing
**Cause**: LLM API error
**Solution**: 
- Check OpenRouter API key is valid
- Check server logs for errors
- Verify model name is correct in `lib/llm/config.ts`

### Issue: Page redirects to dashboard immediately
**Cause**: One of the migrations is missing
**Solution**: Run `npx supabase db push` and restart server

## Testing Checklist

After migrations are applied:

- [ ] Run `npx supabase db push`
- [ ] Restart dev server (`npm run dev`)
- [ ] Queue two gladiators from different users
- [ ] Verify match is created
- [ ] Click "Entrer dans l'Arène"
- [ ] Combat page loads with both gladiators
- [ ] Click "Lancer le combat"
- [ ] Introduction narration appears
- [ ] Actions stream every 4 seconds
- [ ] Health bars update smoothly
- [ ] Battle concludes with victory
- [ ] Check database has combat_logs entries
- [ ] Test in French locale
- [ ] Test on mobile viewport

## Files Created

### Migrations
- `supabase/migrations/0005_combat_system.sql` - Combat tables
- `supabase/migrations/0006_gladiator_combat_visibility.sql` - RLS fix

### Components
- `app/components/combat/CombatHealthBar.tsx`
- `app/components/combat/CombatAction.tsx`
- `app/components/combat/CombatIntroduction.tsx`
- `app/components/combat/CombatStats.tsx`
- `app/components/combat/CombatStream.tsx`

### Pages
- `app/[locale]/combat/[matchId]/page.tsx`
- `app/[locale]/combat/[matchId]/CombatClient.tsx`

### API Routes
- `app/api/combat/match/[matchId]/start/route.ts` - SSE streaming
- `app/api/combat/match/[matchId]/config/route.ts` - Config endpoint

### Configuration
- `lib/combat/config.ts` - Combat configuration
- `lib/combat/schema.ts` - Zod schemas

### Types
- `types/combat.ts` - Extended with combat types

### Translations
- `messages/en/battle.json` - Extended with Combat namespace
- `messages/fr/battle.json` - Extended with Combat namespace

### Documentation
- `docs/BATTLE_SYSTEM.md` - Complete system documentation
- `docs/BATTLE_SYSTEM_QUICKSTART.md` - Quick start guide
- `BATTLE_SYSTEM_IMPLEMENTATION.md` - Implementation summary
- `MIGRATION_REQUIRED.md` - Migration instructions
- `FIX_GLADIATOR_VISIBILITY.md` - RLS fix details
- `COMBAT_SETUP_COMPLETE.md` - This file

## Architecture Overview

```
User Flow:
1. Queue gladiator → Matchmaking → Match created
2. Click "Start Combat" → Navigate to /combat/[matchId]
3. Server loads match + both gladiators (RLS allows opponent access)
4. Click "Start Battle" → SSE connection established
5. Server streams AI-narrated actions every 4 seconds
6. Client updates health bars and combat log in real-time
7. Battle concludes → Winner announced → Logs saved

Database:
- combat_matches: Match metadata + configuration
- combat_logs: Every action logged for replay
- gladiators: RLS allows viewing opponents in matches

Security:
- RLS ensures users can only see gladiators they're matched against
- Service role used for log insertion
- User participation verified before combat starts
```

## Next Steps

After testing the combat system:

1. **Create Playwright tests** (remaining task)
2. **Implement post-battle processing**:
   - Update gladiator health
   - Apply injuries
   - Handle death (if applicable)
   - Update ranking points
   - Award rewards
   - Update ludus stats

3. **Add replay system**:
   - View past battles
   - Replay combat logs
   - Share battle links

4. **Enhance combat**:
   - Critical hits
   - Special moves
   - Environmental effects
   - Crowd reactions

## Success Criteria

✅ Both migrations applied successfully
✅ Combat page loads with both gladiators
✅ Battle streams smoothly with AI narration
✅ Health updates in real-time
✅ Victory is announced
✅ All logs saved to database
✅ Works in both EN and FR
✅ Mobile-responsive
✅ No console errors

When all criteria are met, the combat system is fully operational! 🎉⚔️

## Quick Command Reference

```bash
# Apply migrations
npx supabase db push

# Restart dev server
npm run dev

# Check migration status
npx supabase migration list

# View server logs
# (Check terminal where dev server is running)

# Test on mobile
# Open http://localhost:3000 on your phone
# Or use browser DevTools responsive mode
```

The combat system is now complete and ready for testing! 🚀

