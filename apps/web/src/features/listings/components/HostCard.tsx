/**
 * HostCard — compact host identity on a listing detail (design.md tokens).
 *
 * Presentational (Avatar + name + verified badge + optional CTA). The "Contact host"
 * action, when provided, is a real interactive control and implements the seven
 * states via ui/Button. Verified state is conveyed by text + icon, not color alone
 * (WCAG 1.4.1).
 */
import type { ListingHostDTO } from '@nibash/shared';
import { Avatar, Button } from '@/components/ui';

export interface HostCardProps {
  host: ListingHostDTO;
  /** Optional contact action; rendered as a primary-adjacent button when present. */
  onContact?: () => void;
  contactPending?: boolean;
}

export function HostCard({ host, onContact, contactPending }: HostCardProps) {
  const name = host.fullName ?? 'Your host';
  return (
    <section
      aria-label="Hosted by"
      className="flex items-center gap-4 rounded-md bg-surface-raised p-4 shadow-soft-sm"
    >
      <Avatar src={host.avatarUrl} name={name} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-content-primary">{name}</p>
        {host.identityVerified ? (
          <p className="flex items-center gap-1 text-sm text-content-secondary">
            <VerifiedIcon />
            <span>Identity verified</span>
          </p>
        ) : (
          <p className="text-sm text-content-muted">Host</p>
        )}
      </div>
      {onContact ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onContact}
          loading={contactPending}
        >
          Contact host
        </Button>
      ) : null}
    </section>
  );
}

function VerifiedIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand"
    >
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
