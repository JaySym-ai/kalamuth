# GameViewport Quick Reference Card

## 🚀 Three Ways to Implement

### Option 1: GameLayout (Easiest - Recommended)
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

**When to use:** Most pages, especially when you want defaults (scrollable, gradient background)

---

### Option 2: GameViewport + ScrollableContent (Flexible)
```tsx
import GameViewport from "@/components/layout/GameViewport";
import ScrollableContent from "@/components/layout/ScrollableContent";

export default function YourPage() {
  return (
    <GameViewport>
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
      <ScrollableContent className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <YourContent />
        </div>
      </ScrollableContent>
    </GameViewport>
  );
}
```

**When to use:** When you need custom background or layout structure

---

### Option 3: GameViewport Only (Full Control)
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

**When to use:** When you need complete control over layout

---

## 📋 Common Patterns

### Pattern: Centered Content (No Scroll)
```tsx
<GameLayout scrollable={false} centerContent>
  <IntroContent />
</GameLayout>
```

### Pattern: Fixed Header + Scrollable Body
```tsx
<GameViewport>
  <div className="absolute inset-0 bg-black" />
  <div className="relative z-10 h-full flex flex-col">
    <header className="flex-shrink-0 px-4 py-6">
      <h1>Fixed Header</h1>
    </header>
    <div 
      className="flex-1 overflow-y-auto px-4"
      data-scrollable="true"
    >
      <ScrollableContent />
    </div>
  </div>
</GameViewport>
```

### Pattern: Arena Background
```tsx
<GameLayout background="arena">
  <YourContent />
</GameLayout>
```

### Pattern: Custom Background
```tsx
<GameLayout 
  background="custom"
  customBackground="bg-gradient-to-br from-red-950 to-black"
>
  <YourContent />
</GameLayout>
```

### Pattern: Full Width Content
```tsx
<GameLayout maxWidth="full">
  <YourContent />
</GameLayout>
```

---

## ⚠️ Important Rules

### ✅ DO:
- Use `absolute inset-0` for backgrounds
- Add `data-scrollable="true"` to scrollable containers
- Use `h-full` for content that should fill viewport
- Test on real mobile devices

### ❌ DON'T:
- Don't use `min-h-screen` inside GameViewport
- Don't use `fixed` for backgrounds (GameViewport is already fixed)
- Don't forget `data-scrollable="true"` on scrollable areas
- Don't add manual safe-area padding (handled automatically)

---

## 🔧 Migration Checklist

- [ ] Import GameLayout or GameViewport
- [ ] Remove `min-h-screen` from root container
- [ ] Remove `overflow-x-hidden` from root container
- [ ] Change background from `fixed` to `absolute`
- [ ] Add `data-scrollable="true"` to scrollable areas
- [ ] Test on mobile (iOS + Android)

---

## 🧪 Quick Test

After migration, verify:
1. ✅ No page-level scrolling (body doesn't move)
2. ✅ Content fills viewport (no white space)
3. ✅ Internal scrolling works (if applicable)
4. ✅ No pull-to-refresh on mobile
5. ✅ Safe areas respected (notch, home indicator)

---

## 📱 Component Props Reference

### GameLayout Props
```tsx
{
  background?: "gradient" | "arena" | "custom" | "none"
  customBackground?: string
  scrollable?: boolean
  centerContent?: boolean
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "full"
  className?: string
}
```

### GameViewport Props
```tsx
{
  allowScroll?: boolean  // Default: false
  className?: string
}
```

### ScrollableContent Props
```tsx
{
  className?: string
  customScrollbar?: boolean  // Default: true
}
```

---

## 🎯 Examples from Codebase

### Dashboard (Scrollable with Arena Background)
```tsx
<GameViewport>
  <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
  <div className="absolute inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5" />
  <div 
    className="relative z-10 h-full overflow-y-auto px-4 py-6"
    data-scrollable="true"
  >
    <Content />
  </div>
</GameViewport>
```

### Combat (Scrollable with Gradient)
```tsx
<GameViewport>
  <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
  <ScrollableContent className="relative z-10">
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <CombatContent />
    </div>
  </ScrollableContent>
</GameViewport>
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Content cut off | Add `h-full` and `overflow-y-auto` to container |
| Can't scroll on mobile | Add `data-scrollable="true"` |
| Pull-to-refresh works | Ensure GameViewport wraps entire page |
| Background doesn't fill | Use `absolute inset-0` not `fixed` |
| Safe areas not working | GameViewport handles this - remove manual padding |

---

## 📚 Full Documentation

- **Complete Guide:** `docs/GAME_VIEWPORT_GUIDE.md`
- **Implementation Summary:** `docs/VIEWPORT_IMPLEMENTATION_SUMMARY.md`
- **This Quick Reference:** `docs/VIEWPORT_QUICK_REFERENCE.md`

---

## 🎮 Ready to Migrate?

1. Choose your approach (GameLayout recommended)
2. Follow the pattern for your use case
3. Test on mobile devices
4. Check off the migration checklist

**Need help?** Check the full guide or review Dashboard/Combat implementations.

