# Family Glitch - UI Style Guide

**Version:** 1.0
**Visual Aesthetic:** Digital Noir Utility
**Last Updated:** 2026-01-19

---

## Design Philosophy

Family Glitch embraces a **"Digital Noir Utility"** aesthetic—sleek, high-contrast, premium interface inspired by cyberpunk inventory screens (Cyberpunk 2077) and high-end fintech apps. The interface is **not** gamified or cartoonish, but rather emphasizes data, utility, and psychological tension.

**Core Principles:**
- High contrast for maximum readability
- Chunky, tactile interactive elements
- Spring-based physics for satisfying feedback
- Glitch effects instead of simple fades
- Terminal/system aesthetic for data display

---

## Color System

### Primary Palette

#### Background Colors
```typescript
void: {
  DEFAULT: "#0A0A0F", // Deep charcoal (main background)
  light: "#141419",   // Slightly lighter void (cards, elevated surfaces)
  dark: "#000000",    // Pure black (sparingly used for depth)
}
```

#### Accent Colors
```typescript
glitch: {
  DEFAULT: "#6C5CE7", // Electric indigo (primary accent, system status)
  bright: "#A29BFE",  // Lighter violet (hover states, highlights)
  deep: "#4834D4",    // Deep purple (pressed states)
  neon: "#00F5FF",    // Neon cyan accent (special highlights)
}
```

#### Interactive Colors
```typescript
frost: {
  DEFAULT: "#F8F9FA", // Stark white (text, high-priority elements)
  dim: "#E9ECEF",     // Slightly dimmed (secondary text)
}

mint: {
  DEFAULT: "#00FFA3", // Neon mint (interactive elements, success)
  dim: "#00CC82",     // Dimmed mint (hover states)
}
```

#### Alert Colors
```typescript
alert: {
  DEFAULT: "#FF3B5C", // Destructive red (errors, dangerous actions)
  dim: "#CC2E49",     // Dimmed red (pressed states)
}
```

#### Utility Grays (Steel)
```typescript
steel: {
  100-900: // Full grayscale range for borders, disabled states, etc.
}
```

### Color Usage Guidelines

- **Background:** Always use `void` variants
- **Text:** Use `frost` for primary text, `steel-400/500` for secondary
- **Interactive Elements:** Use `glitch` for primary actions, `mint` for confirmations
- **Borders:** Default to `steel-800`, upgrade to `glitch` on focus/hover
- **Alerts:** Use `alert` sparingly for destructive actions or critical errors

---

## Typography

### Font Families

```css
/* System/Data Text (Monospaced) */
--font-jetbrains: 'JetBrains Mono', monospace;

/* Controls/Readability (Geometric Sans) */
--font-inter: 'Inter', sans-serif;

/* Display Text (Bold Geometric Sans) */
--font-satoshi: 'Inter', sans-serif; /* Currently using Inter as fallback */
```

### Font Usage

| Element | Font Family | Weight | Usage |
|---------|-------------|--------|-------|
| Body Text | Inter | 400 | Default readable text |
| Headings | Inter | 700-900 | Section titles, emphasis |
| Data/System | JetBrains Mono | 400-600 | Stats, labels, technical info |
| Buttons | Inter | 700 | All interactive controls |

### Type Scale

#### Data/System Text (Monospaced)
```typescript
"data-xs": 0.75rem (12px) - Line height: 1.2, Letter spacing: 0.05em
"data-sm": 0.875rem (14px) - Line height: 1.3, Letter spacing: 0.04em
"data-base": 1rem (16px) - Line height: 1.4, Letter spacing: 0.03em
"data-lg": 1.125rem (18px) - Line height: 1.4, Letter spacing: 0.02em
```

#### Display Text (Sans)
```typescript
"display-sm": 1.5rem (24px) - Line height: 1.2, Letter spacing: -0.01em
"display-md": 2rem (32px) - Line height: 1.1, Letter spacing: -0.02em
"display-lg": 3rem (48px) - Line height: 1, Letter spacing: -0.03em
"display-xl": 4rem (64px) - Line height: 1, Letter spacing: -0.04em
```

---

## Component Specifications

### Buttons

**Sizes:**
- `sm`: 40px min-height, px-4 py-2
- `md`: 52px min-height, px-6 py-3 (default)
- `lg`: 64px min-height, px-8 py-4
- `xl`: 76px min-height, px-10 py-5

**Variants:**

#### Primary (Glitch)
- Background: `glitch`
- Border: `2px glitch-bright`
- Shadow: `glow` (purple glow effect)
- Hover: Stronger glow, border changes to `frost`
- Active: Shrink scale (0.97)

