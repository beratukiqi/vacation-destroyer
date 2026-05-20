'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../auth.module.scss';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Lösenorden matchar inte');
      return;
    }
    if (password.length < 8) {
      setError('Lösenord måste vara minst 8 tecken');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Något gick fel vid registreringen');
        setSubmitting(false);
        return;
      }
      const signInRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/',
      });
      setSubmitting(false);
      if (!signInRes || signInRes.error) {
        router.push('/login');
        return;
      }
      router.push(signInRes.url ?? '/');
      router.refresh();
    } catch {
      setSubmitting(false);
      setError('Kunde inte nå servern');
    }
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

        <h1 className={styles.title}>Skapa konto</h1>
        <p className={styles.subtitle}>
          Nya konton registreras som anställd. Kontakta din chef för andra behörigheter.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Namn
            </label>
            <input
              id="name"
              className="input"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="För- och efternamn"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">
              Bekräfta lösenord
            </label>
            <input
              id="confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submit}`}
            disabled={submitting}
          >
            {submitting ? 'Skapar konto…' : 'Skapa konto'}
          </button>
        </form>

        <div className={styles.footer}>
          Har du redan konto? <Link href="/login">Logga in</Link>
        </div>
      </div>
    </div>
  );
}
