/**
 * tailwind-preset.ts — the shared Tailwind preset that produces the EXACT token
 * class names used across web and mobile (nativewind).
 *
 * Consumed via: `presets: [nibashPreset]` in each app's tailwind.config.
 *
 * The color/radius/shadow/font keys below are chosen so Tailwind emits precisely:
 *   bg-surface-base bg-surface-raised bg-surface-subtle bg-brand bg-brand-hover
 *   bg-accent bg-accent-hover bg-surface-danger
 *   text-content-primary text-content-secondary text-content-muted text-content-inverse
 *   text-brand text-price text-content-danger text-accent
 *   border-line-default border-line-strong border-brand border-focus
 *   rounded-sm rounded-md rounded-pill
 *   shadow-soft-sm shadow-soft-md  ·  ring-focus
 *   font-display font-body
 *   duration-instant duration-fast duration-normal
 *
 * Note: `brand`, `accent`, `price`, `focus` are top-level color scales so that
 *   - bg-brand / text-brand / border-brand / ring-focus all resolve, and
 *   - surface.* / content.* / line.* give the namespaced classes above.
 * Values are kept identical to tokens.ts and css-variables.css.
 */

import { color, motion, primitive, radius, shadow, typography } from './tokens.js';

/** Minimal structural type for a Tailwind preset (avoids a hard tailwindcss dep). */
export interface TailwindPreset {
  theme: {
    extend: {
      colors: Record<string, unknown>;
      borderRadius: Record<string, string>;
      boxShadow: Record<string, string>;
      fontFamily: Record<string, string[]>;
      fontSize: Record<string, [string, { lineHeight: string }]>;
      transitionDuration: Record<string, string>;
      transitionTimingFunction: Record<string, string>;
      ringColor: Record<string, string>;
      screens: Record<string, string>;
    };
  };
}

const fontStack = (value: string): string[] =>
  value.split(',').map((part) => part.trim().replace(/^["']|["']$/g, ''));

export const nibashPreset: TailwindPreset = {
  theme: {
    extend: {
      colors: {
        // Namespaced surfaces → bg-surface-base, bg-surface-raised, bg-surface-subtle, bg-surface-danger
        surface: {
          base: color.surface.base,
          raised: color.surface.raised,
          subtle: color.surface.subtle,
          brand: color.surface.brand,
          'brand-hover': color.surface.brandHover,
          danger: color.surface.danger,
        },
        // Namespaced text → text-content-primary, text-content-secondary, text-content-muted, text-content-inverse, text-content-danger
        content: {
          primary: color.text.primary,
          secondary: color.text.secondary,
          muted: color.text.muted,
          inverse: color.text.inverse,
          danger: color.text.danger,
        },
        // Borders → border-line-default, border-line-strong
        line: {
          default: color.border.default,
          strong: color.border.strong,
        },
        // Top-level brand scale → bg-brand, bg-brand-hover, text-brand, border-brand
        brand: {
          DEFAULT: color.surface.brand,
          hover: color.surface.brandHover,
        },
        // Top-level accent scale → bg-accent, bg-accent-hover, text-accent
        accent: {
          DEFAULT: color.action.accent,
          hover: color.action.accentHover,
        },
        // text-price (BDT emphasis)
        price: {
          DEFAULT: color.text.price,
        },
        // border-focus, ring-focus
        focus: {
          DEFAULT: color.border.focus,
        },
        // status helpers (non-required, but available): text-status-success / text-status-error
        status: {
          success: color.status.success,
          error: color.status.error,
        },
        // primitive escape hatch for config-level use only (not for components)
        danger: {
          DEFAULT: primitive.red[600],
        },
      },
      borderRadius: {
        sm: radius.sm, // 10px
        md: radius.md, // 18px
        pill: radius.pill, // 9999px
      },
      boxShadow: {
        'soft-sm': shadow.sm,
        'soft-md': shadow.md,
        focus: shadow.focus,
      },
      fontFamily: {
        display: fontStack(typography.family.display),
        body: fontStack(typography.family.body),
      },
      fontSize: {
        xs: [typography.scale.xs.size, { lineHeight: typography.scale.xs.line }],
        sm: [typography.scale.sm.size, { lineHeight: typography.scale.sm.line }],
        base: [typography.scale.base.size, { lineHeight: typography.scale.base.line }],
        md: [typography.scale.md.size, { lineHeight: typography.scale.md.line }],
        lg: [typography.scale.lg.size, { lineHeight: typography.scale.lg.line }],
        xl: [typography.scale.xl.size, { lineHeight: typography.scale.xl.line }],
        '2xl': [typography.scale['2xl'].size, { lineHeight: typography.scale['2xl'].line }],
        '3xl': [typography.scale['3xl'].size, { lineHeight: typography.scale['3xl'].line }],
        '4xl': [typography.scale['4xl'].size, { lineHeight: typography.scale['4xl'].line }],
      },
      transitionDuration: {
        instant: motion.duration.instant, // 150ms
        fast: motion.duration.fast, // 300ms
        normal: motion.duration.normal, // 500ms
      },
      transitionTimingFunction: {
        standard: motion.ease.standard,
      },
      // ring-focus for the focus-visible halo
      ringColor: {
        focus: color.border.focus,
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
};

export default nibashPreset;
