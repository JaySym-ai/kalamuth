# Game Viewport Implementation Guide

## Overview

The `GameViewport` component provides a **no-scroll, viewport-locked experience** for your game. It ensures:

- ✅ Game fills the device's viewable area (100vh/100dvh)
- ✅ No page scrolling (body/html scroll disabled)
- ✅ Respects mobile safe areas (notches, home indicators)
- ✅ Disables native mobile scroll behaviors (pull-to-refresh, bounce)
- ✅ Internal scrollable areas work correctly (gladiator lists, etc.)
- ✅ Easy to implement on any page

---

## Quick Start

### 1. Import the Component

```tsx
import GameViewport from "@/components/layout/GameViewport";
```

### 2. Wrap Your Page Content

```tsx
export default function YourPage() {
  return (
    <GameViewport>
      {/* Your page content */}
    </GameViewport>
  );
}
```

---

## Implementation Patterns

### Pattern 1: Fixed Layout (No Scrolling)

Use this for pages where all content fits on screen (e.g., combat view, intro screen).

```tsx
<GameViewport>
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
  
  {/* Content - centered, no scroll */}
  <div className="relative z-10 h-full flex items-center justify-center px-4">
    <YourContent />
  </div>
</GameViewport>
```

**Key Points:**
- Use `absolute inset-0` for backgrounds
- Use `h-full` for content containers
- Use flexbox to center content

---

### Pattern 2: Scrollable Content

Use this for pages with dynamic content that may overflow (e.g., dashboard, arena lists).

```tsx
<GameViewport>
  {/* Background - fixed */}
  <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
  
  {/* Scrollable content area */}
  <div 
    className="relative z-10 h-full overflow-y-auto px-4 py-6"
    data-scrollable="true"
  >
    <YourScrollableContent />
  </div>
</GameViewport>
```

**Key Points:**
- Add `data-scrollable="true"` to enable scrolling in that area
- Use `overflow-y-auto` for vertical scrolling
- The `data-scrollable` attribute allows touch gestures to work properly

---

### Pattern 3: Fixed Header + Scrollable Body

Use this for pages with a persistent header and scrollable content below.

```tsx
<GameViewport>
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
  
  {/* Layout container */}
  <div className="relative z-10 h-full flex flex-col">
    {/* Fixed header */}
    <header className="flex-shrink-0 px-4 py-6 border-b border-amber-900/30">
      <h1>Your Title</h1>
    </header>
    
    {/* Scrollable content */}
    <div 
      className="flex-1 overflow-y-auto px-4 py-6"
      data-scrollable="true"
    >
      <YourContent />
    </div>
  </div>
</GameViewport>
```

**Key Points:**
- Use `flex flex-col` on the parent
- Use `flex-shrink-0` for fixed elements
- Use `flex-1` for the scrollable area

---

## Migration Checklist

When converting an existing page to use `GameViewport`:

### ✅ Step 1: Remove Old Scroll Classes
- ❌ Remove `min-h-screen` from root containers
- ❌ Remove `overflow-x-hidden` from root containers
- ❌ Remove manual safe-area padding (GameViewport handles this)

### ✅ Step 2: Wrap with GameViewport
```tsx
// Before
<div className="min-h-screen bg-black">
  <YourContent />
</div>

// After
<GameViewport>
  <div className="absolute inset-0 bg-black" />
  <div className="relative z-10 h-full">
    <YourContent />
  </div>
</GameViewport>
```

### ✅ Step 3: Update Backgrounds
- Change backgrounds from `fixed inset-0` to `absolute inset-0`
- GameViewport is already `fixed`, so children should use `absolute`

### ✅ Step 4: Add Scrollable Areas
- Identify content that needs to scroll
- Add `data-scrollable="true"` and `overflow-y-auto`
- Ensure parent has `h-full` or `flex-1`

### ✅ Step 5: Test on Mobile
- Test on iOS Safari (notch handling)
- Test on Android Chrome (gesture navigation)
- Verify no page bounce or pull-to-refresh

---

## Examples from Your Codebase

### ✅ Dashboard (Already Migrated)

<augment_code_snippet path="app/[locale]/dashboard/DashboardClient.tsx" mode="EXCERPT">
````tsx
return (
  <GameViewport>
    {/* Background Effects */}
    <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
    
    {/* Scrollable Content */}
    <div 
      className="relative z-10 h-full overflow-y-auto px-4 py-6"
      data-scrollable="true"
    >
      <header>...</header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content */}
      </div>
    </div>
  </GameViewport>
);
````
</augment_code_snippet>

---

## Common Issues & Solutions

### Issue: Content is cut off
**Solution:** Ensure the scrollable container has `h-full` and `overflow-y-auto`

### Issue: Can't scroll on mobile
**Solution:** Add `data-scrollable="true"` to the scrollable container

### Issue: Pull-to-refresh still works
**Solution:** Ensure GameViewport is wrapping your entire page content

### Issue: Safe areas not respected
**Solution:** GameViewport handles this automatically - don't add manual padding

### Issue: Background doesn't fill screen
**Solution:** Use `absolute inset-0` instead of `fixed inset-0` for backgrounds

---

## Advanced: Nested Scrollable Areas

For complex layouts with multiple scrollable regions:

```tsx
<GameViewport>
  <div className="h-full flex">
    {/* Left sidebar - scrollable */}
    <aside 
      className="w-64 overflow-y-auto border-r"
      data-scrollable="true"
    >
      <SidebarContent />
    </aside>
    
    {/* Main content - scrollable */}
    <main 
      className="flex-1 overflow-y-auto"
      data-scrollable="true"
    >
      <MainContent />
    </main>
  </div>
</GameViewport>
```

---

## Testing Checklist

Before deploying a page with GameViewport:

- [ ] Page fills viewport on desktop (no white space)
- [ ] Page fills viewport on mobile (no white space)
- [ ] No page-level scrolling (body doesn't scroll)
- [ ] Internal scrollable areas work correctly
- [ ] Safe areas respected on iPhone (notch, home indicator)
- [ ] No pull-to-refresh on mobile
- [ ] No bounce effect on iOS
- [ ] Touch gestures work in scrollable areas
- [ ] Content doesn't overflow viewport unexpectedly

---

## Next Steps

1. **Migrate high-priority pages first:**
   - Combat pages (already no-scroll)
   - Arena detail pages
   - Server selection
   - Intro page

2. **Test thoroughly on mobile devices**

3. **Update remaining pages gradually**

4. **Consider adding page transitions** for a more polished game feel

---

## Questions?

If you encounter issues or need help with a specific page layout, refer to the patterns above or check the Dashboard implementation as a reference.

