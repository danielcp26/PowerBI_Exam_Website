import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthMode = 'sign-in' | 'sign-up' | 'reset-request';

function passwordIssues(password: string) {
  const checks = [
    ['at least 12 characters', password.length >= 12],
    ['an uppercase letter', /[A-Z]/.test(password)],
    ['a lowercase letter', /[a-z]/.test(password)],
    ['a number', /\d/.test(password)],
    ['a symbol', /[^A-Za-z0-9]/.test(password)],
  ] as const;
  return checks.filter(([, valid]) => !valid).map(([label]) => label);
}

export function LoginPage({ setupError }: { setupError?: string | null }) {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const issues = useMemo(() => passwordIssues(password), [password]);
  const creatingAccount = mode === 'sign-up';
  const requestingReset = mode === 'reset-request';

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus(null);
    setError(null);
  }

  async function resendConfirmation() {
    setError(null);
    setStatus(null);
    if (!email.trim()) {
      setError('Enter your email address first, then resend the confirmation.');
      return;
    }

    setSubmitting(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSubmitting(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }
    setStatus('If this account is awaiting confirmation, a new confirmation email has been sent. Check spam and promotions folders too.');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (requestingReset) {
      setSubmitting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setStatus('If an account exists for this address, a password-reset link is on its way.');
      return;
    }

    if (creatingAccount) {
      const trimmedAlias = alias.trim();
      if (trimmedAlias.length < 2) {
        setError('Choose an alias with at least two characters.');
        return;
      }
      if (issues.length > 0) {
        setError(`Password needs ${issues.join(', ')}.`);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    if (creatingAccount) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { alias: alias.trim(), display_name: alias.trim() },
        },
      });
      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setStatus('Account created. Confirm your email, then sign in with the password you just created.');
        setMode('sign-in');
        return;
      }

      setStatus('Account created. Signing you in...');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <main className="login-shell mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
      <aside className="login-art hidden min-h-[620px] flex-col justify-between p-9 lg:flex">
        <div className="inline-flex w-fit items-center gap-2 border border-teal-300/30 bg-slate-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
          <span className="h-2 w-2 bg-teal-300" /> PL-300 / Private Arena
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Power BI Data Analyst</p>
          <h2 className="mt-5 max-w-md text-5xl font-semibold leading-[1.04] tracking-tight text-white">Data. Decisions. Discipline.</h2>
        </div>
        <div className="flex items-center justify-between border-t border-white/15 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"><span>Practice with intent</span><span>01 / 01</span></div>
      </aside>
      <section className="app-panel w-full rounded-lg border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-teal-100 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><UserRound className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PL-300 Practice Arena</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Private practice workspace</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <button type="button" onClick={() => switchMode('sign-in')} className={`rounded px-3 py-2 text-sm font-semibold ${!creatingAccount ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500'}`}>Sign in</button>
          <button type="button" onClick={() => switchMode('sign-up')} className={`rounded px-3 py-2 text-sm font-semibold ${creatingAccount ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500'}`}>Create account</button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold">
            Email address
            <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <Mail className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent py-3 outline-none" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </span>
          </label>

          {creatingAccount ? (
            <label className="block text-sm font-semibold">
              Leaderboard alias
              <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950" required maxLength={32} value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Daniel" />
              <span className="mt-2 block text-xs font-normal text-slate-500">Shown on the leaderboard. Your email remains private.</span>
            </label>
          ) : null}

          {!requestingReset ? <label className="block text-sm font-semibold">
            Password
            <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent py-3 outline-none" required minLength={12} type="password" autoComplete={creatingAccount ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            </span>
          </label> : null}

          {creatingAccount ? (
            <>
              <label className="block text-sm font-semibold">
                Confirm password
                <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950" required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
              <p className="rounded-md bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-400">Use 12+ characters with uppercase, lowercase, a number, and a symbol. Supabase also enforces the password policy configured for your project.</p>
            </>
          ) : null}

          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
          {setupError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">Sign-in worked, but the practice profile could not be created: {setupError}</p> : null}
          {status ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">{status}</p> : null}

          <button disabled={submitting} className="signal-action inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60" type="submit">
            {submitting ? 'Please wait...' : creatingAccount ? 'Create secure account' : requestingReset ? 'Send reset link' : 'Sign in'}
            <ArrowRight className="h-5 w-5" />
          </button>
          {!creatingAccount && !requestingReset ? (
            <div className="flex flex-col gap-2 text-center">
              <button type="button" onClick={() => switchMode('reset-request')} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">Forgot password or need to set one?</button>
              <button type="button" disabled={submitting} onClick={resendConfirmation} className="text-sm font-semibold text-teal-700 hover:underline disabled:opacity-60 dark:text-teal-300">Resend confirmation email</button>
            </div>
          ) : null}
          {requestingReset ? <button type="button" onClick={() => switchMode('sign-in')} className="w-full text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">Back to sign in</button> : null}
        </form>
      </section>
    </main>
  );
}
