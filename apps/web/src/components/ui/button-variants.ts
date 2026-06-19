/**
 * button-variants.ts — the Button's cva style contract, with NO 'use client'.
 *
 * Kept separate from Button.tsx (a client component) so SERVER components — e.g. the
 * Nav/Footer rendering a styled <Link> — can compute button classes without importing
 * a client module (which would error: "called buttonVariants() from the server").
 * Both the client Button and server callers import these from here.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  cn(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-pill font-body font-semibold',
    'transition-colors duration-instant ease-standard',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
    'active:translate-y-px',
    'disabled:pointer-events-none aria-disabled:pointer-events-none',
    'disabled:bg-surface-subtle disabled:text-content-muted',
    'aria-disabled:bg-surface-subtle aria-disabled:text-content-muted',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-brand text-content-inverse hover:bg-brand-hover active:bg-brand-hover',
        accent: 'bg-accent text-content-primary hover:bg-accent-hover active:bg-accent-hover',
        secondary:
          'bg-surface-raised text-content-primary border border-line-default hover:bg-surface-subtle active:bg-surface-subtle',
        ghost: 'bg-transparent text-brand hover:bg-surface-subtle active:bg-surface-subtle',
        danger: 'bg-surface-danger text-content-danger hover:bg-surface-danger active:bg-surface-danger',
      },
      size: {
        sm: 'min-h-9 px-4 text-sm',
        md: 'min-h-11 px-5 text-base',
        lg: 'min-h-12 px-6 text-md',
      },
      iconOnly: {
        true: 'aspect-square px-0',
        false: '',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
      block: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
