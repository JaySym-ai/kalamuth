# Quests Feature - Testing Guide

## Prerequisites

1. **Database Migration**: Apply the migration
   ```bash
   supabase migration up
   ```

2. **Environment Variables**: Ensure `OPENROUTER_API_KEY` is set in `.env.local`

3. **Development Server**: Start the dev server
   ```bash
   npm run dev
   ```

4. **Authenticated User**: Log in to the game

5. **Ludus with Gladiators**: Have at least one ludus with gladiators

## Testing Checklist

### 1. Navigation
- [ ] Dashboard displays "Quests" button (⚔️)
- [ ] Clicking "Quests" navigates to `/[locale]/quests`
- [ ] Page loads with proper styling
- [ ] Back button returns to dashboard

### 2. Quest Generation
- [ ] "Generate New Quest" button is visible
- [ ] Clicking button shows loading animation
- [ ] Loading states display:
  - [ ] Bouncing dots animation
  - [ ] "Generating quest..." text
  - [ ] "Finding a volunteer..." text
- [ ] Quest is generated within 5-10 seconds
- [ ] Quest displays:
  - [ ] Title (3-5 words)
  - [ ] Description (2-3 sentences)
  - [ ] Reward (1-5 sestertii)
  - [ ] Danger percentage (0-99%)
  - [ ] Sickness percentage (0-99%)
  - [ ] Death percentage (0-99%)
  - [ ] Volunteer name
  - [ ] Volunteer message (in-character)

### 3. Quest Details
- [ ] Risk percentages are color-coded:
  - [ ] Green for low risk (0-39%)
  - [ ] Yellow for medium risk (40-69%)
  - [ ] Red for high risk (70-99%)
- [ ] Volunteer message is displayed in italics
- [ ] Volunteer message is immersive and in-character

### 4. Quest Actions
- [ ] "Accept Quest" button is clickable
- [ ] "Reroll Quest" button is clickable
- [ ] Reroll shows confirmation dialog
- [ ] Reroll costs 1 sesterce (deducted from treasury)
- [ ] After reroll, new quest is generated

### 5. Active Quest
- [ ] After accepting, quest status changes to "Active"
- [ ] Progress bar appears and fills over time
- [ ] Timer counts down from 1:00:00
- [ ] Timer updates every second
- [ ] "Cancel Quest" button is visible
- [ ] Cancel shows confirmation dialog
- [ ] Cancel costs 2 sestertii (deducted from treasury)

### 6. Quest Completion
- [ ] After 1 hour, quest automatically completes
- [ ] Results are displayed with:
  - [ ] Status (Completed or Failed)
  - [ ] Narrative description
  - [ ] Health lost (if any)
  - [ ] Injury contracted (if any)
  - [ ] Sickness contracted (if any)
  - [ ] Gladiator death (if applicable)
  - [ ] Reward earned
- [ ] Results are color-coded appropriately
- [ ] Narrative is immersive and dramatic

### 7. Quest History
- [ ] Completed quests appear in history
- [ ] History shows:
  - [ ] Quest title
  - [ ] Quest description
  - [ ] Status badge
  - [ ] Reward amount
  - [ ] Danger percentage
  - [ ] Date created
  - [ ] Result narrative
- [ ] History is scrollable if many quests
- [ ] Oldest quests appear at bottom

### 8. Treasury Integration
- [ ] Reward is added to ludus treasury
- [ ] Reroll cost is deducted from treasury
- [ ] Cancel cost is deducted from treasury
- [ ] Treasury amount updates in real-time
- [ ] Cannot reroll/cancel if insufficient funds

### 9. Gladiator Integration
- [ ] Volunteer is a real gladiator from ludus
- [ ] Gladiator health can decrease
- [ ] Gladiator can contract injuries
- [ ] Gladiator can contract sickness
- [ ] Gladiator can die

