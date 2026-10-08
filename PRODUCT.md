# Product

## Register

product

## Users

- **Khodam (Sunday school servants)**, admins and superadmins. They open the app on their phones in a busy church hall, often one-handed, between activities. Their job on any screen is short and repetitive: add a student, find a student, award or deduct points, share a link. They are not technical and should never have to read instructions.
- **Students (preparatory stage, roughly 12 to 15 years old)**. They log in with a 5-digit code on their phones to check their points, their rank among all classes, their points history and the media links. Their visit lasts under a minute.
- Interface language is Arabic, right-to-left, Egyptian dialect in labels.

## Product Purpose

A points and attendance system for the "Mar Mina and Pope Kyrillos" preparatory family (Ava Abraam church). It records who did what (mass, hymns, Sunday school, bible study, sports leagues, behavior deductions), keeps an honest leaderboard, and gives servants a shared student directory with contact details. Success is a servant awarding points to a student in under ten seconds on a phone, and a student understanding their standing at a glance.

## Brand Personality

Calm, clear, trustworthy. The app should feel like a well-made utility, not a game and not a corporate dashboard. Quiet confidence: one accent color, generous white space, system-like controls. Warmth comes from the content (names, points, encouragement), not from decoration.

## Anti-references

- The previous version of this app: large colored circles as navigation, a dotted background pattern, teal plus blue plus amber plus red plus emerald all competing, cards nested inside cards, dialogs stacked on dialogs.
- Gamified kids' apps with badges, confetti and mascots.
- Generic SaaS admin templates with a dark sidebar, stat tiles and gradient accents.
- Anything that needs a mouse: hover-only affordances, tiny icon buttons, dense tables that do not fit a phone.

## Design Principles

1. **Thumb first.** Every primary action is reachable and tappable with one thumb on a phone. Touch targets of at least 44px; the main action of a screen sits where the thumb rests.
2. **One job per screen.** Each screen has one obvious next step. Secondary actions are visually quieter or one tap away, never competing.
3. **Show the number, then get out of the way.** Points and rank are the content. Everything else is chrome and should recede.
4. **Earned familiarity.** Standard controls, standard layouts, standard feedback. Servants should recognize how things work from other well-made apps on their phone.
5. **Forgiving.** Destructive actions confirm once, errors say what to do next in plain Arabic, and nothing is lost on a flaky connection without the user being told.

## Accessibility & Inclusion

- Target WCAG 2.1 AA contrast for text and controls in both light and dark themes.
- Fully usable with touch and with keyboard; visible focus rings.
- Respect `prefers-reduced-motion`; motion only conveys state.
- Arabic typography must stay legible at small sizes: avoid thin weights and all-caps-style tracking, keep line height generous.
- Numbers (points, codes, phone numbers) render left-to-right inside right-to-left text.
