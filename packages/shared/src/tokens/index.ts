/**
 * tokens/index.ts — barrel for the design-token layer.
 * CSS variables live in ./css-variables.css (import via "@nibash/shared/tokens/css-variables.css").
 */
export {
  tokens,
  primitive,
  color,
  typography,
  spacing,
  radius,
  shadow,
  motion,
  breakpoints,
  default as defaultTokens,
} from './tokens.js';
export type { Tokens, SemanticColor } from './tokens.js';

export { nibashPreset, default as tailwindPreset } from './tailwind-preset.js';
export type { TailwindPreset } from './tailwind-preset.js';
