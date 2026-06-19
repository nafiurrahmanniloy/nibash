/**
 * tokens.ts — design.md §2 compiled to a typed, frozen JS object.
 *
 * Three layers exist in design.md: primitive (raw palette) → semantic (used everywhere)
 * → component. Components MUST reference the SEMANTIC layer only (never `primitive`,
 * never raw hex). The primitive layer is exported for token-tooling/reference only.
 *
 * This is the single source of truth that css-variables.css and tailwind-preset.ts
 * are derived from — keep all three in lockstep.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * 2.1 Primitive tokens — the raw palette. DO NOT use directly in components.
 * ────────────────────────────────────────────────────────────────────────── */
export const primitive = {
  green: {
    700: '#0A4537',
    600: '#0E5C4A',
    100: '#E3EFE9',
    success: '#0E7A4F',
  },
  amber: {
    500: '#E8902B',
    600: '#C9761B',
    100: '#FBE8D1',
  },
  cream: {
    50: '#F6F4EF',
  },
  white: '#FFFFFF',
  ink: {
    900: '#16201C',
    600: '#3B463F',
    400: '#6B7A72',
  },
  line: {
    200: '#E4E0D7',
  },
  red: {
    600: '#B42318',
    100: '#FDE8E5',
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * 2.2 Semantic tokens — use these everywhere.
 * ────────────────────────────────────────────────────────────────────────── */
export const color = {
  surface: {
    base: primitive.cream[50], // page background
    raised: primitive.white, // cards, sheets, inputs
    brand: primitive.green[600], // brand fills, primary buttons
    brandHover: primitive.green[700],
    subtle: primitive.green[100], // tints, selected chips
    danger: primitive.red[100],
  },
  text: {
    primary: primitive.ink[900], // body + headings on light surfaces
    secondary: primitive.ink[600], // supporting copy, metadata
    muted: primitive.ink[400], // placeholders, disabled-adjacent labels
    inverse: primitive.white, // text on brand / dark fills
    brand: primitive.green[600], // links, brand emphasis
    price: primitive.green[700], // BDT price emphasis
    danger: primitive.red[600],
  },
  border: {
    default: primitive.line[200],
    strong: primitive.ink[400],
    brand: primitive.green[600],
    focus: primitive.green[700], // see §6 focus ring
  },
  action: {
    // Amber FAILS AA as body text on light — fills, icons, borders, ≥24px/bold display only.
    accent: primitive.amber[500], // non-primary CTAs, rating star, badges
    accentHover: primitive.amber[600],
  },
  status: {
    success: primitive.green.success,
    error: primitive.red[600],
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * 2.3 Typography
 * ────────────────────────────────────────────────────────────────────────── */
export const typography = {
  family: {
    // Used with restraint: H1–H2, hero, price.
    display: '"Bricolage Grotesque", "Inter", sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  /** Type scale (rem @ 16px base). No values outside this scale. [fontSize, lineHeight] */
  scale: {
    xs: { size: '0.75rem', line: '1rem' }, // 12/16 labels, captions
    sm: { size: '0.875rem', line: '1.25rem' }, // 14/20 metadata, secondary
    base: { size: '1rem', line: '1.5rem' }, // 16/24 body default
    md: { size: '1.125rem', line: '1.75rem' }, // 18/28 lead paragraphs
    lg: { size: '1.25rem', line: '1.75rem' }, // 20/28 card titles
    xl: { size: '1.5rem', line: '2rem' }, // 24/32 section headings
    '2xl': { size: '1.875rem', line: '2.25rem' }, // 30/36 page H2 (display)
    '3xl': { size: '2.25rem', line: '2.5rem' }, // 36/40 page H1 (display)
    '4xl': { size: '3rem', line: '1' }, // 48 hero (display)
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * 2.4 Spacing scale (4px base — no one-off values)
 * ────────────────────────────────────────────────────────────────────────── */
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * 2.5 Radius, shadow, motion
 * ────────────────────────────────────────────────────────────────────────── */
export const radius = {
  sm: '10px', // inputs, chips
  md: '18px', // cards, sheets, images (signature card radius)
  pill: '9999px', // pills, category chips, avatar
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(10,69,55,.06)',
  md: '0 6px 20px rgba(10,69,55,.08)', // soft, low-opacity, green-tinted
  focus: '0 0 0 3px rgba(14,92,74,.35)', // focus ring halo
} as const;

export const motion = {
  duration: {
    instant: '150ms', // hovers, color/opacity
    fast: '300ms', // small layout, dropdowns
    normal: '500ms', // sheets, page-level transitions
  },
  ease: {
    standard: 'cubic-bezier(.2,0,0,1)',
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Breakpoints (design.md §5)
 * ────────────────────────────────────────────────────────────────────────── */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

/** The full design-token tree, frozen. */
export const tokens = {
  primitive,
  color,
  typography,
  spacing,
  radius,
  shadow,
  motion,
  breakpoints,
} as const;

export type Tokens = typeof tokens;
export type SemanticColor = typeof color;

export default tokens;
