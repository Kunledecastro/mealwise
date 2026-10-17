# Mealwise — Design System ("night kitchen", v2)

Replaces the light ugu-green v1 (2026-10-17) at the product owner's request: an original, motion-rich design in the spirit of animated landing-page templates, with a dramatic public landing page and the same visual language carried into a calmer, faster app. No third-party template, code or assets were copied.

Tokens live in `app/globals.css` (`@theme`). Components: `components/ui.tsx`, `components/motion.tsx`, `components/plate-art.tsx`, `components/app-shell.tsx`, `components/landing/*`.

## Principles
- **Food is the light.** A deep green-black kitchen at night; colour comes from the plates and a warm "jollof glow" (amber into pepper red).
- **One bold moment per screen.** Landing: plates that assemble in the hero. App: the suggestion card. Everything else stays quiet.
- **Motion answers the user, or guides attention once.** No scroll-jacking. All motion respects `prefers-reduced-motion` (animations collapse to instant; marquee stops; reveals show immediately).
- **Fast on everyday phones.** CSS and IntersectionObserver only: no animation library, no video, no WebGL. Fonts are bundled.
- **Honest and kind.** Sample/estimate labels everywhere relevant; no shaming colours (red is for errors and the fat swatch only).

## Colour

| Token | Hex | Use |
|---|---|---|
| paper | #0D1411 | Page background |
| surface | #151F19 | Cards, inputs, nav |
| surface-2 | #1C2821 | Hover, dialogs, toasts |
| line | #2A3A31 | Borders, dividers |
| ink | #EEF3EC | Text |
| muted | #A5B5AA | Secondary text (AA on paper and surface) |
| accent | #F6B23C | Primary buttons, links, active nav, focus ring |
| accent-strong | #FFC65E | Primary hover |
| accent-soft | #2C2413 | Selected and tinted backgrounds, sample tags |
| on-accent | #1A1206 | Text on accent |
| pepper | #FF6B4A | Glow partner, fat swatch |
| fresh / fresh-soft | #7BD893 / #18301F | "Why this suits you" chips, protein swatch, target line |
| error / error-soft | #FF8F78 / #3A1B15 | Errors |
| `--glow` | #F6B23C → #FF8A3D → #FF6B4A | Hero meal name, energy bars, onboarding progress, logo wedge |

Plates are drawn as off-white ceramic (#F4F0E7 / #E8E3D7) with a soft drop shadow, so food colours read true on the dark background.

## Type
- Display: Bricolage Grotesque, tight tracking (-0.025em), line-height 1.05; hero up to 88 px.
- Body/UI: Figtree.
- Scale (major third, 16 px base): 13, 14, 16, 20, 25, 31, 39, 49, 61, 76 px.

## Motion vocabulary

| Name | Where | What it does |
|---|---|---|
| Plate assemble | Landing hero, home suggestion, meal detail, phone mockup | Plate settles, then each portion drops in with a slight spring (`.assemble`) |
| Hero cycle | Landing | Meal name, facts and plate swap every 3.8 s; pause button; off under reduced motion |
| Orbit | Landing hero | Dotted ring with ingredient dots rotating once a minute |
| Dish marquee | Landing | Two rows of dishes drifting in opposite directions; pauses on hover |
| Scroll story | Landing "How it works" | Desktop: sticky phone whose screen changes as each step reaches the middle of the viewport. Phone: each step shows its own phone screen |
| Spotlight | Landing feature cards | Border glow follows the pointer |
| Reveal | Landing sections | Fade and rise as they scroll into view (once) |
| Page in | App | Each screen fades up on navigation |
| Nav indicator | App bottom bar and side rail | Highlight slides to the active tab |
| Swap | Home suggestion, onboarding steps | New content blurs in when it changes |
| Sheet | Log meal | Rises from the bottom on phones, centred dialog on desktop |
| Draw | Progress chart | Line draws in over a glowing area fill |
| Press | Buttons, chips | Slight scale-down on press |

## Components
Button / ButtonLink (primary glow, secondary, ghost, danger), Chip, Segmented, Field, Panel, EmptyState (floating empty plate), ErrorState, SkeletonRows, SampleTag, PageTitle, PlateArt (`animate` = assemble), MealRow, MealFacts, NotForMe, AppShell (floating bottom bar on phones, rail on desktop, toast), RevealRoot, SpotlightGroup, HeroCycler, ScrollStory.

## Performance notes
- Thumbnails under 60 px skip texture marks (the landing marquee shows 68 small plates).
- The hero headline slides in without starting transparent, so it counts as painted immediately.
- Lighthouse mobile (throttled), 2026-10-17: landing 85–88, home 83–90, meal detail 88, progress 92; accessibility 100 on all.
