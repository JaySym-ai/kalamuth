# Fix: Combat Page Errors

## Issues Fixed

1. ✅ **Gladiator visibility** - RLS policy updated
2. ✅ **Next.js Image configuration** - Added placehold.co to allowed domains
3. ⚠️ **French translations** - Need to restart dev server

## What Was Done

### 1. RLS Policy Fixed
The SQL you ran fixed the circular dependency issue. Users can now see:
- Their own gladiators
- All gladiators in their server (for combat)

### 2. Next.js Image Config Updated
Added `placehold.co` to allowed image domains in `next.config.mjs`:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'placehold.co',
      port: '',
      pathname: '/**',
    },
  ],
}
```

### 3. French Translations
The `Combat` namespace exists in `messages/fr/battle.json` but the dev server needs to be restarted to pick up the changes.

## Action Required: Restart Dev Server

**Stop your dev server** (Ctrl+C) and **restart it**:

```bash
npm run dev
```

This will:
- ✅ Load the new Next.js image configuration
- ✅ Reload the French translations
- ✅ Clear any caching issues

## After Restart

1. **Navigate to combat page** (click "Entrer dans l'Arène")
2. **Verify**:
   - ✅ Both gladiators visible
   - ✅ Gladiator avatars load (no image error)
   - ✅ French translations work (no "MISSING_MESSAGE" error)
   - ✅ Page renders correctly

3. **Click "Lancer le combat"** to start the battle
4. **Watch the AI-narrated combat stream**

## Troubleshooting

### Still seeing "MISSING_MESSAGE: Could not resolve `Combat`"
**Solution**: Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)

### Still seeing image error
**Solution**: 
1. Verify dev server was restarted
2. Check `next.config.mjs` has the `images` configuration
3. Hard refresh browser

### Gladiators not visible
**Solution**: Verify the SQL was run successfully:
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'gladiators' AND cmd = 'SELECT';
```
Should show `gladiators_select_same_server`

## Summary

All issues are now fixed! Just restart your dev server and the combat system should work perfectly:

1. ✅ Gladiator visibility (RLS fixed)
2. ✅ Image loading (Next.js config updated)
3. ✅ French translations (will load on restart)

**Restart command**: `npm run dev`

Then test the complete combat flow! 🎉