#### Secondary (Void)
- Background: `void-light`
- Border: `2px steel-700`
- Hover: Border changes to `glitch`
- Active: Border changes to `glitch-bright`

#### Ghost (Transparent)
- Background: `transparent`
- Hover: Background `void-light`
- Active: Background `steel-900`

#### Danger (Alert)
- Background: `alert`
- Border: `2px alert-dim`
- Shadow: Red glow effect
- Hover: Stronger red glow, border changes to `alert`

**Interaction:**
- Spring animation on tap (scale 0.97)
- Shimmer effect on hover (gradient sweep)
- Loading state shows spinner

---

### Inputs

**Sizes:**
- `sm`: 40px min-height
- `md`: 52px min-height (default)
- `lg`: 64px min-height

**States:**

#### Default
- Background: `void-light`
- Border: `2px steel-700`
- Text: `frost`
- Placeholder: `steel-600`

#### Hover
- Border: `steel-600`

#### Focus
- Border: `2px glitch`
- Shadow: `glow` (purple glow)
- Additional animated border overlay

#### Error
- Border: `2px alert`
- Shadow: Red glow
- Error message appears below in `alert` color

**Features:**
- Supports left/right icons
- Optional label (monospaced, uppercase, tracked)
- Terminal-style underline aesthetic
- Subtle scale feedback on interaction

---

### Cards

**Variants:**

#### Default
- Background: `void-light`
- Border: `2px steel-800`
- Shadow: `void` (deep shadow)

#### Glass
- Backdrop blur with transparency
- Border: `steel-700`
- Semi-transparent background

#### Void
- Background: Pure `void`
- Border: `1px steel-900`
- Minimal shadow

**Hoverable Cards:**
- Scale up to 1.02 on hover
- Border changes to `glitch`
- Shadow changes to `glow`

---

## Layout Guidelines

### Screen Structure

**Portrait Mode Only** - All layouts optimized for vertical orientation

#### Split Screen Layout
```
┌─────────────────────────┐
│                         │
│    THE DISPLAY (40%)    │ ← Large text, AI prompt, status
│                         │
├─────────────────────────┤
│                         │
│  CONTROL DECK (60%)     │ ← Dynamic input zone
│                         │   One-thumb optimized
│                         │
└─────────────────────────┘
```

### Spacing System

Use Tailwind's default spacing scale:
- **Micro:** `gap-2` (8px) - Between icons and text
- **Small:** `gap-4` (16px) - Between related elements
- **Medium:** `gap-6` (24px) - Between sections
- **Large:** `gap-8` (32px) - Between major sections
- **XL:** `gap-12` (48px) - Between screens/phases

### Border Radius

```typescript
control: 0.5rem (8px)   // Buttons, inputs
card: 0.75rem (12px)    // Cards, panels
massive: 1.5rem (24px)  // Large hero elements
```

---

## Motion & Animation

### Spring Physics

All interactive elements use CSS spring animations:
```typescript
transition: {
  type: 'spring',
  stiffness: 400,
  damping: 17,
}
```

### Core Animations

#### Tap Feedback
- Scale to 0.97 on active
- Spring back on release
- Class: `tap-shrink`

#### Button Shimmer
- Gradient sweep from left to right on hover
- Duration: 0.6s
- Easing: easeInOut

#### Glitch Effects
- RGB split/chromatic aberration
- Used for screen transitions
- Keyframe-based clip animations

#### Scan Line (Optional)
- Subtle vertical line animation
- 8s linear infinite
- Opacity: 0.15
- Used for ambient background effect

### Transition Guidelines

- **Never** use simple opacity fades
- **Always** use spring physics for scale/transform
- **Prefer** glitch effects for state changes
- **Add** haptic-style feedback (visual shrink) for all taps

---

## Effects & Polish

### Glow Effects

```css
/* Text glow */
.text-glow: text-shadow: 0 0 20px currentColor

/* Strong text glow */
.text-glow-strong: text-shadow: 0 0 30px, 0 0 50px currentColor

/* Box glow (purple) */
shadow-glow: 0 0 20px rgba(108, 92, 231, 0.3)
shadow-glow-strong: 0 0 30px rgba(108, 92, 231, 0.5)

/* Box glow (mint) */
shadow-glow-mint: 0 0 20px rgba(0, 255, 163, 0.3)
```

### Glass Morphism

```css
/* Standard glass */
.glass: backdrop-blur-md, bg-void-light/80, border steel-800

/* Strong glass */
.glass-strong: backdrop-blur-xl, bg-void-light/90, border steel-700
```

