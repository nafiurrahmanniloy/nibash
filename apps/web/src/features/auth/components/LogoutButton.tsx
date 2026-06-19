'use client';
/**
 * LogoutButton — signs out then refreshes server components so the nav reflects it.
 *
 * Seven states inherited from ui/Button (default/hover/focus-visible/active/disabled);
 * loading → isPending spinner while the logout action runs.
 */
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { logoutAction } from '../actions.js';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          router.push('/');
          router.refresh();
        })
      }
    >
      Log out
    </Button>
  );
}
