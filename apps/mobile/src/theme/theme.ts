/**
 * theme.ts — native bridge to the @travela/shared design tokens.
 *
 * React Native can't consume the Tailwind preset (no className), so this file is the
 * RN equivalent of the token seam: it re-exports the SEMANTIC layer from
 * @travela/shared so screens reference `theme.color.surface.base` etc. — never a raw
 * hex, never a primitive (design.md §2.2 / §7). Web (Tailwind classes) and mobile
 * (this object) therefore derive from the same single source of truth.
 *
 * Spacing/radius/typography values are taken straight from the shared scale; RN wants
 * numbers, so px strings are converted once here.
 */
import { color, radius, spacing, typography } from '@travela/shared/tokens';

/** Strip a `"12px"` token to the number RN style props expect. */
const px = (value: string): number => Number.parseFloat(value);

export const theme = {
  color,
  /** Numeric spacing scale (4px base) — design.md §2.4. */
  space: {
    0: px(spacing[0]),
    1: px(spacing[1]),
    2: px(spacing[2]),
    3: px(spacing[3]),
    4: px(spacing[4]),
    5: px(spacing[5]),
    6: px(spacing[6]),
    7: px(spacing[7]),
    8: px(spacing[8]),
    9: px(spacing[9]),
  },
  radius: {
    sm: px(radius.sm),
    md: px(radius.md),
    pill: px(radius.pill),
  },
  /**
   * Type scale (design.md §2.3) as RN-ready px numbers. The shared scale stores rem
   * strings (a web/CSS unit); RN wants px, so the @16px base is resolved once here.
   * Values are kept in lockstep with `typography.scale` — no values outside the scale.
   */
  font: {
    family: typography.family,
    weight: typography.weight,
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      md: 18,
      lg: 20,
      xl: 24,
      '2xl': 30,
      '3xl': 36,
    },
    line: {
      xs: 16,
      sm: 20,
      base: 24,
      md: 28,
      lg: 28,
      xl: 32,
      '2xl': 36,
      '3xl': 40,
    },
  },
  /** Minimum primary touch target (design.md §4 / §6.4). */
  hitTarget: 44,
} as const;

export type Theme = typeof theme;
