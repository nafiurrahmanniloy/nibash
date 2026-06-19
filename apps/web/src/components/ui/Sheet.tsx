/**
 * Sheet.tsx — overlay panel: bottom-sheet on mobile, side panel on >= sm (design.md §4.4 host).
 *
 * SEVEN STATES (design.md §3) — the dialog surface + its dismiss control:
 *   default        : bg-surface-raised, rounded-md top corners (mobile) / left corners (side), shadow-soft-md.
 *   hover          : close button hover (bg-surface-subtle); pointer-only feedback.
 *   focus-visible  : every focusable inside shows focus-visible:ring-2 ring-focus ring-offset-2; close button too.
 *   active         : close button active:translate-y-px.
 *   disabled       : caller may disable inner controls; the sheet itself is not "disabled".
 *   loading        : caller renders a Spinner/Skeleton inside; aria-busy can be set by the caller on content.
 *   error          : caller renders danger content inside; the frame stays neutral.
 *
 * A11y: role="dialog" aria-modal="true" with aria-labelledby (title) / aria-describedby (optional). FOCUS TRAP
 *   keeps Tab/Shift+Tab within the panel; Esc closes; focus returns to the opener on close; backdrop click
 *   closes (configurable). Body scroll locked while open. Honors prefers-reduced-motion (transition collapses).
 */
'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Visible title (also the dialog's accessible name). */
  title: string;
  /** Optional supporting description, linked via aria-describedby. */
  description?: string;
  children: React.ReactNode;
  /** Sticky footer (e.g. a primary action). */
  footer?: React.ReactNode;
  /** Desktop placement; mobile is always a bottom sheet. */
  side?: 'right' | 'left';
  /** Allow closing by clicking the backdrop (default true). */
  dismissible?: boolean;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  dismissible = true,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const reactId = useId();
  const titleId = `sheet-title-${reactId}`;
  const descId = `sheet-desc-${reactId}`;

  // Lock body scroll + remember the opener for focus restoration.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the panel.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const activeEl = document.activeElement;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex pt-12 sm:pt-0" role="presentation">
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={dismissible ? onClose : undefined}
        className={cn(
          'absolute inset-0 bg-content-primary/40',
          'transition-opacity duration-fast ease-standard',
          !dismissible && 'cursor-default',
        )}
      />

      {/* Panel: bottom sheet on mobile, side panel from sm up */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative z-10 mt-auto flex max-h-full w-full flex-col bg-surface-raised shadow-soft-md',
          'rounded-t-md outline-none',
          'transition-transform duration-normal ease-standard',
          // Side panel from sm up
          'sm:mt-0 sm:h-full sm:w-full sm:max-w-md sm:rounded-none',
          side === 'right' ? 'sm:ml-auto sm:rounded-l-md' : 'sm:mr-auto sm:rounded-r-md',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line-default p-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold text-content-primary">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 font-body text-sm text-content-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-content-secondary',
              'transition-colors duration-instant ease-standard',
              'hover:bg-surface-subtle active:translate-y-px',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>

        {footer ? (
          <footer className="border-t border-line-default p-4">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
