# Brand: Markd

Markd is a fast, local-first Markdown notes app.

_Established on 2026-07-12. This file documents the existing product system._

## Palette: Markd Monochrome

**Vibe:** calm, premium, focused
**Category:** consumer productivity
**Mood:** calm and premium

Markd uses warm neutral surfaces and typographic contrast instead of a brand
accent. Color appears only when it communicates destructive state.

### Core seeds

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#fbfbfa` | `#1a1a1a` |
| Panel | `#f4f4f2` | `#151515` |
| Recessed | `#e9e9e6` | `#0f0f0f` |
| Primary text | `#191919` | `#ebebe8` |
| Secondary text | `#6e6e6a` | `#8f8f8a` |
| Faint text | `#a3a39e` | `#64645f` |
| Border | `#e3e3e0` | `#292927` |
| Inverted surface | `#1c1c1c` | `#ebebe8` |
| Inverted text | `#fbfbfa` | `#131313` |
| Destructive | `#b3261e` | `#e5484d` |

### Semantic tokens

Use the tokens defined in `src/styles.css`:

- `bg`, `panel`, and `sunken` for the surface hierarchy.
- `ink`, `muted`, and `faint` for the text hierarchy.
- `line` and `line-soft` for separation.
- `hover` and `active` for interaction feedback.
- `invert` and `invert-ink` for selected rows and primary actions.
- `danger` only for destructive actions and failures.

Never hardcode colors in components. New beUI or shadcn components must use
the compatibility mappings already defined in `src/styles.css`.

## Typography: Inter and JetBrains Mono

- **Interface and reading:** Inter Variable
- **Code, paths, shortcuts, and raw Markdown:** JetBrains Mono Variable

### Type hierarchy

| Role | Guidance |
| --- | --- |
| Product display | 64 px, weight 680, welcome screen only |
| Note title | 30 px, weight 680 |
| Editor H1 | 1.6 em, weight 620 |
| Editor H2 | 1.3 em, weight 580 |
| Editor H3 | 1.1 em, weight 560 |
| Editor H4 | 1 em, weight 550 |
| Reading text | 16 px, line-height 1.65 |
| Interface text | 12.5 to 14 px |
| Caption | 11 to 12 px, only when contrast remains readable |

Use tight tracking only for display and larger headings. Body copy stays
neutral and comfortable.

## Shape and depth

- Buttons use medium corners.
- Cards and dialogs use large corners.
- The tab strip uses the recessed `sunken` surface.
- Selected rows use the inverted treatment when strong selection is needed.
- Prefer borders for structure. Reserve shadows for floating overlays.
- Keep all motion between 100 and 160 ms unless a shared spring controls it.

## Tone and voice

### Use

Write with calm confidence. Keep sentences short and specific. Describe what
happened, where content lives, and what the user can do next.

Examples:

- "Plain Markdown notes. Yours, on disk."
- "Moved to Trash."
- "Note exported."
- "Choose a folder for your vault."

### Avoid

- Urgency, hype, or exaggerated claims.
- Words such as revolutionary, seamless, powerful, unlock, and effortless.
- Exclamation marks except for genuine warnings.
- Jokes inside errors or destructive confirmations.
- Audience labels in core product copy.

## Accessibility

- Every interactive control must be keyboard reachable.
- Composite controls use arrow-key navigation.
- Every focusable control has a visible focus indicator using `ink` or
  `invert`, not the low-contrast `faint` token.
- Modals trap focus, close with Escape, and restore focus to their trigger.
- Icon-only controls require an accessible label.
- Motion respects reduced-motion preferences.

## Do

- Preserve the strict monochrome system.
- Use spacing in 4 px increments where practical.
- Keep interface density compact but readable.
- Test every change in light and dark modes.
- Reuse existing primitives and motion tokens.

## Do not

- Add decorative accent colors.
- Add gradients, glass effects, or heavy shadows.
- Mix icon libraries or stroke styles.
- Use long promotional copy in the application.
- Use em dashes in product copy or documentation.

_Last updated: 2026-07-12. Palette: Markd Monochrome. Typography: Inter and JetBrains Mono. Gradients: none._
