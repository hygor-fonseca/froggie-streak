---
version: alpha
name: Duo Streak
description: Visual identity for a two-person shared daily-exercise streak web app, inspired by Duolingo Friend Streaks.
colors:
  surface: "#FFFFFF"
  surface-alt: "#FBF6EF"
  surface-sunken: "#F3ECE2"
  on-surface: "#2A2431"
  on-surface-muted: "#67616E"
  outline: "#ECE4DA"
  primary: "#FF5C39"
  on-primary: "#FFFFFF"
  primary-strong: "#D63A1C"
  primary-container: "#FFE3D8"
  on-primary-container: "#7A2410"
  you: "#6B4EF0"
  on-you: "#FFFFFF"
  you-container: "#EBE6FF"
  on-you-container: "#3A1E8C"
  partner: "#D6337C"
  on-partner: "#FFFFFF"
  partner-container: "#FFE1EE"
  on-partner-container: "#84134F"
  success: "#2FA84F"
  on-success: "#FFFFFF"
  success-strong: "#1B8038"
  success-container: "#D8F2DE"
  on-success-container: "#134E25"
  freeze: "#3B9EE5"
  on-freeze: "#FFFFFF"
  freeze-container: "#DCEEFB"
  on-freeze-container: "#0B4F7E"
  error: "#D92D3A"
  on-error: "#FFFFFF"
typography:
  stat-number:
    fontFamily: Baloo 2
    fontSize: 60px
    fontWeight: "800"
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1"
  display:
    fontFamily: Baloo 2
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 1.1
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Baloo 2
    fontSize: 24px
    fontWeight: "800"
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Nunito
    fontSize: 19px
    fontWeight: "700"
    lineHeight: 1.25
  body-lg:
    fontFamily: Nunito
    fontSize: 17px
    fontWeight: "400"
    lineHeight: 1.5
  body-md:
    fontFamily: Nunito
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.5
  label-lg:
    fontFamily: Nunito
    fontSize: 17px
    fontWeight: "800"
    lineHeight: 1
  label-md:
    fontFamily: Nunito
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 1
  label-caps:
    fontFamily: Nunito
    fontSize: 12px
    fontWeight: "800"
    lineHeight: 1
    letterSpacing: 0.08em
rounded:
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin: 20px
components:
  button-checkin:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  button-checkin-pressed:
    backgroundColor: "#B42E13"
    textColor: "{colors.on-primary}"
  button-checkin-done:
    backgroundColor: "{colors.success-strong}"
    textColor: "{colors.on-success}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  button-secondary:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  streak-hero-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.stat-number}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  flame-lit:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
  flame-idle:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
  avatar-you:
    backgroundColor: "{colors.you-container}"
    textColor: "{colors.on-you-container}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    size: 48px
  avatar-you-checked:
    backgroundColor: "{colors.you}"
    textColor: "{colors.on-you}"
    rounded: "{rounded.full}"
    size: 48px
  avatar-partner:
    backgroundColor: "{colors.partner-container}"
    textColor: "{colors.on-partner-container}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    size: 48px
  avatar-partner-checked:
    backgroundColor: "{colors.partner}"
    textColor: "{colors.on-partner}"
    rounded: "{rounded.full}"
    size: 48px
  day-both:
    backgroundColor: "{colors.success-strong}"
    textColor: "{colors.on-success}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.md}"
    size: 40px
  day-half:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.md}"
    size: 40px
  day-today:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.md}"
    size: 40px
  day-missed:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.md}"
    size: 40px
  badge-freeze:
    backgroundColor: "{colors.freeze-container}"
    textColor: "{colors.on-freeze-container}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  input-field:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
---

## Overview

Duo Streak is a web app for exactly two people — you and your partner — to keep
a shared daily-exercise streak alive. It borrows its soul from Duolingo's Friend
Streak: **the day only counts when both of you check in.** One person alone
can't advance the streak, and that constraint is the entire emotional core of
the product. The design exists to make the shared commitment feel warm,
motivating, and just a little bit accountable — you don't want to be the reason
the flame goes out.

The personality is **friendly, chunky, and celebratory** — soft rounded shapes,
a hand-on-your-shoulder tone, and big tactile buttons that feel good to tap on a
phone. It should read as encouraging, never clinical or performance-obsessed:
this is a couple keeping a promise to each other, not an athlete chasing PRs.

It is **web-first and mobile-first by necessity** — the two of us use different
phone operating systems, so everything lives in the browser and must feel native
and thumb-friendly at 375px wide, scaling up gracefully to desktop. The single
most important screen is "today": two avatars, two check-in states, and one
shared flame.

## Colors

The system is built on one **shared flame color** plus **two personal colors** —
one per partner — so the interface can always answer "who's checked in?" at a
glance.

