'use client';
/**
 * LoginForm — email + password sign-in (react-hook-form + zod resolver).
 *
 * Seven states (design.md §3):
 *   default/hover/focus-visible/active/disabled → ui/Input + ui/Button tokens.
 *   loading  → isPending: submit shows spinner, fields disabled, aria-busy on form.
 *   error    → per-field messages via aria-describedby + aria-invalid (Input handles);
 *              form-level failure shown in a role="alert" banner.
 * Submit calls loginAction (server action) and routes the discriminated Result.
 */
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginInputSchema, type LoginInput } from '@travela/shared';
import { Button, Input } from '@/components/ui';
import { loginAction } from '../actions.js';
import { GoogleButton } from './GoogleButton.js';

export interface LoginFormProps {
  /** Optional extra hook after a successful sign-in (navigation happens regardless). */
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        onSuccess?.();
        const next = searchParams.get('next') || '/';
        router.push(next);
        router.refresh(); // re-render server components so the nav reflects the session
        return;
      }
      // Map field-level errors back onto inputs; otherwise show a banner.
      const fields = result.error.fields;
      if (fields) {
        for (const [name, messages] of Object.entries(fields)) {
          if (name in values) {
            setError(name as keyof LoginInput, { message: messages[0] });
          }
        }
      }
      setFormError(result.error.message);
    });
  });

  return (
    <form onSubmit={onSubmit} aria-busy={isPending} noValidate className="flex flex-col gap-4">
      {formError ? (
        <p
          role="alert"
          className="rounded-sm bg-surface-danger px-3 py-2 text-sm text-content-danger"
        >
          {formError}
        </p>
      ) : null}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        disabled={isPending}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        disabled={isPending}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" variant="primary" loading={isPending} className="w-full">
        Sign in
      </Button>

      <div className="flex items-center gap-3 py-1" aria-hidden="true">
        <span className="h-px flex-1 bg-line-default" />
        <span className="text-xs text-content-muted">or</span>
        <span className="h-px flex-1 bg-line-default" />
      </div>

      <GoogleButton />
    </form>
  );
}
