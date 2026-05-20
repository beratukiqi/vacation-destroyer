'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../auth.module.scss';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setError('Felaktig e-post eller lösenord');
      return;
    }
    router.push(res.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>S</div>
          <div>
            <div className={styles.brandName}>Semester</div>
            <div className={styles.brandSub}>Domstolsverket IT</div>
          </div>
        </div>

        <h1 className={styles.title}>Logga in</h1>
        <p className={styles.subtitle}>Logga in för att hantera din semester.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              E-post
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn.efternamn@dom.se"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Lösenord
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submit}`}
            disabled={submitting}
          >
            {submitting ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>

        <div className={styles.demoHint}>
          Demo: använd en av de seedade anställda (t.ex.{' '}
          <code>anna.lindqvist@dom.se</code> för chef, <code>noah.berg@dom.se</code>{' '}
          för anställd) med lösenord <code>Sommar2026!</code>.
        </div>

        <div className={styles.footer}>
          Saknar du konto? <Link href="/register">Registrera dig</Link>
        </div>
      </div>
    </div>
  );
}