- **Primary / Flame (#FF5C39):** The warm coral of a lit streak flame. It is the
  brand's heartbeat: the flame icon, the live streak count, and active
  highlights. Because a bright coral can't carry white body text at AA,
  interactive fills use **Primary-strong (#D63A1C)** — a deeper ember reserved
  for the main check-in button and other solid CTAs.
- **You (#6B4EF0):** An electric violet representing the logged-in person. Used
  for your avatar, your check-in confirmation, and your half of any paired
  visual.
- **Partner (#D6337C):** A warm rose representing the other person. Used for
  their avatar and their side of the streak. Violet and rose are deliberately
  distinct in hue so the two of you are never confused, and neither color is a
  literal gender cue — assign them however you like.
- **Success (#2FA84F):** A confident green that appears **only** when *both*
  people have checked in and the day is secured. Its rarity is the point: green
  means "we did it today."
- **Freeze (#3B9EE5):** An icy blue for the streak-freeze / rest-day state,
  visually cool and calm — the opposite of the flame — so a protected day never
  looks like a failed one.
- **Neutrals:** **Surface (#FFFFFF)** for cards, **Surface-alt (#FBF6EF)** for
  the warm cream app background, and **Surface-sunken (#F3ECE2)** for empty and
  idle states. Ink is **On-surface (#2A2431)**, a soft warm near-black.
- **Error (#D92D3A):** A true red kept visually separate from the coral flame,
  used strictly for destructive actions and validation — never for a missed day.

## Typography

Two rounded faces share the work: **Baloo 2** (chunky, warm) carries display
moments — the brand, the streak number, headings, the check-in button — while
**Nunito** carries body copy and labels. Both have soft terminals that match the
friendly, Duolingo-adjacent personality without copying it.

- **Stat Number:** Nunito 800 with **tabular figures** for the big shared streak
  count. Tabular figures keep the number from shifting width as it ticks up (9 →
  10 → 100), so the hero never jitters.
- **Display & Headlines:** 800/700 weight for hero lines and section titles —
  chunky and confident, the visual equivalent of an encouraging voice.
- **Body:** Nunito 400 at 15–17px for supporting copy and streak history.
- **Labels:** 700–800 weight for buttons and chips. **Label-caps** is uppercase
  with generous tracking for tiny metadata like weekday initials and tags.

## Layout

A **single-column, mobile-first** layout on a **4px spacing grid** (surfaced as
an 8 / 16 / 24 / 40 scale). Content is centered with a **max width of 480px** on
larger screens rather than stretching edge-to-edge — the app should feel like the
same focused card whether it's on a phone or a laptop.

Screen margins are 20px. The "today" screen follows a fixed vertical rhythm:
shared flame + streak count up top, the two partner check-in states in the
middle, and the primary check-in button pinned within thumb reach at the bottom.
Related information is grouped into rounded cards with generous internal padding
(24px) so each unit feels self-contained and tappable.

## Elevation & Depth

Depth is **tactile, not blurry.** Instead of soft ambient shadows, primary
buttons use a **solid bottom "lip"** — a 4px offset in a darker shade of the same
color with zero blur — so they look like a physical key you can press. On tap the
lip compresses and the button nudges down, giving a satisfying, Duolingo-style
physical response.

Everything else stays flat: cards separate from the cream background by tone
alone (white surface on warm cream), and only truly floating elements — the
bottom action bar, modals, and celebration overlays — earn a soft shadow
(`0 6px 20px rgba(42,36,49,0.12)`). Elevation is a signal of interactivity, not
decoration.

## Shapes

The shape language is **soft and chunky.** Cards use a 24–32px radius, buttons
and avatars are fully rounded (pill and circle), day cells use a friendly 16px
radius, and inputs sit at 16px. Sharp corners appear nowhere — this is a warm,
encouraging space, and rounding everything keeps it feeling approachable and
huggable rather than rigid.

## Components

- **Check-in Button:** The primary CTA, filled with Primary-strong ember and
  white bold text, fully pill-shaped with the tactile bottom lip. After *you*
  check in it flips to **Check-in Done** (success green, "You're in ✓") and the
  UI shifts to a waiting state for your partner.
- **Flame:** A single shared flame that is **idle/grey (Flame-idle)** until both
  partners check in, then **ignites in coral (Flame-lit)** with a burst
  animation. The flame's state is the truest summary of the day.
- **Partner Avatars:** Two circular avatars, one per person, tinted with that
  person's container color when pending and filling with their full personal
  color (You violet / Partner rose) the moment they check in. This is the core
  "who's in?" indicator — always show both, side by side.
- **Day Cells (streak calendar):** Small rounded squares showing recent history
  with four distinct states: **both** (green, day secured), **half** (peach —
  only one person checked in, streak at risk), **today** (white with a coral
  outline), and **missed** (sunken grey). The *half* state is the most important
  to design clearly — it's the gentle nudge that says "your partner is waiting."
- **Freeze Badge:** A calm blue pill marking a protected rest day, so a
  deliberately skipped day reads as planned, not broken.
- **Input Field:** Cream-filled, borderless at rest, gaining a 2px coral focus
  ring — used sparingly (partner invite, profile name).

## Do's and Don'ts

- Do reserve **Success green** for the moment *both* people have checked in —
  never for a single person's check-in. Its scarcity is what makes it feel
  earned.
- Do always show **both** partners' states together on the today screen; the
  product is about the pair, never one person in isolation.
- Do design the **"half" state** (one checked in, one pending) as prominent and
  warm — it's a nudge, not a scolding.
- Don't use the error red for a missed day or a waiting partner; a lapse is a gap
  to close together, not an error.
- Don't mix sharp and rounded corners in the same view — everything rounds.
- Do use **Primary-strong (#D63A1C)** for any solid button carrying white text,
  and keep the bright **Primary (#FF5C39)** for the flame, icons, and accents
  where large size or bold weight preserves contrast.
- Do maintain WCAG AA contrast (4.5:1 for body text); the personal and primary
  fills are tuned to pass with white bold labels — don't set small body text on
  them.
- Don't use more than two font weights on a single screen.
