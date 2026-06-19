import type { Config } from 'tailwindcss';
import { nibashPreset } from '@nibash/shared/tokens/tailwind-preset';

/**
 * tailwind.config.ts — web Tailwind config.
 * Consumes the shared preset (single source of token class names) and wires the
 * next/font CSS variables (--font-body / --font-display set in app/layout.tsx) into
 * the font families so `font-body` / `font-display` resolve to the loaded fonts.
 */
const config: Config = {
  presets: [nibashPreset as unknown as Partial<Config>],
  content: [
    './app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: [
          'var(--font-display)',
          'Bricolage Grotesque',
          'Inter',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
