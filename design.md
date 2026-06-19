# design.md — Stay Platform Design System

> **Source of truth for Phase 0 tokens.** Original brand identity (not Nibash's visual
> skin), governed by Nibash's structural discipline: semantic tokens only, every component
> defines all seven states, WCAG 2.2 AA is non-negotiable, no one-off spacing or type.
>
> Reconciles `BUILD-PLAN-stay-platform.md` §2 (visual identity) with the Nibash `Design.imd`
> rules (token discipline, state matrix, a11y acceptance criteria, motion/spacing scales).

---

## 1. Design intent

A warm, trustworthy short-stay marketplace: cream canvas, deep-green brand, amber for action
and price emphasis — calm enough to read long listing pages, confident enough to convert a
booking. Implementation-oriented and token-driven so web and Expo share one vocabulary.

---

## 2. Token architecture

Three layers. **Components reference semantic tokens only — never primitives, never raw hex.**

### 2.1 Primitive tokens (the raw palette — do not use directly in components)

```
--green-700:#0A4537   --green-600:#0E5C4A   --green-100:#E3EFE9
--amber-500:#E8902B   --amber-600:#C9761B   --amber-100:#FBE8D1
--cream-50:#F6F4EF    --white:#FFFFFF
--ink-900:#16201C     --ink-600:#3B463F     --ink-400:#6B7A72
--line-200:#E4E0D7
--red-600:#B42318     --red-100:#FDE8E5
--green-success:#0E7A4F
```

### 2.2 Semantic tokens (use these everywhere)

```
# Surfaces
color.surface.base       = --cream-50      page background
color.surface.raised     = --white         cards, sheets, inputs
color.surface.brand      = --green-600      brand fills, primary buttons
color.surface.brand-hover= --green-700
color.surface.subtle     = --green-100      tints, selected chips
color.surface.danger     = --red-100

# Text
color.text.primary       = --ink-900        body + headings on light surfaces
color.text.secondary     = --ink-600        supporting copy, metadata
color.text.muted         = --ink-400        placeholders, disabled-adjacent labels
color.text.inverse       = --white          text on brand / dark fills
color.text.brand         = --green-600      links, brand emphasis
color.text.price         = --green-700      BDT price emphasis
color.text.danger        = --red-600

# Borders & lines
color.border.default     = --line-200
color.border.strong      = --ink-400
color.border.brand       = --green-600
color.border.focus       = --green-700      see §6 focus ring

# Action / accent
color.action.accent      = --amber-500      CTAs that aren't the primary brand button, rating star, badges
color.action.accent-hover= --amber-600

# Status
color.status.success     = --green-success
color.status.error       = --red-600
```

> **Contrast (verified, AA):** `text.primary #16201C` on `surface.base #F6F4EF` ≈ 13.5:1;
> `text.inverse #FFFFFF` on `surface.brand #0E5C4A` ≈ 6.7:1; `text.danger #B42318` on white
> ≈ 6.4:1. **Amber `#E8902B` fails AA as text on light** — use it for fills, icons, borders,
> and ≥24px/bold display only, never for body-size text on cream/white.

### 2.3 Typography

```
font.family.display = "Bricolage Grotesque", "Inter", sans-serif   # used with restraint: H1–H2, hero, price
font.family.body    = "Inter", system-ui, sans-serif
font.weight.regular = 400   .medium = 500   .semibold = 600   .bold = 700

# Type scale (rem @ 16px base) — no values outside this scale
text.xs   = 0.75rem / 1rem     (12/16)   labels, captions
text.sm   = 0.875rem / 1.25rem (14/20)   metadata, secondary
text.base = 1rem / 1.5rem      (16/24)   body default
text.md   = 1.125rem / 1.75rem (18/28)   lead paragraphs
text.lg   = 1.25rem / 1.75rem  (20/28)   card titles
text.xl   = 1.5rem / 2rem      (24/32)   section headings
text.2xl  = 1.875rem / 2.25rem (30/36)   page H2  (display)
text.3xl  = 2.25rem / 2.5rem   (36/40)   page H1  (display)
text.4xl  = 3rem / 1            (48)      hero     (display)
```

### 2.4 Spacing scale (4px base — no one-off values)

```
space.0=0  space.1=4px  space.2=8px  space.3=12px  space.4=16px
space.5=24px  space.6=32px  space.7=48px  space.8=64px  space.9=96px
```

### 2.5 Radius, shadow, motion

```
radius.sm  = 10px     inputs, chips
radius.md  = 18px     cards, sheets, images   (signature card radius)
radius.pill= 9999px   pills, category chips, avatar

shadow.sm  = 0 1px 2px rgba(10,69,55,.06)
shadow.md  = 0 6px 20px rgba(10,69,55,.08)        # soft, low-opacity, green-tinted
shadow.focus = 0 0 0 3px rgba(14,92,74,.35)       # focus ring halo

motion.duration.instant = 150ms   hovers, color/opacity
motion.duration.fast    = 300ms   small layout, dropdowns
motion.duration.normal  = 500ms   sheets, page-level transitions
motion.ease.standard    = cubic-bezier(.2,0,0,1)
# Honor prefers-reduced-motion: collapse all to ≤1ms, keep no essential info motion-only.
```

---

## 3. Component state matrix (mandatory)

**Every interactive component must define all seven states.** Shipping a component without an
explicit rule for each is a blocked PR.

