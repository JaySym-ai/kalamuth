# Quest Completion Locale Fix

## Problem
When a quest completed, the narrative text was always generated in English, regardless of the user's current locale (EN or FR). Additionally, users had to manually refresh the page to see the quest results.

## Solution
Implemented two key improvements:

### 1. Locale-Aware AI Generation
- Pass the user's current locale to the quest completion API endpoint
- Updated the AI prompt to explicitly request narrative generation in the correct language
- Ensures French users see French narratives and English users see English narratives

### 2. Real-Time UI Updates
- Added Supabase real-time subscription to the quests table
- UI automatically updates when quest data changes in the database
- No manual refresh needed - results appear immediately when quest completes

## Files Changed

### 1. `app/[locale]/quests/QuestsClient.tsx`
**Changes:**
- Added `useRealtimeCollection` import
- Added real-time subscription to quests table with `ludusId` filter
- Removed manual state updates from quest mutation functions
- Updated `completeQuest` to pass `locale: currentLocale` to API
- Removed `setQuests` calls - real-time subscription handles updates

**Key Code:**
```typescript
// Real-time quests subscription
const { data: realtimeQuests } = useRealtimeCollection<Quest>({
  table: "quests",
  select: "id, userId, ludusId, serverId, gladiatorId, gladiatorName, title, description, volunteerMessage, reward, dangerPercentage, sicknessPercentage, deathPercentage, status, startedAt, completedAt, result, healthLost, sicknessContracted, injuryContracted, questFailed, gladiatorDied, createdAt, updatedAt",
  match: { ludusId: ludus.id },
  initialData: initialQuests,
  orderBy: { column: "createdAt", ascending: false },
  primaryKey: "id",
});

const quests = realtimeQuests;
```

### 2. `app/api/quests/complete/route.ts`
**Changes:**
- Extract `locale` from request body (defaults to 'en')
- Pass `locale` parameter to `buildResultPrompt` function
- Updated prompt to explicitly request narrative in the correct language

**Key Code:**
```typescript
const locale = typeof body?.locale === 'string' ? body.locale.trim() : 'en';
const resultPrompt = buildResultPrompt(quest, gladiator, locale);

function buildResultPrompt(quest: any, gladiator: any, locale: string = 'en'): string {
  const language = locale === 'fr' ? 'French' : 'English';
  // ... prompt includes: "Generate a quest outcome in ${language}."
}
```

### 3. `tests/quests-completion.spec.ts` (NEW)
**Added comprehensive Playwright tests:**
- Test quest narrative displays in English (EN locale)
- Test quest narrative displays in French (FR locale)
- Test quest results display with health loss and rewards
- Test real-time UI updates without manual refresh
- Test injury/sickness information display

## How It Works

### Before (Old Flow)
1. User in French locale completes quest
2. Client calls `/api/quests/complete` without locale
3. API generates narrative in English (default)
4. Database updates with English narrative
5. User must manually refresh to see results

### After (New Flow)
1. User in French locale completes quest
2. Client calls `/api/quests/complete` with `locale: 'fr'`
3. API generates narrative in French
4. Database updates with French narrative
5. Real-time subscription broadcasts change
6. UI automatically updates with French narrative (no refresh needed)

## Testing

### Manual Testing
1. **English Locale:**
   - Navigate to `/en/quests`
   - Generate and accept a quest
   - Wait for completion (~1 hour or modify timer)
   - Verify narrative is in English

2. **French Locale:**
   - Navigate to `/fr/quests`
   - Generate and accept a quest
   - Wait for completion
   - Verify narrative is in French
   - Verify UI updates automatically without refresh

### Automated Testing
Run Playwright tests:
```bash
npx playwright test tests/quests-completion.spec.ts
```

## Database Requirements
✅ Realtime already enabled for quests table in migration `0019_quests_system.sql`

## i18n Keys
No new translation keys needed - existing keys are used:
- `whatHappened` - "What Happened" / "Ce qui s'est passé"
- `questCompleted` - "Quest Completed" / "Quête réussie"
- `questFailed` - "Quest Failed" / "Quête échouée"

## Performance Impact
- **Minimal**: Real-time subscription uses existing Supabase infrastructure
- **Benefit**: Eliminates need for manual page refresh
- **Network**: WebSocket connection for real-time updates (already used elsewhere)

## Backward Compatibility
✅ Fully backward compatible:
- Locale parameter is optional (defaults to 'en')
- Existing API calls without locale still work
- Real-time subscription doesn't break existing functionality

## Future Enhancements
1. Add locale to quest generation (already done in `/api/quests/generate`)
2. Add locale to quest volunteer messages
3. Extend real-time updates to other quest operations (generate, accept, cancel)
4. Add loading state while waiting for real-time update

## Status
✅ **COMPLETE** - Ready for testing and deployment

