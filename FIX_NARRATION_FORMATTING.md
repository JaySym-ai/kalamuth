# Fix: Clean AI Narration Formatting

## Problem

The AI-generated combat narration was including unwanted meta-commentary and formatting:

**Before:**
```
Voici une narration accrocheuse pour l'action #16 :

"Et voilà, Lucius Corvus, malgré ses muscles tendus..."
```

**Issues:**
- ❌ Meta-commentary: "Voici une narration accrocheuse pour l'action #16 :"
- ❌ Quotes around the narration: `"..."`
- ❌ Action numbers: `#16`

## Solution

### 1. Updated AI Prompts

Added explicit instructions to all generation functions:

```typescript
IMPORTANT: Write ONLY the narration. Do NOT include phrases like 
"Voici une narration" or "Here is" or action numbers. 
Start directly with the action description.
```

### 2. Created Cleaning Function

Added `cleanNarration()` function that removes:
- Quotes at start/end of text
- French meta-commentary: "Voici une narration...", "Pour l'action #X"
- English meta-commentary: "Here is...", "Here's...", "For action #X"
- Action number references: `#16`, `#1`, etc.
- Extra whitespace

### 3. Applied to All Generation Functions

- ✅ `generateIntroduction()` - Cleans introduction text
- ✅ `generateAction()` - Cleans combat action narration
- ✅ `generateVictory()` - Cleans victory announcement

## Result

**After:**
```
Et voilà, Lucius Corvus, malgré ses muscles tendus et la fatigue 
dans ses jambes, charge ! Il a vu l'ouverture et tente un coup de 
hache fulgurant, mais Titus, la douleur vive dans sa cuisse gauche 
lui dictant prudence, pivote avec une agilité surprenante et dévie 
le coup mortel avec son avant-bras blindé !
```

Clean, dramatic narration with no meta-commentary! ✅

## Testing

After restarting your dev server, test a combat match:

1. **Start a combat match**
2. **Watch the narration stream**
3. **Verify**:
   - ✅ No "Voici une narration..." or "Here is..."
   - ✅ No quotes around text
   - ✅ No action numbers (#1, #2, etc.)
   - ✅ Clean, direct narration

## Technical Details

### Cleaning Patterns

The function removes these patterns:

**French:**
- `Voici une narration.*:`
- `Voici la narration.*:`
- `Voici le narration.*:`
- `Pour l'action #X:`
- `Action #X:`

**English:**
- `Here is.*:`
- `Here's.*:`
- `For action #X:`
- `Action #X:`

**General:**
- Leading/trailing quotes (`"` or `'`)
- Action number references (`#\d+`)
- Extra whitespace

### Code Location

**File:** `app/api/combat/match/[matchId]/start/route.ts`

**Function:**
```typescript
function cleanNarration(text: string): string {
  let cleaned = text.trim();
  
  // Remove quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // Remove meta-commentary patterns
  cleaned = cleaned.replace(/^Voici une narration.*?:\s*/i, '');
  cleaned = cleaned.replace(/^Here is.*?:\s*/i, '');
  // ... more patterns
  
  return cleaned;
}
```

## Future Improvements

If the AI still occasionally adds unwanted text, you can:

1. **Add more patterns** to the cleaning function
2. **Use system messages** in the LLM call to reinforce the instruction
3. **Use few-shot examples** showing correct output format
4. **Switch to a different model** that follows instructions better

## Files Modified

- `app/api/combat/match/[matchId]/start/route.ts`
  - Updated `generateIntroduction()` prompt and added cleaning
  - Updated `generateAction()` prompt and added cleaning
  - Updated `generateVictory()` prompt and added cleaning
  - Added `cleanNarration()` helper function

The combat narration is now clean and professional! 🎉

