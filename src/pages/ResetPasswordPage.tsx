import { ArrowRight, LockKeyhole } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function passwordIssues(password: string) {
  return [
    ['at least 12 characters', password.length >= 12],
    ['an uppercase letter', /[A-Z]/.test(password)],
    ['a lowercase letter', /[a-z]/.test(password)],
    ['a number', /\d/.test(password)],
    ['a symbol', /[^A-Za-z0-9]/.test(password)],
  ] as const;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const missingRequirements = useMemo(() => passwordIssues(password).filter(([, valid]) => !valid).map(([label]) => label), [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (missingRequirements.length > 0) {
      setError(`Password needs ${missingRequirements.join(', ')}.`);
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError('This reset link is invalid or has expired. Request a new one from the sign-in screen.');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Choose a strong password for your PL-300 Practice Arena account.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">New password
            <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><LockKeyhole className="h-4 w-4 text-slate-400" /><input required minLength={12} autoComplete="new-password" type="password" className="w-full bg-transparent py-3 outline-none" value={password} onChange={(event) => setPassword(event.target.value)} /></span>
          </label>
          <label className="block text-sm font-semibold">Confirm new password
            <input required autoComplete="new-password" type="password" className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
          <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{submitting ? 'Saving...' : 'Save password'} <ArrowRight className="h-5 w-5" /></button>
        </form>
      </section>
    </main>
  );
}
