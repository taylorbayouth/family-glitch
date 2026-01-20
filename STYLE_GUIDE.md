# Family Glitch UI Style Guide

Version: 1.1
Last Updated: 2026-01-19

This guide reflects the current design system defined in `app/globals.css` and the reusable UI components in `components/ui/`.

## Design Direction

- Digital noir: dark surfaces, high-contrast text, glowing accents
- Pass-and-play, mobile-first layouts
- Chunky, tactile controls and clear hierarchy

## Theme Tokens (Tailwind v4)

All theme values live in `app/globals.css` under `@theme`.

### Colors

- `void`: #0A0A0F
- `void-light`: #141419
- `void-dark`: #000000
- `glitch`: #6C5CE7
- `glitch-bright`: #A29BFE
- `glitch-deep`: #4834D4
- `frost`: #F8F9FA
- `frost-dim`: #E9ECEF
- `mint`: #00FFA3
- `mint-dim`: #00CC82
- `alert`: #FF3B5C
- `alert-dim`: #CC2E49
- `steel-100` through `steel-900`

### Typography

- Sans: `Inter`
- Mono: `JetBrains Mono`

Typical usage:
- Prompt text and body copy: `font-sans`
- Meta labels, timers, counters: `font-mono`

### Radius

- `--radius-control`: 12px
- `--radius-card`: 16px
- `--radius-pill`: 9999px

### Shadows

- `--shadow-glow`
- `--shadow-glow-strong`
- `--shadow-glow-mint`

## Custom Classes (Globals)

Defined in `@layer components` and `@layer utilities`:

- `.glass` (blurred glass surface)
- `.scan-line` (ambient scan effect)
- `.glitch-text` (RGB split effect)
- `.bg-grid-pattern` (subtle grid background)
- `.noise-overlay` (film grain overlay)
- `.tap-shrink` (active scale)
- `.text-glow` (text shadow)
- `.custom-scrollbar` (narrow dark scrollbar)

## Reusable UI Components

### Button (`components/ui/Button.tsx`)

Props:
- `variant`: primary, secondary, ghost, danger
- `size`: sm, md, lg, xl
- `isLoading`, `leftIcon`, `rightIcon`

Behavior:
- Motion spring on tap (scale 0.97)
- Primary uses glow + accent border
- Danger uses alert glow

### Input (`components/ui/Input.tsx`)

Props:
- `size`: sm, md, lg
- `label`, `error`, `leftIcon`, `rightIcon`

Behavior:
- Focus glow on valid state
- Error state uses alert border + helper text

### Card (`components/ui/Card.tsx`)

Props:
- `variant`: default, glass, void
- `hoverable`: optional hover scale + glow

## Motion

Framer Motion is used for:
- Screen transitions
- Tap interactions
- Staggered reveals

Common spring settings in UI components:
- `stiffness: 400`
- `damping: 17`

## Additional Notes

- Some mini-games use Tailwind built-in colors (cyan, violet, amber) for distinct modes.
- `/auth/signin` and `/chat` currently use inline styles instead of Tailwind.
