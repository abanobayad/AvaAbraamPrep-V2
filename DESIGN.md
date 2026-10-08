# Design

## Visual Theme & Atmosphere

A calm utility for phones. Light surfaces, one blue accent, hairline borders, no decoration. The content (names, points, rank) is the loudest thing on every screen. Dark theme is available from the top bar but light is the default because the app is used in bright church halls.

Register: product. Color strategy: restrained (tinted neutrals, one accent on primary actions and selection only).

## Color Palette & Roles

All tokens live in `src/app/globals.css` as OKLCH triplets and are consumed through Tailwind (`bg-primary`, `text-muted-foreground`, and so on).

| Role | Light | Dark | Use |
|---|---|---|---|
| background | oklch(0.985 0.003 250) | oklch(0.17 0.015 255) | page |
| surface | oklch(0.965 0.006 250) | oklch(0.2 0.013 255) | top bar, bottom nav, sheets' handle area |
| card | oklch(0.995 0.002 250) | oklch(0.21 0.015 255) | list rows, forms |
| foreground | oklch(0.23 0.02 255) | oklch(0.95 0.01 250) | text |
| muted-foreground | oklch(0.5 0.02 255) | oklch(0.7 0.015 250) | secondary text |
| primary | oklch(0.52 0.15 252) | oklch(0.72 0.13 252) | primary button, active nav item, focus ring, own row highlight |
| secondary | oklch(0.945 0.012 250) | oklch(0.27 0.015 255) | quiet buttons and chips |
| success | oklch(0.58 0.14 152) | oklch(0.72 0.14 152) | positive points, success toast |
| destructive | oklch(0.57 0.2 27) | oklch(0.68 0.18 27) | deductions, delete, errors |
| border | oklch(0.905 0.008 250) | oklch(0.3 0.012 255) | hairlines |

Never use pure black or pure white. Never use color as decoration; a colored element always means state or action.

## Typography Rules

- One family: IBM Plex Sans Arabic (Google Fonts, weights 400, 500, 600, 700), loaded through next/font with the CSS variable `--font-sans`. Latin and digits come from the same family.
- Fixed rem scale, ratio about 1.2: 12px captions, 14px secondary, 16px body and inputs (prevents iOS zoom), 18px row titles, 22px screen titles, 40px the single big number on the student portal.
- Weights: 400 body, 500 labels and row titles, 600 screen titles and buttons, 700 only for the big number.
- Numbers get the `num` utility class: left-to-right, tabular figures.
- Line height 1.5 for Arabic text; never letter-spacing on Arabic.

## Component Stylings

- Buttons: 44px tall (`h-11`), radius 12px, weight 600. Variants: primary (filled blue), secondary (tinted neutral), outline, ghost, destructive. One primary button per screen.
- Inputs: 44px tall, 16px text, radius 12px, subtle `input` border, blue ring on focus.
- Rows: the main list element. Full-width, 56 to 64px tall, hairline divider between rows, chevron on the leading edge for navigation rows. No cards inside cards.
- Sheets: dialogs open as bottom sheets on phones (rounded top corners, slide up) and as centered dialogs from the `sm` breakpoint. One sheet at a time; confirmations happen inline inside the open sheet.
- Chips: quick point actions are pills with the value on the leading edge; positive values neutral, deductions destructive outline.
- Toasts: bottom on phones, short, one line.

## Layout Principles

- Mobile first at 390px, with one centered column up to 640px on larger screens for forms, and up to 880px for lists.
- App shell: a 56px top bar (title in the center, back action on the right, utilities on the left) and, for staff, a bottom navigation bar with 4 or 5 destinations. Students get no bottom bar.
- Spacing scale: 4, 8, 12, 16, 24, 32. Screen padding 16px. Vertical rhythm comes from section spacing (24 or 32), not from boxes.
- The page itself scrolls; sticky elements are only the top bar and the bottom nav.

## Motion

- 150 to 240ms, ease-out quart. Sheets slide up, nothing else moves on its own.
- Reduced motion disables all animation.
