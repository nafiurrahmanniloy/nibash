'use client';
/**
 * SignupForm — register with full name + email + password (react-hook-form + zod).
 *
 * Seven states (design.md §3):
 *   default/hover/focus-visible/active/disabled → ui/Input + ui/Button tokens.
 *   loading  → isPending: submit spinner, fields disabled, form aria-busy.
 *   error    → per-field via aria-describedby + aria-invalid (Input); form-level banner.
 * Submit calls signupAction; field errors from the Result map back onto inputs.
 */
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupInputSchema, type SignupInput } from '@travela/shared';
import { Button, Input } from '@/components/ui';
import { signupAction } from '../actions.js';
import { GoogleButton } from './GoogleButton.js';

export interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupInputSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'guest' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signupAction(values);
      if (result.ok) {
        onSuccess?.();
        return;
      }
      const fields = result.error.fields;
      if (fields) {
        for (const [name, messages] of Object.entries(fields)) {
          if (name in values) {
            setError(name as keyof SignupInput, { message: messages[0] });
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
        label="Full name"
        type="text"
        autoComplete="name"
        disabled={isPending}
        error={errors.fullName?.message}
        {...register('fullName')}
      />
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
        autoComplete="new-password"
        disabled={isPending}
        error={errors.password?.message}
        hint="At least 8 characters, with a letter and a number."
        {...register('password')}
      />
      {/* role defaults to guest; host onboarding upgrades later (registered, hidden). */}
      <input type="hidden" {...register('role')} />

      <Button type="submit" variant="primary" loading={isPending} className="w-full">
        Create account
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
