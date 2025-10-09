# 🚀 Getting Started with Game Viewport

## 5-Minute Quick Start

### Step 1: Choose Your Component (30 seconds)

**For most pages, use GameLayout (easiest):**
```tsx
import GameLayout from "@/components/layout/GameLayout";
```

### Step 2: Wrap Your Page (1 minute)

**Replace this:**
```tsx
export default function YourPage() {
  return (
    <div className="min-h-screen bg-black">
      <YourContent />
    </div>
  );
}
```

**With this:**
```tsx
import GameLayout from "@/components/layout/GameLayout";

export default function YourPage() {
  return (
    <GameLayout>
      <YourContent />
    </GameLayout>
  );
}
```

### Step 3: Test (3 minutes)

1. Open page on desktop → Should fill viewport, no scrolling
2. Open page on mobile → Should fill viewport, no scrolling
3. Try to pull-to-refresh → Should not work
4. Check safe areas → Should respect notch/home indicator

**Done!** 🎉

---

## Common Scenarios

### Scenario 1: Standard Game Page
```tsx
<GameLayout>
  <h1>My Game Page</h1>
  <p>Content here...</p>
</GameLayout>
```

### Scenario 2: Centered Welcome Screen
```tsx
<GameLayout scrollable={false} centerContent>
  <div className="text-center">
    <h1>Welcome to the Arena!</h1>
    <button>Start Game</button>
  </div>
</GameLayout>
```

### Scenario 3: Arena Background
```tsx
<GameLayout background="arena">
  <h1>Arena Details</h1>
  <p>Fight information...</p>
</GameLayout>
```

### Scenario 4: Custom Background
```tsx
<GameLayout 
  background="custom"
  customBackground="bg-gradient-to-br from-red-950 to-black"
>
  <h1>Custom Styled Page</h1>
</GameLayout>
```

---

## What You Get

### ✅ Automatic Features
- No page scrolling (viewport locked)
- Respects mobile safe areas (notches, home indicators)
- Disables pull-to-refresh
- Disables bounce effect on iOS
- Fills device viewport (100dvh)
- Internal scrolling works when needed

### ✅ Mobile Optimized
- iPhone notch handled
- iPhone home indicator handled
- Android gesture bar handled
- Touch scrolling works correctly

---

## Need More Control?

### Option 2: GameViewport + ScrollableContent
```tsx
import GameViewport from "@/components/layout/GameViewport";
import ScrollableContent from "@/components/layout/ScrollableContent";

export default function YourPage() {
  return (
    <GameViewport>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
      
      {/* Content */}
      <ScrollableContent className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <YourContent />
        </div>
      </ScrollableContent>
    </GameViewport>
  );
}
```

### Option 3: Full Control
```tsx
import GameViewport from "@/components/layout/GameViewport";

export default function YourPage() {
  return (
    <GameViewport>
      <div className="absolute inset-0 bg-black" />
      <div 
        className="relative z-10 h-full overflow-y-auto"
        data-scrollable="true"
      >
        <YourContent />
      </div>
    </GameViewport>
  );
}
```

---

## Examples in Your Codebase

### Dashboard (Scrollable)
**File:** `app/[locale]/dashboard/DashboardClient.tsx`

Shows:
- GameViewport wrapper
- Scrollable content area
- Arena background
- Real-time data

### Combat (Scrollable)
**File:** `app/[locale]/combat/[matchId]/page.tsx`

Shows:
- GameViewport wrapper
- ScrollableContent helper
- Gradient background
- Combat log scrolling

---

## Quick Reference

### GameLayout Props
```tsx
{
  background?: "gradient" | "arena" | "custom" | "none"  // Default: "gradient"
  customBackground?: string                               // For background="custom"
  scrollable?: boolean                                    // Default: true
  centerContent?: boolean                                 // Default: false
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "full"
  className?: string                                      // Additional classes
}
```

### Common Patterns
```tsx
// Scrollable page (default)
<GameLayout>
  <Content />
</GameLayout>

// Centered, no scroll
<GameLayout scrollable={false} centerContent>
  <Content />
</GameLayout>

// Arena background
<GameLayout background="arena">
  <Content />
</GameLayout>

// Full width
<GameLayout maxWidth="full">
  <Content />
</GameLayout>
```

---

## Important Rules

### ✅ DO
- Use GameLayout for most pages
- Test on real mobile devices
- Use `data-scrollable="true"` for scrollable areas
- Use `absolute inset-0` for backgrounds

### ❌ DON'T
- Don't use `min-h-screen` inside GameViewport
- Don't use `fixed` for backgrounds
- Don't add manual safe-area padding
- Don't forget to test on mobile

---

## Check Migration Status

```bash
./scripts/check-viewport-migration.sh
```

Shows which pages are migrated and which need work.

---

## Need Help?

### Quick Patterns
→ `docs/VIEWPORT_QUICK_REFERENCE.md`

### Complete Guide
→ `docs/GAME_VIEWPORT_GUIDE.md`

### Overview
→ `README_VIEWPORT.md`

### Examples
→ Dashboard: `app/[locale]/dashboard/DashboardClient.tsx`
→ Combat: `app/[locale]/combat/[matchId]/page.tsx`

---

## Next Steps

1. **Try it on one page**
   - Pick a simple page
   - Add GameLayout wrapper
   - Test on mobile

2. **Review examples**
   - Check Dashboard implementation
   - Check Combat implementation
   - See real-world usage

3. **Migrate more pages**
   - Start with high-priority pages
   - Use GameLayout for simplicity
   - Test each page on mobile

4. **Read full docs**
   - `README_VIEWPORT.md` for overview
   - `docs/VIEWPORT_QUICK_REFERENCE.md` for patterns
   - `docs/GAME_VIEWPORT_GUIDE.md` for details

---

## That's It!

You're ready to create a true game experience with no page scrolling! 🎮

**Start with GameLayout and you'll be up and running in 5 minutes.**

Happy coding! 🚀

