# Family Glitch Roadmap

Future enhancements and planned improvements.

## v1.2.0 - Mini-Games Refactoring (Planned)

### Shared Components
Extract common UI patterns into reusable components in `components/mini-games/shared/`:
- **LoadingSpinner**: Animated loading indicator with ARIA labels
- **ScoreDisplay**: Large animated score card with accessibility support
- **CommentaryCard**: AI commentary display with emoji
- **ErrorToast**: Fixed error notification with retry/dismiss buttons
- **IntroScreen**: Full-screen animated intro with game-specific theming

### Shared Utilities
- `lib/mini-games/utils.ts` - JSON parsing, score colors, defensive null helpers
- `lib/mini-games/themes.ts` - Centralized game themes and color schemes

### Type Safety Improvements
- Fix all `as any` casts in mini-game register files
- Ensure all mini-games properly typed with `ComponentType<BaseMiniGameProps>`
- Add missing types to union types (e.g., `'the_filter'` to `MiniGameType`)

### Accessibility
- ARIA labels on all interactive elements
- `role="status"` for loading indicators
- `aria-live="polite"` for score announcements
- `aria-pressed` for toggle buttons
- Form labels associated with inputs

### Code Quality
- Reduce duplication by ~40% through shared components
- Extract magic numbers to named constants
- Add comprehensive JSDoc comments
- Standardize phase names across all games

### Performance
- Optimize background animations (opacity-only)
- Reduce bundle size via shared components

### Mobile Improvements
- Responsive grid layouts (2 cols mobile → 3-4 cols tablet → 5 cols desktop)
- Better touch targets
- Improved viewport handling

## Future Ideas

### Gameplay
- Custom game length settings
- Difficulty modes (family-friendly vs adult)
- Team play mode
- Save/resume games across sessions

### Mini-Games
- New mini-game types:
  - Photo caption challenge
  - Drawing/sketch prompt
  - Rapid-fire yes/no questions
  - Two truths and a lie

### Social Features
- Share results on social media
- Family leaderboards across games
- Achievement badges

### Technical
- Offline mode with service workers
- PWA installation
- Multi-language support
- Voice input for answers

### AI Enhancements
- Dynamic difficulty adjustment based on player performance
- Personalized mini-game selection based on family preferences
- AI learns family inside jokes and references them later