### 10. Translations
- [ ] English version displays correctly
- [ ] French version displays correctly
- [ ] All text is properly translated
- [ ] No untranslated strings appear

### 11. Error Handling
- [ ] No gladiators error displays properly
- [ ] Insufficient funds error displays properly
- [ ] API errors are handled gracefully
- [ ] Error messages are user-friendly

### 12. Responsive Design
- [ ] Mobile view (< 768px) displays correctly
- [ ] Tablet view (768px - 1024px) displays correctly
- [ ] Desktop view (> 1024px) displays correctly
- [ ] All buttons are clickable on mobile
- [ ] Text is readable on all screen sizes

### 13. Performance
- [ ] Page loads quickly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Animations are smooth
- [ ] Timer updates smoothly

### 14. Data Persistence
- [ ] Refresh page during active quest
- [ ] Quest status persists
- [ ] Timer continues from where it left off
- [ ] Completed quests appear in history after refresh

## Manual Testing Scenarios

### Scenario 1: Complete Quest Successfully
1. Generate a quest
2. Accept the quest
3. Wait 1 hour (or modify timer in code for testing)
4. Verify results display
5. Check treasury increased by reward amount

### Scenario 2: Reroll Quest
1. Generate a quest
2. Click "Reroll Quest"
3. Confirm reroll
4. Verify treasury decreased by 1 sesterce
5. Verify new quest is generated

### Scenario 3: Cancel Active Quest
1. Generate and accept a quest
2. Click "Cancel Quest"
3. Confirm cancellation
4. Verify treasury decreased by 2 sestertii
5. Verify quest status is "Cancelled"

### Scenario 4: Insufficient Funds
1. Reduce ludus treasury to 0
2. Try to reroll quest
3. Verify error message displays
4. Verify quest is not rerolled

### Scenario 5: Gladiator Death
1. Generate multiple quests
2. Accept quests with high death percentage
3. Wait for completion
4. Verify if gladiator dies, status shows "Gladiator Died"
5. Verify gladiator is marked as dead in database

## Debugging Tips

### Check Timer
Open browser console and run:
```javascript
// Check current quest
console.log(document.querySelector('[data-quest-id]'));

// Check timer element
console.log(document.querySelector('[data-timer]'));
```

### Force Quest Completion
Modify `QUEST_DURATION_MS` in QuestsClient.tsx to a smaller value:
```typescript
const QUEST_DURATION_MS = 5000; // 5 seconds for testing
```

### Check API Responses
Open Network tab in DevTools and monitor:
- `/api/quests/generate`
- `/api/quests/accept`
- `/api/quests/complete`
- `/api/quests/cancel`
- `/api/quests/reroll`

### Check Database
Query Supabase directly:
```sql
SELECT * FROM quests WHERE "userId" = 'your-user-id';
```

## Known Issues & Workarounds

### Issue: Timer doesn't start
**Workaround**: Refresh the page

### Issue: Quest doesn't complete
**Workaround**: Check browser console for errors, ensure timer is running

### Issue: Results don't show
**Workaround**: Refresh page to sync with database

### Issue: Treasury doesn't update
**Workaround**: Refresh page to see updated treasury

## Performance Benchmarks

- Quest generation: 5-10 seconds
- Quest acceptance: < 1 second
- Quest completion: 5-10 seconds
- Page load: < 2 seconds
- Timer update: < 100ms

## Success Criteria

All of the following must pass:
- [ ] All 14 testing categories pass
- [ ] All 5 manual scenarios work correctly
- [ ] No console errors
- [ ] No performance issues
- [ ] All translations display correctly
- [ ] Responsive design works on all screen sizes
- [ ] Data persists across page refreshes
- [ ] Error handling is graceful

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and OS
5. Console errors (if any)
6. Screenshots/videos (if applicable)

## Sign-Off

Once all tests pass, the Quests feature is ready for production deployment.

Tested by: _______________
Date: _______________

