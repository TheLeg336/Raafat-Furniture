---
name: Raafat Furniture
description: Bilingual luxury furniture storefront — champagne gold on midnight navy, the gilded atelier.
colors:
  champagne-gold: "#E8C547"
  champagne-gold-dark: "#F0B429"
  midnight-navy: "#14213D"
  gilt-success: "#DAB449"
  ink: "#1A202C"
  slate-muted: "#4A5568"
  pure-white: "#FFFFFF"
  atelier-charcoal: "#1A202C"
  warm-pearl: "#E5E5E5"
  ash-muted: "#A9A9A9"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  arabic:
    fontFamily: "Cairo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
rounded:
  lg: "8px"
  xl: "12px"
  3xl: "24px"
  full: "9999px"
spacing:
  gutter: "24px"
  section-sm: "64px"
  section-md: "80px"
  section-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.champagne-gold}"
    textColor: "{colors.midnight-navy}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.champagne-gold-dark}"
    textColor: "{colors.midnight-navy}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "#00000000"
    textColor: "{colors.champagne-gold}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  input-field:
    backgroundColor: "#00000000"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  card-category:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: "0px"
---

# Design System: Raafat Furniture

## 1. Overview

**Creative North Star: "The Gilded Atelier"**

Raafat Furniture is a craftsman's studio rendered as an interface — warm, considered, and quietly opulent. Champagne gold appears the way gilt appears on dark wood: as a deliberate detail, never a coating. Midnight navy is the velvet the pieces rest against; the furniture photography is the hero, and the chrome steps back to frame it. The system is bilingual to the bone (English LTR and Arabic RTL) and dual-themed (a bright daylight showroom and a candlelit evening room), and each variant is treated as first-class, not a translation bolted on.

The personality is elegant, timeless-but-modern, and premium. Modern materials — backdrop blur, spring motion, a slow theme cross-dissolve — are present, but earned: they sharpen perception or reward a gesture, never decorate for their own sake. Restraint reads as the luxury here. Gold is punctuation; if a screen feels gold-coated, it has failed.

This system explicitly rejects three things. **Trendy AI-SaaS slop**: cream/beige bodies, tracked-uppercase eyebrows over every section, identical icon-heading-text card grids, gradient text. **Generic IKEA / big-box**: cluttered product walls, loud sale banners, warehouse density. **Cold, sterile minimalism**: the empty all-white art gallery that feels lifeless. This is a warm home for furniture, not a museum and not a warehouse.

**Key Characteristics:**
- Champagne gold + midnight navy on a clean white (day) or charcoal (night) ground.
- Cormorant Garamond serif display over Inter body; Cairo carries Arabic in both roles.
- Soft, rounded-luxe geometry: pill CTAs, 24px card corners, 12px inputs.
- Spring-based, exponential-ease motion; a signature shine sweep and morphing search pill.
- Full EN/AR + light/dark parity, WCAG AA as the floor.

## 2. Colors

A two-color identity — warm gold against deep navy — grounded on a near-neutral surface that flips between daylight white and evening charcoal.

