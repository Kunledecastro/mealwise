# Mealwise — Design System (Phase 1)

Tokens live in `app/globals.css` (`@theme`). Components live in `components/ui.tsx`.

## Principles
- Answer "What can I eat next?" first. Home leads with one suggestion, not a grid.
- Food is the hero: every meal is drawn as a top-down plate generated from what's on it (`components/plate-art.tsx`). Same dish, same drawing, every time. No photo licensing needed.
- Supportive, never judging. No red for "over target", no "cheat" or "bad food" language. Red is used only for errors and the fat macro swatch.
- Estimates are always labelled. Any sample figure carries a yellow "Sample…" tag; the prototype banner sits on every screen.
- Mobile first: bottom tab bar under 1024 px, left rail above. Touch targets ≥ 44 px.

## Colour

| Token | Hex | Use |
|---|---|---|
| leaf | #1E5B3C | Primary actions, active nav, links |
| leaf-deep | #123D28 | Primary hover |
| leaf-soft | #E3EEE4 | Selected backgrounds, reason chips |
| plantain | #F4B53F | Prototype banner, highlights, focus ring, target line |
| plantain-soft | #FDF0D2 | Sample tags, notices |
| pepper | #D2492A | Plate illustrations, fat swatch |
| error | #A8321A | Error text and borders |
| paper | #F6F8F2 | Page background |
| surface | #FFFFFF | Cards, inputs |
| ink | #17251D | Text |
| muted | #55645A | Secondary text (AA contrast on paper and surface) |
| line | #D9E1D6 | Borders, dividers, empty bars |

## Type
- Display: Bricolage Grotesque (headings, meal names, big numbers).
- Body/UI: Figtree.
- Scale (major third from 16 px): 13, 14, 16, 20, 25, 31, 39, 49 px.
- Fonts are bundled from npm (`@fontsource-variable/*`), not loaded from Google at runtime.

## Components
Button / ButtonLink (primary, secondary, ghost, danger), Chip (toggle), Segmented (radio group), Field (label, hint, error wired with aria-describedby), EmptyState, ErrorState, SkeletonRows, SampleTag, PageTitle, PlateArt, MealRow, MealFacts, NotForMe, AppShell (banner, nav, toast).

## Motion
One orchestrated moment: the hero plate turns into place on load. Dialogs and toasts slide up on user action. All motion is disabled under `prefers-reduced-motion`.
