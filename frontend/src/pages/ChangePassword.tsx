import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const passwordSchema = z.object({
  password: z.string().min(12, 'Password must be at least 12 characters.'),
  confirm: z.string().min(1, 'Confirm your password.'),
}).refine(values => values.password === values.confirm, { path: ['confirm'], message: 'Passwords do not match.' });

type PasswordFields = z.infer<typeof passwordSchema>;

export function ChangePassword({ onComplete }: { onComplete: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  async function submit(values: PasswordFields) {
    setError('');
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) throw updateError;
      await api('/auth/password-changed', { method: 'POST' });
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login">
    <section><p className="eyebrow">FIRST LOGIN</p><h1>Secure your account</h1><p>Replace the shared initial password before continuing.</p></section>
    <form onSubmit={handleSubmit(submit)}>
      <h2>Change password</h2>
      <label>New password<input type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />{errors.password && <span className="field-error">{errors.password.message}</span>}</label>
      <label>Confirm password<input type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />{errors.confirm && <span className="field-error">{errors.confirm.message}</span>}</label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
    </form>
  </main>;
}