### Primary
- **Champagne Gold** (#E8C547 day / #F0B429 night): The brand's single accent. Used on primary CTAs, active nav state, the nav-link underline, focus rings, cart badge, and small gilt details. Slightly brighter at night to hold presence against charcoal. It is punctuation, never a fill — see The Gilt Rule.

### Secondary
- **Midnight Navy** (#14213D): The velvet backdrop. Carries category-card grounds, image mounts, and dark structural surfaces in both themes. The one color that does not flip between light and dark — it anchors the brand across both.

### Tertiary
- **Gilt Success** (#DAB449 day / #F0B429 night): A muted gold-adjacent tone reserved for success and confirmation states, so positive feedback stays inside the brand's metal family rather than jumping to a generic green.

### Neutral
- **Ink** (#1A202C): Primary text in light theme; also the charcoal *background* in dark theme — the same value plays both roles across themes.
- **Slate Muted** (#4A5568): Secondary text in light theme (≈7:1 on white — safe for body).
- **Warm Pearl** (#E5E5E5): Primary text in dark theme.
- **Ash Muted** (#A9A9A9): Secondary text in dark theme (≈5.3:1 on charcoal — safe for body).
- **Pure White** (#FFFFFF): Light-theme background and the surface behind glass panels.

### Named Rules
**The Gilt Rule.** Champagne gold covers ≤10% of any screen. It is gilt on dark wood — a detail, an edge, a single CTA — never a background fill or a section wash. The rarity is the luxury.

**The Ink-on-Gold Rule.** Text on a gold surface is **midnight navy (#14213D) or near-black ink — never white**. White on champagne gold lands near 1.6:1 and fails AA outright; navy-on-gold clears it and reads richer. This applies to every CTA label, badge, and chip.

**The Constant-Navy Rule.** Midnight navy never flips between themes. White and ink swap day-for-night; navy stays, so the brand reads continuously across both modes.

## 3. Typography

**Display Font:** Cormorant Garamond (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Arabic Font:** Cairo (with system-ui fallback) — carries *both* display and body when language is Arabic.

**Character:** A high-contrast pairing — the tall, calligraphic Cormorant serif for everything expressive (hero, headings, nav, language toggle), the neutral Inter grotesque for everything functional (body, inputs, fine print). The serif supplies the atelier warmth; the sans keeps the shopping flows legible and modern. In Arabic, Cairo replaces both: a single humanist Arabic family across the whole hierarchy, so RTL never falls back to a mismatched system serif.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 6vw, 6rem)`, line-height 1.05): Hero headline only. Capped at 6rem — the page designs, it does not shout. Use `text-wrap: balance`.
- **Headline** (700, `clamp(1.75rem, 4vw, 3rem)`, line-height 1.15): Section titles (Shop, About, Visit Us).
- **Title** (600, 1.25rem, line-height 1.3): Category names, card titles, product names.
- **Body** (400, 1rem, line-height 1.6): Inter. Descriptions, paragraphs, form text. Cap measure at 65–75ch; use `text-wrap: pretty` on long prose.
- **Label** (700, 0.875rem, letter-spacing 0.1em, UPPERCASE): Inter. The CTA microcopy ("EXPLORE"), reserved for short interactive labels only.

### Named Rules
**The Serif-Voice Rule.** Cormorant carries voice (hero, headings, nav, toggles); Inter carries function (body, inputs, prices, fine print). Never set a paragraph in Cormorant or a heading in Inter.

**The One-Family-Arabic Rule.** When `lang="ar"`, Cairo replaces the entire stack — no Cormorant, no Inter. RTL parity means Arabic gets its own coherent voice, not a serif-for-headings split that Arabic type doesn't want.

## 4. Elevation

A hybrid system. Surfaces are flat at rest; depth arrives as a *response* — to hover, to stacking, to focus. Two distinct shadow languages coexist: neutral black shadows for structural lift (drawers, modals, sticky headers) and **colored gold-tinted shadows** for accent elements (the primary CTA glows gold, not gray). Glass — `backdrop-blur` over a translucent ground — is reserved for layers that float over content (the header, the morphing search pill, the auth panel), never as decorative card filler.

### Shadow Vocabulary
- **Rest lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)` — `shadow-sm`): The sticky header at rest.
- **Hover lift** (`box-shadow: 0 4px 6px rgba(0,0,0,0.1)` — `shadow-md`): Sticky section header once pinned; card hover.
- **Gold glow** (`box-shadow: 0 10px 15px hsla(47,81%,60%,0.2)` — `shadow-lg shadow-[primary]/20`): Primary CTAs and checkout button. The signature — accent elements cast their own color.
- **Float** (`box-shadow: 0 25px 50px rgba(0,0,0,0.25)` — `shadow-2xl`): Cart drawer, mobile menu, modals — the highest tier.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow is a state, not a decoration — it answers hover, focus, or elevation. If a card sits shadowed at rest for no reason, delete the shadow.

**The Colored-Glow Rule.** Accent elements cast accent-colored shadows (gold at ~20% alpha), never neutral gray. Structural surfaces (drawers, modals) cast neutral black. Don't mix them.

**The Purposeful-Glass Rule.** Glass (`backdrop-blur`) is for floating layers only — header, search pill, auth panel. It is forbidden as a decorative treatment on static cards; that is the glassmorphism-as-default ban.

## 5. Components

### Buttons
- **Shape:** Fully pill (`rounded-full`, 9999px). Soft, rounded-luxe — the house geometry.
- **Primary:** Champagne gold ground, **navy/ink label** (per The Ink-on-Gold Rule), `font-bold`, padding `12px 24px` (CTAs `16px+`). Casts the gold glow.
- **Hover / Focus:** Background shifts to the deeper night-gold (#F0B429) or `/90` opacity; gold glow intensifies; `:focus-visible` shows a 2px gold ring. Spring scale on tap (`whileTap` 0.95).
- **Secondary / Ghost:** Transparent ground, 2px champagne-gold border, gold label; hover fills gold at 5% (`bg-primary/5`). No shadow.

### Cards / Containers
- **Corner Style:** `rounded-3xl` (24px) for category and product cards; `rounded-xl` (12px) for panels and small surfaces.
- **Background:** Category cards mount imagery on a **midnight-navy** ground (the velvet), image `object-cover` at `aspect-[4/5]`, with a black/10 overlay that clears on hover.
- **Shadow Strategy:** Flat at rest; `shadow-xl` on hover (see Elevation). Card lifts on hover via spring (`scale 1.03, y: -8`).
- **Border:** None by default; depth is the navy ground plus the hover lift.
- **Internal Padding:** Image is edge-to-edge; the title sits *below* the card (`mt-auto`), not inside it.

### Inputs / Fields
- **Style:** Transparent ground, 1px border at `secondary/30` (navy, 30% alpha), `rounded-xl` (12px), padding `12px 16px`. Logical properties (`ps-`/`pe-`) so padding mirrors correctly in RTL.
- **Focus:** 2px gold focus ring (`focus:ring-2 ring-primary`) and the border goes transparent — the ring becomes the edge. Smooth `transition-all`.
- **Error:** Red-500 text on a `red-500/10` tint with a `red-500/50` border, `rounded-lg`. The only sanctioned non-brand color, and only for errors.

### Navigation
- **Style:** Cormorant serif (`font-heading`), `text-lg`, `font-medium`, `tracking-wide`. Desktop = centered three-column grid (nav · logo · controls).
- **States:** Default ink; hover shifts to gold *and* draws a gold underline that scales in from center (`scaleX 0→1`) on a gentle overshoot ease (`cubic-bezier(0.175,0.885,0.32,1.275)`). Active language/route = solid gold.
- **Mobile:** Hamburger morphs to an X (spring), a `black/60 backdrop-blur-sm` scrim, and an off-canvas panel (`80vw`, `rounded-e-3xl`, `shadow-2xl`) that slides from the start edge — direction respects `dir="rtl"`. Links stagger in.

### Signature: The Morphing Search Pill (Hero)
The hero CTA is a single gold pill reading "EXPLORE". On click it spring-morphs (framer `layout`, stiffness 300 / damping 35) into a full glass search field — `search-gloss` gradient + `backdrop-blur-lg` — with the label cross-fading out and the input fading in. Escape or click-outside collapses it back. A hidden pre-render twin forces the browser to compute the expensive blur/gradient on load so the first morph never janks. This is the brand's one piece of choreography; treat it as the hero's centerpiece.

### Signature: The Shine Sweep
A `::after` linear-gradient highlight sweeps diagonally across the element once on load (`shine-onload`, 2s) and again on hover (0.9s). Applied to the header and primary surfaces for a subtle gilt catch-the-light moment. The sweep angle and direction invert under `dir="rtl"`.

## 6. Do's and Don'ts

### Do:
- **Do** keep champagne gold to ≤10% of any screen — gilt on dark wood, never a wash (The Gilt Rule).
- **Do** set text on gold in **midnight navy / ink, never white** — white on gold fails AA (The Ink-on-Gold Rule).
- **Do** let the furniture photography be the hero; chrome recedes behind it.
- **Do** use Cormorant for voice (hero, headings, nav) and Inter for function (body, inputs, prices).
- **Do** swap the entire type stack to Cairo when `lang="ar"`, and mirror padding with logical properties (`ps-`/`pe-`).
- **Do** keep navy constant across light and dark; only white/ink flip.
- **Do** cast gold-tinted glows on accent elements and neutral shadows on structural ones.
- **Do** give every animation a `prefers-reduced-motion: reduce` fallback (crossfade or instant).
- **Do** verify body text ≥4.5:1 and large text ≥3:1 in *both* themes before shipping.

### Don't:
- **Don't** ship trendy AI-SaaS slop: cream/beige bodies, tracked-uppercase eyebrows over every section, identical icon-heading-text card grids, gradient text (`background-clip: text`).
- **Don't** drift into generic IKEA / big-box: cluttered product walls, loud sale banners, warehouse density.
- **Don't** go cold, sterile, all-white gallery-empty — this is a warm home for furniture, not a museum.
- **Don't** use glass (`backdrop-blur`) as decorative card filler; reserve it for floating layers (header, search pill, auth panel).
- **Don't** put white text on champagne gold, anywhere.
- **Don't** set body copy in Cormorant or headings in Inter.
- **Don't** use a colored side-stripe border (`border-left > 1px`) as an accent; use full borders or background tints.
- **Don't** leave shadows on at-rest surfaces for decoration — a shadow is a state.
- **Don't** over-gild: heavy gold everywhere, gold gradients, and gold-on-gold read as gaudy, the opposite of the brief.
