# Tavern Recruitment Fixes

## Problems Fixed

1. **Database Constraint Error**: When trying to recruit a gladiator from the tavern, the following error occurred:
```
[DEBUG ERROR] Failed to insert gladiator: {
  code: '23514',
  details: null,
  hint: null,
  message: 'new row for relation "gladiators" violates check constraint "check_current_health_range"'
}
POST /api/tavern/recruit 500 in 370ms
```

2. **UI Display Issue**: After recruiting a gladiator, the user would see the same gladiator again and had to refresh the page to see a new one.

3. **Performance Issue**: The recruitment and skip operations were slow because they waited for new gladiators to be generated on-demand.

## Root Causes

1. **Database Constraint Issue**: In `app/api/tavern/recruit/route.ts`, the `currentHealth` was being forced to be at least 1, but the database constraint allows values from 0 to health. When a tavern gladiator has `currentHealth` of 0, this would violate the constraint.

2. **UI Display Issue**: After recruiting a gladiator, the code was incorrectly handling the array index changes when a gladiator was deleted and a new one was added. The code assumed the new gladiator would be at the same index, but the array structure changes.

3. **Performance Issue**: The system was generating replacement gladiators only after recruitment/skip, causing delays.

## Fix Applied

### 1. Code Fix
Modified `app/api/tavern/recruit/route.ts` line 73:
```typescript
// Before
const currentHealth = Math.min(Math.max(1, tavernGladiator.currentHealth ?? maxHealth), maxHealth);

// After  
const currentHealth = Math.min(Math.max(0, tavernGladiator.currentHealth ?? maxHealth), maxHealth);
```

This allows `currentHealth` to be 0, which is valid according to the database constraint.

### 2. Database Constraint Fix
Created two new migrations to handle the existing constraints:

1. `supabase/migrations/0021_fix_gladiator_current_health_constraint.sql` - Drops any existing constraints and recreates the `check_current_health_range` constraint to ensure it allows 0 health
2. `supabase/migrations/0022_fix_tavern_gladiator_current_health_constraint.sql` - Ensures the tavern_gladiators table has a consistent constraint that also allows 0 health

## Next Steps
To apply the database constraint fixes, run:
```bash
cd supabase
supabase db push
```

Or if you prefer to apply the migrations manually:
1. Run migration 0021 in your Supabase SQL editor
2. Run migration 0022 in your Supabase SQL editor

## Verification
After applying the fixes:
1. The tavern recruitment should work without the constraint violation error
2. The system will properly handle gladiators with 0 current health
3. After recruiting a gladiator, the user will immediately see a new gladiator (the backup) without any loading delay
4. The skip functionality will be much faster and immediately display new gladiators
5. The system always maintains a backup gladiator ready for instant recruitment/skip
6. No page refresh is needed after recruitment or skip operations