| State | Required rule |
|---|---|
| default | base tokens |
| hover | pointer-only feedback (color/elevation shift via `motion.instant`); never the sole affordance |
| focus-visible | `shadow.focus` ring + `border.focus`; visible on keyboard nav, ≥3:1 against adjacent colors |
| active | pressed/depressed treatment (darker fill or inset) |
| disabled | `text.muted` + reduced surface; `aria-disabled`; not focusable if non-actionable; ≥3:1 still required for understanding |
| loading | spinner/skeleton, `aria-busy="true"`, control non-interactive, width preserved (no layout shift) |
| error | `border.strong→danger`, `text.danger` message wired via `aria-describedby` + `aria-invalid` |

---

## 4. Signature components

### 4.1 Button
- Variants: **primary** (`surface.brand` / `text.inverse`), **accent** (`action.accent` / `ink-900`),
  **secondary** (`surface.raised` + `border.default`), **ghost** (text-only), **danger**.
- Padding `space.3 space.5`, `radius.pill`, `text.base/.semibold`, min target **44×44px**.
- All seven states per §3. Hover darkens to `*-hover` token. Loading swaps label for spinner,
  keeps width. Icon-only buttons require `aria-label`.

### 4.2 Listing card (the marketplace primitive)
- Anatomy: image (`radius.md`, 4:3, `loading="lazy"`), favorite toggle (top-right, 44px target),
  title `text.lg`, area/`text.sm/secondary`, rating (amber star + value), **price `text.price` bold + “/night” `text.sm/muted`**.
- Whole card is one link; favorite is a nested button (stop propagation, own focus ring).
- **Long content:** title clamps to 2 lines, area to 1. **Empty:** skeleton at `radius.md`, no CLS.
- States: hover lifts `shadow.sm→shadow.md`; focus-visible ring on the card link.

### 4.3 Category chip / filter pill
- `radius.pill`, `border.default`; selected = `surface.subtle` + `border.brand` + `text.brand`.
- Keyboard: Tab to each; Space/Enter toggles; `aria-pressed`. Touch target ≥44px incl. padding.

### 4.4 Booking widget
- Inputs: dates, guests; sticky on desktop, bottom-sheet on mobile.
- Price breakdown (base × nights, service fee, total) right-aligned, total in `text.price`.
- CTA = primary button → "Request to book". Inline error per §3 if dates invalid/unavailable.
- Loading state during availability check; disabled until valid range chosen.

### 4.5 Input / form field
- Label always visible (never placeholder-as-label), `text.sm/medium`.
- `radius.sm`, `border.default`; focus → `border.focus` + `shadow.focus`; error → `border` danger +
  message `text.danger` linked by `aria-describedby`, field `aria-invalid="true"`.

### 4.6 Bottom nav (app + mobile web)
- Explore / Booking / Inbox / Alerts / Profile. Active item `text.brand` + filled icon + label;
  others `text.muted`. `role="navigation"`, current = `aria-current="page"`, 44px targets.

---

## 5. Responsive & edge cases (apply to every component)
- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280`. Mobile-first.
- Define **long-content** (clamp/wrap/scroll), **overflow** (ellipsis or scroll, never silent cut),
  and **empty-state** (skeleton or message + action) for any data-driven component.
- Currency: BDT, `৳` prefix, thousands separators (`Asia/Dhaka`, English v1).

---

## 6. Accessibility — testable acceptance criteria (WCAG 2.2 AA)
Each is pass/fail in implementation/CI:
1. **Contrast:** body text ≥ 4.5:1, large/UI ≥ 3:1 — automated check passes (no amber body text).
2. **Focus-visible:** every interactive element shows a visible ring (`shadow.focus`); manual Tab pass shows focus never disappears (WCAG 2.4.11).
3. **Keyboard:** all flows (search → filter → open listing → request booking) operable keyboard-only; no trap; logical order.
4. **Targets:** interactive targets ≥ 24×24px (AA 2.5.8); primary actions ≥ 44×44px.
5. **Names/roles:** icon-only controls have `aria-label`; inputs have associated `<label>`; landmarks present.
6. **State conveyed non-visually:** error/selected/loading exposed via ARIA (`aria-invalid`, `aria-pressed`, `aria-busy`) — not color alone (1.4.1).
7. **Reduced motion:** `prefers-reduced-motion` honored; no essential info conveyed by motion only.

---

## 7. Anti-patterns (prohibited)
- ❌ Raw hex or primitive tokens in components — semantic tokens only.
- ❌ One-off spacing/type values outside §2.3–2.4.
- ❌ Amber as body-size text on light surfaces (fails AA).
- ❌ Placeholder used as the only label.
- ❌ Hover/color as the only affordance; hidden or removed focus outlines (`outline:none` without a replacement ring).
- ❌ Shipping a component without an explicit rule for all seven states.
- ❌ Ambiguous labels ("Click here", "Submit") — use descriptive actions ("Request to book").

---

## 8. QA checklist (per component, before merge)
- [ ] Uses only semantic tokens (§2.2) — no raw hex, no primitives.
- [ ] Spacing/type values all from §2.3–2.4.
- [ ] All seven states (§3) implemented and visually verified.
- [ ] Keyboard, pointer, and touch behavior documented and working (≥44px primary targets).
- [ ] Long-content, overflow, and empty states handled.
- [ ] Contrast checks pass AA; focus ring visible; ARIA states wired.
- [ ] `prefers-reduced-motion` respected.
- [ ] Responsive at sm/md/lg/xl with no layout shift on load.