### Glitch Text Effect

Use the `.glitch-text` class with `data-text` attribute:
```html
<span class="glitch-text" data-text="FAMILY GLITCH">
  FAMILY GLITCH
</span>
```

Creates RGB split effect with pseudo-elements.

### Grid Pattern Background

```css
.bg-grid-pattern
```
Creates a subtle cyberpunk grid overlay. Apply to a full-screen element with low opacity (`opacity-[0.03]`).

### Animated Gradient Border

```css
.gradient-border
```
Creates an animated rainbow-style border using the glitch color palette. Animates position over 4 seconds.

### Pulse Glow Animation

```css
.pulse-glow
```
Applies a pulsing box-shadow glow effect in glitch purple.

### Noise Overlay

```css
.noise-overlay
```
Adds a subtle film grain/noise texture overlay. Apply to a parent element - it creates a full-screen pseudo-element.

### Terminal Cursor

```css
.terminal-cursor
```
Adds a blinking underscore cursor after the element. Perfect for data-entry or system text effects.

---

## Interactive Elements

### Input Templates

#### Sliders
- Thick, thumb-friendly tracks (min 48px touch target)
- Dynamic emojis/labels that scale as you drag
- Mint glow on active

#### Grids (2x2 or 3x3)
- Chunky, tappable tiles (min 80px)
- Invert colors on selected state
- Border changes from `steel-700` to `glitch`

#### Text Fields
- Minimalist, underlined inputs (terminal style)
- Full-width on mobile
- Auto-focus with keyboard handling

### Pass-and-Play Interstitials

#### Lock Screen
- Full-screen "Encrypted" state
- Large button showing next player (e.g., "HAND TO DAD")
- Requires tap & hold (1s) or slide gesture to unlock

#### Unlock Animation
- Glitch effect on transition
- Screen "decrypts" with RGB split
- Spring animation for smoothness

---

## Iconography

### Style
- Abstract, geometric vector icons
- Sharp lines, no faces
- Minimalist, high-contrast
- Consistent stroke weight (2px)

### Usage
- Use for left/right icons in buttons
- Use for input field decorations
- Keep size consistent (20-24px default)

---

## Accessibility

### Contrast Ratios
- All text meets WCAG AAA standards (7:1+)
- `frost` on `void` background: Excellent contrast
- Error states use high-contrast `alert` color

### Touch Targets
- Minimum 44x44px for all interactive elements
- Buttons default to 52px+ height
- Generous padding for thumb-friendly interaction

### Focus States
- All interactive elements have visible focus indicators
- Focus uses `glitch` color with glow effect
- Keyboard navigation fully supported

---

## Best Practices

### Do's ✓
- Use high contrast for all text
- Apply spring physics to all interactions
- Use glitch effects for transitions
- Keep controls chunky and thumb-friendly
- Use monospaced fonts for data/stats
- Add glow effects to active states

### Don'ts ✗
- Don't use pure black (#000) as main background
- Don't use simple opacity fades
- Don't make interactive elements smaller than 44px
- Don't use cartoonish or playful aesthetics
- Don't skip spring animations
- Don't use low-contrast text colors

---

## Code Examples

### Using Components

```tsx
import { Button, Input, Card } from '@/components/ui';

// Primary button with icon
<Button variant="primary" size="lg" leftIcon={<Icon />}>
  START GAME
</Button>

// Input with label and error
<Input
  label="Player Name"
  placeholder="Enter your name"
  error={errors.name}
  size="md"
/>

// Hoverable card
<Card variant="glass" hoverable>
  <h3 className="text-display-sm font-bold">Content</h3>
</Card>
```

### Using Utilities

```tsx
import { cn } from '@/lib/utils';

// Combine classes with cn()
<div className={cn(
  "base-classes",
  condition && "conditional-class",
  props.className
)}>
  Content
</div>
```

---

## Implementation Checklist

- [x] Install Tailwind CSS, Framer Motion
- [x] Configure color system in tailwind.config.ts
- [x] Set up typography with custom fonts
- [x] Create globals.css with base styles
- [x] Build Button component with variants
- [x] Build Input component with states
- [x] Build Card component with variants
- [x] Create utility functions (cn)
- [ ] Build additional components (Slider, Grid, etc.)
- [ ] Add more glitch effect variations
- [ ] Implement lock screen component
- [ ] Create avatar system

---

## Resources

- **Fonts:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/), [Inter](https://rsms.me/inter/)
- **Animation:** [Framer Motion Docs](https://www.framer.com/motion/)
- **Tailwind:** [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**This style guide is a living document. Update it as new patterns emerge.**
